package config

import (
	"time"

	sharedcfg "backend/shared/config"
	"backend/shared/db"
)

type Config struct {
	AppPort                string
	AppEnv                 string
	AllowedOrigins         []string
	InternalSecret         string
	AuthServiceURL         string
	RabbitMQURL            string
	MigrationDatabaseURL   string
	DB                     db.Config
	LoginMaxAttempts       int
	AccountLockoutDuration time.Duration
	RecentAuthWindow       time.Duration
	RateLimitMax           int
	RateLimitWindow        time.Duration
}

func Load() (Config, error) {
	port := sharedcfg.String("APP_PORT", "8082")
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
	loginMaxAttempts, err := sharedcfg.Int("LOGIN_MAX_ATTEMPTS", 5)
	if err != nil {
		return Config{}, err
	}
	lockoutDuration, err := sharedcfg.Duration("ACCOUNT_LOCKOUT_DURATION", 15*time.Minute)
	if err != nil {
		return Config{}, err
	}
	recentAuthWindow, err := sharedcfg.Duration("RECENT_AUTH_WINDOW", 10*time.Minute)
	if err != nil {
		return Config{}, err
	}
	cfg := Config{
		AppPort:              port,
		AppEnv:               sharedcfg.String("APP_ENV", "development"),
		AllowedOrigins:       sharedcfg.CSV("ALLOWED_ORIGINS"),
		InternalSecret:       sharedcfg.String("INTERNAL_SECRET", ""),
		AuthServiceURL:       sharedcfg.String("AUTH_SERVICE_URL", "http://auth-service:8081"),
		RabbitMQURL:          sharedcfg.String("RABBITMQ_URL", ""),
		MigrationDatabaseURL: sharedcfg.String("MIGRATION_DATABASE_URL", ""),
		DB: db.Config{
			Host:         sharedcfg.String("DB_HOST", "localhost"),
			Port:         dbPort,
			Name:         sharedcfg.String("DB_NAME", "user_db"),
			User:         sharedcfg.String("DB_USER", "user_user"),
			Password:     sharedcfg.String("DB_PASSWORD", "user_pass"),
			SSLMode:      sharedcfg.String("DB_SSLMODE", "disable"),
			MaxOpenConns: int32(maxOpen),
			MaxIdleConns: int32(maxIdle),
		},
		LoginMaxAttempts:       loginMaxAttempts,
		AccountLockoutDuration: lockoutDuration,
		RecentAuthWindow:       recentAuthWindow,
		RateLimitMax:           rateMax,
		RateLimitWindow:        rateWindow,
	}
	if err := sharedcfg.ValidateInternalSecret(cfg.InternalSecret, cfg.AppEnv); err != nil {
		return Config{}, err
	}
	if sharedcfg.IsProduction(cfg.AppEnv) && len(cfg.AllowedOrigins) == 0 {
		cfg.AllowedOrigins = nil
	}
	return cfg, nil
}
