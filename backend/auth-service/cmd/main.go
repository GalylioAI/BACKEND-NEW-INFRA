package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"backend/auth-service/internal/client"
	"backend/auth-service/internal/config"
	"backend/auth-service/internal/handler"
	authjwt "backend/auth-service/internal/jwt"
	"backend/auth-service/internal/repository"
	"backend/auth-service/internal/service"
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
	logger := logging.New("auth-service", cfg.AppEnv)
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

	jwtManager, err := authjwt.New(cfg.JWTPrivateKeyPath, cfg.JWTPublicKeyPath, cfg.JWTIssuer, cfg.JWTAudience, cfg.JWTAccessExpiry)
	if err != nil {
		logger.Fatal().Err(err).Msg("jwt_keys_load_failed")
	}

	repo := repository.New(pool)
	userClient := client.NewHTTPUserClient(cfg.UserServiceURL, cfg.InternalSecret)
	otpClient := client.NewHTTPOTPClient(cfg.OTPServiceURL, cfg.InternalSecret)
	authService := service.New(repo, userClient, otpClient, jwtManager, service.GoogleIDTokenVerifier{ClientID: cfg.GoogleClientID}, cfg.RefreshTokenExpiry, cfg.JWTTwoFactorPendingExpiry)
	readiness := health.NewReadiness()
	healthHandler := health.ReadyHandler("1.0.0", readiness, map[string]health.Checker{"database": authService.Ping})
	root := handler.New(authService, cfg.InternalSecret, handler.RefreshCookieConfig{
		Name:     cfg.RefreshCookieName,
		Path:     cfg.RefreshCookiePath,
		Domain:   cfg.CookieDomain,
		MaxAge:   cfg.RefreshCookieMaxAge,
		HTTPOnly: cfg.RefreshCookieHTTPOnly,
		Secure:   cfg.RefreshCookieSecure,
		SameSite: sameSite(cfg.RefreshCookieSameSite),
	}, healthHandler).Routes()
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
		ReadHeaderTimeout: cfg.ReadHeaderTimeout,
		ReadTimeout:       cfg.ReadTimeout,
		WriteTimeout:      cfg.WriteTimeout,
		IdleTimeout:       cfg.IdleTimeout,
	}

	readiness.MarkReady()
	go func() {
		logger.Info().Str("port", cfg.AppPort).Msg("auth_service_started")
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Fatal().Err(err).Msg("http_server_failed")
		}
	}()

	<-ctx.Done()
	readiness.MarkNotReady()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error().Err(err).Msg("http_shutdown_failed")
	}
	logger.Info().Msg("shutdown_complete")
}

func sameSite(value string) http.SameSite {
	switch value {
	case "None", "none", "NONE":
		return http.SameSiteNoneMode
	case "Lax", "lax", "LAX":
		return http.SameSiteLaxMode
	case "Strict", "strict", "STRICT", "":
		return http.SameSiteStrictMode
	default:
		return http.SameSiteStrictMode
	}
}
