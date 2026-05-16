package config

import (
	"fmt"
	"os"
	"strings"
	"time"

	sharedcfg "backend/shared/config"
	"backend/shared/db"
)

type Config struct {
	AppPort                   string
	AppEnv                    string
	AllowedOrigins            []string
	InternalSecret            string
	UserServiceURL            string
	OTPServiceURL             string
	JWTPrivateKeyPath         string
	JWTPublicKeyPath          string
	JWTIssuer                 string
	JWTAudience               string
	JWTSigningAlgorithm       string
	JWTAccessExpiry           time.Duration
	JWTTwoFactorPendingExpiry time.Duration
	RefreshTokenExpiry        time.Duration
	GoogleClientID            string
	RefreshCookieSecure       bool
	RefreshCookieName         string
	RefreshCookiePath         string
	RefreshCookieSameSite     string
	RefreshCookieHTTPOnly     bool
	RefreshCookieMaxAge       time.Duration
	CookieDomain              string
	RequestTimeout            time.Duration
	ShutdownTimeout           time.Duration
	ReadHeaderTimeout         time.Duration
	ReadTimeout               time.Duration
	WriteTimeout              time.Duration
	IdleTimeout               time.Duration
	MigrationDatabaseURL      string
	DB                        db.Config
	RateLimitMax              int
	RateLimitWindow           time.Duration
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
	refreshExpiry, err := sharedcfg.Duration("REFRESH_TOKEN_EXPIRY", legacyRefreshExpiry())
	if err != nil {
		return Config{}, err
	}
	pendingExpiry, err := sharedcfg.Duration("JWT_2FA_PENDING_EXPIRY", 5*time.Minute)
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
		AppPort:                   sharedcfg.String("APP_PORT", "8081"),
		AppEnv:                    sharedcfg.String("APP_ENV", "development"),
		AllowedOrigins:            sharedcfg.CSV("ALLOWED_ORIGINS"),
		InternalSecret:            sharedcfg.String("INTERNAL_SECRET", ""),
		UserServiceURL:            sharedcfg.String("USER_SERVICE_URL", "http://user-service:8082"),
		OTPServiceURL:             sharedcfg.String("OTP_SERVICE_URL", "http://otp-service:8083"),
		JWTPrivateKeyPath:         sharedcfg.String("JWT_PRIVATE_KEY_PATH", "/run/secrets/jwt_private.pem"),
		JWTPublicKeyPath:          sharedcfg.String("JWT_PUBLIC_KEY_PATH", "/run/secrets/jwt_public.pem"),
		JWTIssuer:                 sharedcfg.String("JWT_ISSUER", "your-app-name"),
		JWTAudience:               sharedcfg.String("JWT_AUDIENCE", "your-app-client"),
		JWTSigningAlgorithm:       sharedcfg.String("JWT_SIGNING_ALGORITHM", "RS256"),
		JWTAccessExpiry:           accessExpiry,
		JWTTwoFactorPendingExpiry: pendingExpiry,
		RefreshTokenExpiry:        refreshExpiry,
		GoogleClientID:            sharedcfg.String("GOOGLE_CLIENT_ID", ""),
		RefreshCookieSecure:       sharedcfg.String("COOKIE_SECURE", sharedcfg.String("REFRESH_COOKIE_SECURE", "true")) != "false",
		RefreshCookieName:         sharedcfg.String("REFRESH_COOKIE_NAME", "refresh_token"),
		RefreshCookiePath:         sharedcfg.String("REFRESH_COOKIE_PATH", "/auth"),
		RefreshCookieSameSite:     sharedcfg.String("REFRESH_COOKIE_SAMESITE", "Lax"),
		RefreshCookieHTTPOnly:     sharedcfg.Bool("REFRESH_COOKIE_HTTPONLY", true),
		RefreshCookieMaxAge:       durationOrDefault("REFRESH_COOKIE_MAX_AGE", refreshExpiry),
		CookieDomain:              sharedcfg.String("REFRESH_COOKIE_DOMAIN", sharedcfg.String("COOKIE_DOMAIN", "")),
		RequestTimeout:            durationOrDefault("REQUEST_TIMEOUT", 30*time.Second),
		ShutdownTimeout:           durationOrDefault("SHUTDOWN_TIMEOUT", 10*time.Second),
		ReadHeaderTimeout:         durationOrDefault("READ_HEADER_TIMEOUT", 5*time.Second),
		ReadTimeout:               durationOrDefault("READ_TIMEOUT", 10*time.Second),
		WriteTimeout:              durationOrDefault("WRITE_TIMEOUT", 15*time.Second),
		IdleTimeout:               durationOrDefault("IDLE_TIMEOUT", 60*time.Second),
		MigrationDatabaseURL:      sharedcfg.String("MIGRATION_DATABASE_URL", ""),
		DB: db.Config{
			Host:         sharedcfg.String("DB_HOST", "localhost"),
			Port:         dbPort,
			Name:         sharedcfg.String("DB_NAME", "auth_db"),
			User:         sharedcfg.String("DB_USER", "auth_user"),
			Password:     sharedcfg.String("DB_PASSWORD", "auth_pass"),
			SSLMode:      sharedcfg.String("DB_SSLMODE", "disable"),
			MaxOpenConns: int32(maxOpen),
			MaxIdleConns: int32(maxIdle),
		},
		RateLimitMax:    rateMax,
		RateLimitWindow: rateWindow,
	}
	applyEnvironmentDefaults(&cfg)
	if err := sharedcfg.ValidateInternalSecret(cfg.InternalSecret, cfg.AppEnv); err != nil {
		return Config{}, err
	}
	if err := sharedcfg.ValidateJWTSigningKeyPaths(cfg.JWTPrivateKeyPath, cfg.JWTPublicKeyPath, cfg.AppEnv); err != nil {
		return Config{}, err
	}
	if cfg.JWTSigningAlgorithm != "RS256" {
		return Config{}, fmt.Errorf("JWT_SIGNING_ALGORITHM must be RS256")
	}
	if sharedcfg.IsProduction(cfg.AppEnv) && !cfg.RefreshCookieSecure {
		return Config{}, fmt.Errorf("REFRESH_COOKIE_SECURE must be true in production")
	}
	if equalFold(cfg.RefreshCookieSameSite, "None") && !cfg.RefreshCookieSecure {
		return Config{}, fmt.Errorf("REFRESH_COOKIE_SECURE must be true when REFRESH_COOKIE_SAMESITE=None")
	}
	if sharedcfg.IsProduction(cfg.AppEnv) && cfg.CookieDomain == "" {
		return Config{}, fmt.Errorf("COOKIE_DOMAIN or REFRESH_COOKIE_DOMAIN is required in production")
	}
	return cfg, nil
}

