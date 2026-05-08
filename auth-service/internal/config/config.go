package config

import (
	"fmt"
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
	OTPServiceURL        string
	JWTPrivateKeyPath    string
	JWTPublicKeyPath     string
	JWTIssuer            string
	JWTAudience          string
	JWTAccessExpiry      time.Duration
	JWTRefreshExpiry     time.Duration
	GoogleClientID       string
	RefreshCookieSecure  bool
	CookieDomain         string
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
	accessExpiry, err := sharedcfg.Duration("JWT_ACCESS_EXPIRY", 15*time.Minute)
	if err != nil {
		return Config{}, err
	}
	refreshExpiry, err := sharedcfg.Duration("JWT_REFRESH_EXPIRY", 720*time.Hour)
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
		AppPort:              sharedcfg.String("APP_PORT", "8081"),
		AppEnv:               sharedcfg.String("APP_ENV", "development"),
		AllowedOrigins:       sharedcfg.CSV("ALLOWED_ORIGINS"),
		InternalSecret:       sharedcfg.String("INTERNAL_SECRET", ""),
		UserServiceURL:       sharedcfg.String("USER_SERVICE_URL", "http://user-service:8082"),
		OTPServiceURL:        sharedcfg.String("OTP_SERVICE_URL", "http://otp-service:8083"),
		JWTPrivateKeyPath:    sharedcfg.String("JWT_PRIVATE_KEY_PATH", "/run/secrets/jwt_private.pem"),
		JWTPublicKeyPath:     sharedcfg.String("JWT_PUBLIC_KEY_PATH", "/run/secrets/jwt_public.pem"),
		JWTIssuer:            sharedcfg.String("JWT_ISSUER", "your-app-name"),
		JWTAudience:          sharedcfg.String("JWT_AUDIENCE", "your-app-client"),
		JWTAccessExpiry:      accessExpiry,
		JWTRefreshExpiry:     refreshExpiry,
		GoogleClientID:       sharedcfg.String("GOOGLE_CLIENT_ID", ""),
		RefreshCookieSecure:  sharedcfg.String("COOKIE_SECURE", sharedcfg.String("REFRESH_COOKIE_SECURE", "true")) != "false",
		CookieDomain:         sharedcfg.String("COOKIE_DOMAIN", ""),
		MigrationDatabaseURL: sharedcfg.String("MIGRATION_DATABASE_URL", ""),
		DB: db.Config{
			Host:         sharedcfg.String("DB_HOST", "localhost"),
			Port:         dbPort,
			Name:         sharedcfg.String("DB_NAME", "auth_db"),
			User:         sharedcfg.String("DB_USER", "auth_user"),
			Password:     sharedcfg.String("DB_PASSWORD", "auth_pass"),
			MaxOpenConns: int32(maxOpen),
			MaxIdleConns: int32(maxIdle),
		},
		RateLimitMax:    rateMax,
		RateLimitWindow: rateWindow,
	}
	if cfg.InternalSecret == "" && cfg.AppEnv == "production" {
		return Config{}, fmt.Errorf("INTERNAL_SECRET is required in production")
	}
	return cfg, nil
}
