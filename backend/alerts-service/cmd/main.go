package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"backend/alerts-service/internal/client"
	"backend/alerts-service/internal/config"
	"backend/alerts-service/internal/handler"
	"backend/alerts-service/internal/repository"
	"backend/alerts-service/internal/service"
	"backend/shared/db"
	"backend/shared/health"
	"backend/shared/logging"
	"backend/shared/middleware"
	"backend/shared/migration"
	"backend/shared/rabbit"

	"github.com/rs/zerolog"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}
	logger := logging.New("alerts-service", cfg.AppEnv)
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	pool, err := db.Connect(ctx, cfg.DB)
	if err != nil {
		logger.Fatal().Err(err).Msg("db_connect_failed")
	}
	defer pool.Close()

	if cfg.MigrationDatabaseURL != "" {
		if err := migration.Run(cfg.MigrationDatabaseURL, "file://migrations"); err != nil {
			logger.Fatal().Err(err).Msg("migration_failed")
		}
	} else if cfg.AppEnv == "production" {
		logger.Fatal().Msg("migration_database_url_required")
	}

	repo := repository.New(pool)
	userClient := client.NewHTTPUserClient(cfg.UserServiceURL, cfg.InternalSecret)

	var publisher rabbit.Publisher = rabbit.NoopPublisher{}
	rabbitCheck := health.Checker(func(context.Context) error { return nil })
	if cfg.RabbitMQURL != "" {
		amqpPublisher, err := connectPublisher(ctx, cfg.RabbitMQURL, logger)
		if err != nil {
			logger.Fatal().Err(err).Msg("rabbitmq_connect_failed")
		}
		defer amqpPublisher.Close()
		publisher = amqpPublisher
		rabbitCheck = amqpPublisher.Check
		go service.NewDispatcher(repo, publisher, logger).Start(ctx)
	}

	alertsService := service.New(repo, userClient)
	readiness := health.NewReadiness()
	healthHandler := health.ReadyHandler("1.0.0", readiness, map[string]health.Checker{
		"database": alertsService.Ping,
		"rabbitmq": rabbitCheck,
	})
	root := handler.New(alertsService, cfg.InternalSecret, healthHandler).Routes()
	app := middleware.Chain(root,
		middleware.Recovery(logger),
		middleware.RequestID,
		middleware.SecurityHeaders,
		middleware.CORS(cfg.AllowedOrigins),
		middleware.NewRateLimiter(cfg.RateLimitMax, cfg.RateLimitWindow).Middleware,
		logging.HTTP(logger),
	)

	server := &http.Server{
		Addr:              ":" + cfg.AppPort,
		Handler:           app,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	readiness.MarkReady()
	go func() {
		logger.Info().Str("port", cfg.AppPort).Msg("alerts_service_started")
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Fatal().Err(err).Msg("http_server_failed")
		}
	}()

	<-ctx.Done()
	readiness.MarkNotReady()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error().Err(err).Msg("http_shutdown_failed")
	}
	logger.Info().Msg("shutdown_complete")
}

func connectPublisher(ctx context.Context, url string, logger zerolog.Logger) (*rabbit.AMQPPublisher, error) {
	var lastErr error
	deadline := time.NewTimer(120 * time.Second)
	defer deadline.Stop()
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()
	for {
		publisher, err := rabbit.NewManaged(url, logger)
		if err == nil {
			return publisher, nil
		}
		lastErr = err
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-deadline.C:
			return nil, lastErr
		case <-ticker.C:
		}
	}
}
