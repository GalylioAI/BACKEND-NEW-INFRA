package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"backend/otp-service/internal/client"
	"backend/otp-service/internal/config"
	"backend/otp-service/internal/handler"
	"backend/otp-service/internal/repository"
	"backend/otp-service/internal/service"
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
	logger := logging.New("otp-service", cfg.AppEnv)
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

	verifier, err := service.NewPendingJWTVerifier(cfg.JWTPublicKeyPath, cfg.JWTIssuer, cfg.JWTAudience)
	if err != nil {
		logger.Fatal().Err(err).Msg("jwt_public_key_load_failed")
	}

	repo := repository.New(pool)
	userClient := client.NewHTTPUserClient(cfg.UserServiceURL, cfg.InternalSecret)
	authClient := client.NewHTTPAuthClient(cfg.AuthServiceURL, cfg.InternalSecret)

	var publisher rabbit.Publisher = rabbit.NoopPublisher{}
	var amqpPublisher *rabbit.AMQPPublisher
	rabbitCheck := health.Checker(func(context.Context) error { return nil })
	if cfg.RabbitMQURL != "" {
		amqpPublisher, err = connectPublisher(ctx, cfg.RabbitMQURL, logger)
		if err != nil {
			logger.Fatal().Err(err).Msg("rabbitmq_connect_failed")
		}
		defer amqpPublisher.Close()
		publisher = amqpPublisher
		rabbitCheck = amqpPublisher.Check
	}

	otpService := service.New(repo, userClient, authClient, publisher, verifier, service.Options{
		EmailVerificationOTPTTL: cfg.EmailVerificationOTPTTL,
		PasswordResetOTPTTL:     cfg.PasswordResetOTPTTL,
		PasswordResetTokenTTL:   cfg.PasswordResetTokenTTL,
		TwoFactorLoginOTPTTL:    cfg.TwoFactorLoginOTPTTL,
		TwoFactorEnableOTPTTL:   cfg.TwoFactorEnableOTPTTL,
		TwoFactorDisableOTPTTL:  cfg.TwoFactorDisableOTPTTL,
		TwoFactorMaxAttempts:    int16(cfg.OTPMaxAttempts),
		OTPResendCooldown:       cfg.OTPResendCooldown,
	})
	if amqpPublisher != nil {
		startUserCreatedConsumer(ctx, amqpPublisher, otpService, logger)
	}

	readiness := health.NewReadiness()
	healthHandler := health.ReadyHandler("1.0.0", readiness, map[string]health.Checker{
		"database": otpService.Ping,
		"rabbitmq": rabbitCheck,
	})
	root := handler.New(otpService, cfg.InternalSecret, healthHandler).Routes()
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
		logger.Info().Str("port", cfg.AppPort).Msg("otp_service_started")
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

func startUserCreatedConsumer(ctx context.Context, publisher *rabbit.AMQPPublisher, otpService *service.Service, logger zerolog.Logger) {
	start := func() bool {
		consumerChannel, err := publisher.NewChannel()
		if err != nil {
			logger.Error().Err(err).Msg("rabbitmq_consumer_channel_failed")
			return false
		}
		consumer := service.NewUserCreatedConsumer(otpService, consumerChannel, logger)
		if err := consumer.Start(ctx); err != nil {
			_ = consumerChannel.Close()
			logger.Error().Err(err).Msg("user_created_consumer_failed")
			return false
		}
		logger.Info().Msg("user_created_consumer_started")
		return true
	}

	if !start() {
		logger.Fatal().Msg("user_created_consumer_initial_start_failed")
	}
	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case <-publisher.NotifyReady():
				_ = start()
			}
		}
	}()
}