func applyEnvironmentDefaults(cfg *Config) {
	if sharedcfg.IsProduction(cfg.AppEnv) {
		if !envSet("REFRESH_COOKIE_SECURE") && !envSet("COOKIE_SECURE") {
			cfg.RefreshCookieSecure = true
		}
		if !envSet("REFRESH_COOKIE_SAMESITE") {
			cfg.RefreshCookieSameSite = "None"
		}
		return
	}
	if !envSet("REFRESH_COOKIE_SECURE") && !envSet("COOKIE_SECURE") {
		cfg.RefreshCookieSecure = false
	}
	if !envSet("REFRESH_COOKIE_SAMESITE") {
		cfg.RefreshCookieSameSite = "Lax"
	}
	if !envSet("REFRESH_COOKIE_DOMAIN") && !envSet("COOKIE_DOMAIN") {
		cfg.CookieDomain = ""
	}
}

func envSet(key string) bool {
	return strings.TrimSpace(os.Getenv(key)) != ""
}

func legacyRefreshExpiry() time.Duration {
	value, err := sharedcfg.Duration("JWT_REFRESH_EXPIRY", 720*time.Hour)
	if err != nil {
		return 720 * time.Hour
	}
	return value
}

func durationOrDefault(key string, fallback time.Duration) time.Duration {
	value, err := sharedcfg.Duration(key, fallback)
	if err != nil {
		return fallback
	}
	return value
}

func equalFold(a, b string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		ca := a[i]
		cb := b[i]
		if ca >= 'A' && ca <= 'Z' {
			ca += 'a' - 'A'
		}
		if cb >= 'A' && cb <= 'Z' {
			cb += 'a' - 'A'
		}
		if ca != cb {
			return false
		}
	}
	return true
}
