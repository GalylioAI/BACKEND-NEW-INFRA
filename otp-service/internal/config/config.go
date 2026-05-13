package config

import (
	"fmt"
	"time"

	sharedcfg "backend/shared/config"
	"backend/shared/db"
)

type Config struct {
	AppPort                 string
	AppEnv                  string
	AllowedOrigins          []string
	InternalSecret          string
	UserServiceURL          string
	AuthServiceURL          string
	RabbitMQURL             string
	JWTPublicKeyPath        string
	JWTIssuer               string
	JWTAudience             string
	JWTSigningAlgorithm     string
	EmailVerificationOTPTTL time.Duration
	PasswordResetOTPTTL     time.Duration
	PasswordResetTokenTTL   time.Duration
	TwoFactorLoginOTPTTL    time.Duration
	TwoFactorEnableOTPTTL   time.Duration
	TwoFactorDisableOTPTTL  time.Duration
	OTPMaxAttempts          int
	MigrationDatabaseURL    string
	DB                      db.Config
	RateLimitMax            int
	RateLimitWindow         time.Duration
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
	emailOTPTTL, err := sharedcfg.Duration("EMAIL_VERIFICATION_OTP_EXPIRY", 10*time.Minute)
	if err != nil {
		return Config{}, err
	}
	passwordOTPTTL, err := sharedcfg.Duration("PASSWORD_RESET_OTP_EXPIRY", 10*time.Minute)
	if err != nil {
		return Config{}, err
	}
	passwordTokenTTL, err := sharedcfg.Duration("PASSWORD_RESET_TOKEN_EXPIRY", 15*time.Minute)
	if err != nil {
		return Config{}, err
	}
	twoFactorLoginTTL, err := sharedcfg.Duration("TWO_FACTOR_LOGIN_OTP_EXPIRY", 10*time.Minute)
	if err != nil {
		return Config{}, err
	}
	twoFactorEnableTTL, err := sharedcfg.Duration("TWO_FACTOR_ENABLE_OTP_EXPIRY", 10*time.Minute)
	if err != nil {
		return Config{}, err
	}
	twoFactorDisableTTL, err := sharedcfg.Duration("TWO_FACTOR_DISABLE_OTP_EXPIRY", 10*time.Minute)
	if err != nil {
		return Config{}, err
	}
	otpMaxAttempts, err := sharedcfg.Int("OTP_MAX_ATTEMPTS", 3)
	if err != nil {
		return Config{}, err
	}
	cfg := Config{
		AppPort:                 sharedcfg.String("APP_PORT", "8083"),
		AppEnv:                  sharedcfg.String("APP_ENV", "development"),
		AllowedOrigins:          sharedcfg.CSV("ALLOWED_ORIGINS"),
		InternalSecret:          sharedcfg.String("INTERNAL_SECRET", ""),
		UserServiceURL:          sharedcfg.String("USER_SERVICE_URL", "http://user-service:8082"),
		AuthServiceURL:          sharedcfg.String("AUTH_SERVICE_URL", "http://auth-service:8081"),
		RabbitMQURL:             sharedcfg.String("RABBITMQ_URL", ""),
		JWTPublicKeyPath:        sharedcfg.String("JWT_PUBLIC_KEY_PATH", "/run/secrets/jwt_public.pem"),
		JWTIssuer:               sharedcfg.String("JWT_ISSUER", "your-app-name"),
		JWTAudience:             sharedcfg.String("JWT_AUDIENCE", "your-app-client"),
		JWTSigningAlgorithm:     sharedcfg.String("JWT_SIGNING_ALGORITHM", "RS256"),
		EmailVerificationOTPTTL: emailOTPTTL,
		PasswordResetOTPTTL:     passwordOTPTTL,
		PasswordResetTokenTTL:   passwordTokenTTL,
		TwoFactorLoginOTPTTL:    twoFactorLoginTTL,
		TwoFactorEnableOTPTTL:   twoFactorEnableTTL,
		TwoFactorDisableOTPTTL:  twoFactorDisableTTL,
		OTPMaxAttempts:          otpMaxAttempts,
		MigrationDatabaseURL:    sharedcfg.String("MIGRATION_DATABASE_URL", ""),
		DB: db.Config{
			Host:         sharedcfg.String("DB_HOST", "localhost"),
			Port:         dbPort,
			Name:         sharedcfg.String("DB_NAME", "otp_db"),
			User:         sharedcfg.String("DB_USER", "otp_user"),
			Password:     sharedcfg.String("DB_PASSWORD", "otp_pass"),
			SSLMode:      sharedcfg.String("DB_SSLMODE", "disable"),
			MaxOpenConns: int32(maxOpen),
			MaxIdleConns: int32(maxIdle),
		},
		RateLimitMax:    rateMax,
		RateLimitWindow: rateWindow,
	}
	if cfg.InternalSecret == "" && cfg.AppEnv == "production" {
		return Config{}, fmt.Errorf("INTERNAL_SECRET is required in production")
	}
	if cfg.JWTSigningAlgorithm != "RS256" {
		return Config{}, fmt.Errorf("JWT_SIGNING_ALGORITHM must be RS256")
	}
	return cfg, nil
}
