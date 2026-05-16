package config

import (
	"time"

	sharedcfg "backend/shared/config"
	"backend/shared/db"
)

type Config struct {
	AppPort              string
	AppEnv               string
	AllowedOrigins       []string
	InternalSecret       string
	UserServiceURL       string
	RabbitMQURL          string
	MigrationDatabaseURL string
	DB                   db.Config
	RateLimitMax         int
	RateLimitWindow      time.Duration
}

func Load() (Config, error) {
	dbPort, err := sharedcfg.Int("DB_PORT", 5432)
	if err != nil {
		return Config{}, err
	}
	maxOpen, err := sharedcfg.Int("DB_MAX_OPEN_CONNS", 25)
	if err != nil {
		return Config{}, err
	}
	maxIdle, err := sharedcfg.Int("DB_MAX_IDLE_CONNS", 5)
	if err != nil {
		return Config{}, err
	}
	rateMax, err := sharedcfg.Int("RATE_LIMIT_MAX", 60)
	if err != nil {
		return Config{}, err
	}
	rateWindow, err := sharedcfg.Duration("RATE_LIMIT_WINDOW", time.Minute)
	if err != nil {
		return Config{}, err
	}
	cfg := Config{
		AppPort:              sharedcfg.String("APP_PORT", "8085"),
		AppEnv:               sharedcfg.String("APP_ENV", "development"),
		AllowedOrigins:       sharedcfg.CSV("ALLOWED_ORIGINS"),
		InternalSecret:       sharedcfg.String("INTERNAL_SECRET", ""),
		UserServiceURL:       sharedcfg.String("USER_SERVICE_URL", "http://user-service:8082"),
		RabbitMQURL:          sharedcfg.String("RABBITMQ_URL", ""),
		MigrationDatabaseURL: sharedcfg.String("MIGRATION_DATABASE_URL", ""),
		DB: db.Config{
			Host:         sharedcfg.String("DB_HOST", "localhost"),
			Port:         dbPort,
			Name:         sharedcfg.String("DB_NAME", "alerts_db"),
			User:         sharedcfg.String("DB_USER", "alerts_user"),
			Password:     sharedcfg.String("DB_PASSWORD", "alerts_pass"),
			SSLMode:      sharedcfg.String("DB_SSLMODE", "disable"),
			MaxOpenConns: int32(maxOpen),
			MaxIdleConns: int32(maxIdle),
		},
		RateLimitMax:    rateMax,
		RateLimitWindow: rateWindow,
	}
	if err := sharedcfg.ValidateInternalSecret(cfg.InternalSecret, cfg.AppEnv); err != nil {
		return Config{}, err
	}
	return cfg, nil
}
