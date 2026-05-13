package config

import (
	"crypto/rsa"
	"fmt"
	"os"
	"time"

	sharedcfg "backend/shared/config"

	jwtlib "github.com/golang-jwt/jwt/v5"
)

type Config struct {
	AppPort                string
	AppEnv                 string
	InternalSecret         string
	PublicKeyPath          string
	PublicKey              *rsa.PublicKey
	JWTIssuer              string
	JWTAudience            string
	JWTSigningAlgorithm    string
	AllowedOrigins         []string
	AllowedMethods         []string
	AllowedHeaders         []string
	CORSAllowCredentials   bool
	CORSMaxAge             int
	AuthServiceURL         string
	UserServiceURL         string
	OTPServiceURL          string
	FavoritesServiceURL    string
	AlertsServiceURL       string
	RedisURL               string
	TrustedProxyCIDRs      []string
	RateLimitDefaultLimit  int
	RateLimitDefaultWindow time.Duration
	RateLimitLoginLimit    int
	RateLimitLoginWindow   time.Duration
	RateLimitOTPLimit      int
	RateLimitOTPWindow     time.Duration
	DocsEnabled            bool
	RequestTimeout         time.Duration
	ShutdownTimeout        time.Duration
	ReadHeaderTimeout      time.Duration
	ReadTimeout            time.Duration
	WriteTimeout           time.Duration
	IdleTimeout            time.Duration
	BodyLimitBytes         int64
}

func Load() (Config, error) {
	publicKeyPath := sharedcfg.String("RS256_PUBLIC_KEY_PATH", sharedcfg.String("JWT_PUBLIC_KEY_PATH", "/run/secrets/jwt_public.pem"))
	publicPEM, err := os.ReadFile(publicKeyPath)
	if err != nil {
		return Config{}, err
	}
	publicKey, err := jwtlib.ParseRSAPublicKeyFromPEM(publicPEM)
	if err != nil {
		return Config{}, err
	}
	origins := sharedcfg.CSV("CORS_ALLOWED_ORIGINS")
	if len(origins) == 0 {
		origins = sharedcfg.CSV("ALLOWED_ORIGINS")
	}
	cfg := Config{
		AppPort:                sharedcfg.String("APP_PORT", "8080"),
		AppEnv:                 sharedcfg.String("APP_ENV", "development"),
		InternalSecret:         sharedcfg.String("INTERNAL_SECRET", ""),
		PublicKeyPath:          publicKeyPath,
		PublicKey:              publicKey,
		JWTIssuer:              sharedcfg.String("JWT_ISSUER", "your-app-name"),
		JWTAudience:            sharedcfg.String("JWT_AUDIENCE", "your-app-client"),
		JWTSigningAlgorithm:    sharedcfg.String("JWT_SIGNING_ALGORITHM", "RS256"),
		AllowedOrigins:         origins,
		AllowedMethods:         withDefault(sharedcfg.CSV("CORS_ALLOWED_METHODS"), []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		AllowedHeaders:         withDefault(sharedcfg.CSV("CORS_ALLOWED_HEADERS"), []string{"Authorization", "Content-Type", "X-Request-Id", "X-Confirm"}),
		CORSAllowCredentials:   sharedcfg.Bool("CORS_ALLOW_CREDENTIALS", true),
		CORSMaxAge:             mustInt("CORS_MAX_AGE", 600),
		AuthServiceURL:         sharedcfg.String("AUTH_SERVICE_URL", "http://auth-service:8081"),
		UserServiceURL:         sharedcfg.String("USER_SERVICE_URL", "http://user-service:8082"),
		OTPServiceURL:          sharedcfg.String("OTP_SERVICE_URL", "http://otp-service:8083"),
		FavoritesServiceURL:    sharedcfg.String("FAVORITES_SERVICE_URL", "http://favorites-service:8084"),
		AlertsServiceURL:       sharedcfg.String("ALERTS_SERVICE_URL", "http://alerts-service:8085"),
		RedisURL:               sharedcfg.String("REDIS_URL", ""),
		TrustedProxyCIDRs:      sharedcfg.CSV("TRUSTED_PROXY_CIDRS"),
		RateLimitDefaultLimit:  mustInt("RATE_LIMIT_DEFAULT_LIMIT", 60),
		RateLimitDefaultWindow: mustDuration("RATE_LIMIT_DEFAULT_WINDOW", time.Minute),
		RateLimitLoginLimit:    mustInt("RATE_LIMIT_LOGIN_LIMIT", 5),
		RateLimitLoginWindow:   mustDuration("RATE_LIMIT_LOGIN_WINDOW", time.Minute),
		RateLimitOTPLimit:      mustInt("RATE_LIMIT_OTP_LIMIT", 3),
		RateLimitOTPWindow:     mustDuration("RATE_LIMIT_OTP_WINDOW", time.Minute),
		DocsEnabled:            sharedcfg.Bool("DOCS_ENABLED", true),
		RequestTimeout:         mustDuration("REQUEST_TIMEOUT", 30*time.Second),
		ShutdownTimeout:        mustDuration("SHUTDOWN_TIMEOUT", 10*time.Second),
		ReadHeaderTimeout:      mustDuration("READ_HEADER_TIMEOUT", 5*time.Second),
		ReadTimeout:            mustDuration("READ_TIMEOUT", 10*time.Second),
		WriteTimeout:           mustDuration("WRITE_TIMEOUT", 30*time.Second),
		IdleTimeout:            mustDuration("IDLE_TIMEOUT", 60*time.Second),
		BodyLimitBytes:         int64(mustInt("BODY_LIMIT_BYTES", 1<<20)),
	}
	if len(cfg.TrustedProxyCIDRs) == 0 {
		cfg.TrustedProxyCIDRs = []string{"127.0.0.1/32", "::1/128"}
	}
	if cfg.InternalSecret == "" && cfg.AppEnv == "production" {
		return Config{}, fmt.Errorf("INTERNAL_SECRET is required in production")
	}
	if cfg.JWTSigningAlgorithm != "RS256" {
		return Config{}, fmt.Errorf("JWT_SIGNING_ALGORITHM must be RS256")
	}
	if cfg.AppEnv == "production" {
		if len(cfg.AllowedOrigins) == 0 {
			return Config{}, fmt.Errorf("CORS_ALLOWED_ORIGINS is required in production")
		}
		for _, origin := range cfg.AllowedOrigins {
			if origin == "*" {
				return Config{}, fmt.Errorf("CORS_ALLOWED_ORIGINS must not contain wildcard in production")
			}
		}
	}
	return cfg, nil
}

func withDefault(values, fallback []string) []string {
	if len(values) == 0 {
		return fallback
	}
	return values
}

func mustInt(key string, fallback int) int {
	value, err := sharedcfg.Int(key, fallback)
	if err != nil {
		return fallback
	}
	return value
}

func mustDuration(key string, fallback time.Duration) time.Duration {
	value, err := sharedcfg.Duration(key, fallback)
	if err != nil {
		return fallback
	}
	return value
}
