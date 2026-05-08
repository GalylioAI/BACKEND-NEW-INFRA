package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"backend/favorites-service/internal/config"
	"backend/favorites-service/internal/handler"
	"backend/favorites-service/internal/repository"
	"backend/favorites-service/internal/service"
	"backend/shared/db"
	"backend/shared/health"
	"backend/shared/logging"
	"backend/shared/middleware"
	"backend/shared/migration"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}
	logger := logging.New("favorites-service", cfg.AppEnv)
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
	favoritesService := service.New(repo)
	readiness := health.NewReadiness()
	healthHandler := health.ReadyHandler("1.0.0", readiness, map[string]health.Checker{"database": favoritesService.Ping})
	root := handler.New(favoritesService, cfg.InternalSecret, healthHandler).Routes()
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
		logger.Info().Str("port", cfg.AppPort).Msg("favorites_service_started")
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
