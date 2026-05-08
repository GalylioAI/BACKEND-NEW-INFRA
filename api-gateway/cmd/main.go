package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"backend/api-gateway/internal/config"
	"backend/api-gateway/internal/router"
	"backend/shared/logging"

	"github.com/redis/go-redis/v9"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}
	logger := logging.New("api-gateway", cfg.AppEnv)
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	var redisClient *redis.Client
	if cfg.RedisURL != "" {
		options, err := redis.ParseURL(cfg.RedisURL)
		if err != nil {
			logger.Fatal().Err(err).Msg("invalid_redis_url")
		}
		redisClient = redis.NewClient(options)
		defer func() {
			if err := redisClient.Close(); err != nil {
				logger.Warn().Err(err).Msg("redis_close_failed")
			}
		}()
	}

	server := &http.Server{
		Addr:              ":" + cfg.AppPort,
		Handler:           router.New(cfg, logger, redisClient),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		logger.Info().Str("port", cfg.AppPort).Msg("api_gateway_started")
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Fatal().Err(err).Msg("http_server_failed")
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error().Err(err).Msg("http_shutdown_failed")
	}
	logger.Info().Msg("shutdown_complete")
}
