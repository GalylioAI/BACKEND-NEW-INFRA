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
	AppPort             string
	AppEnv              string
	InternalSecret      string
	PublicKeyPath       string
	PublicKey           *rsa.PublicKey
	JWTIssuer           string
	JWTAudience         string
	AllowedOrigins      []string
	AuthServiceURL      string
	UserServiceURL      string
	OTPServiceURL       string
	FavoritesServiceURL string
	AlertsServiceURL    string
	RedisURL            string
	TrustedProxyCIDRs   []string
	DocsEnabled         bool
	RequestTimeout      time.Duration
	BodyLimitBytes      int64
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
		AppPort:             sharedcfg.String("APP_PORT", "8080"),
		AppEnv:              sharedcfg.String("APP_ENV", "development"),
		InternalSecret:      sharedcfg.String("INTERNAL_SECRET", ""),
		PublicKeyPath:       publicKeyPath,
		PublicKey:           publicKey,
		JWTIssuer:           sharedcfg.String("JWT_ISSUER", "your-app-name"),
		JWTAudience:         sharedcfg.String("JWT_AUDIENCE", "your-app-client"),
		AllowedOrigins:      origins,
		AuthServiceURL:      sharedcfg.String("AUTH_SERVICE_URL", "http://auth-service:8081"),
		UserServiceURL:      sharedcfg.String("USER_SERVICE_URL", "http://user-service:8082"),
		OTPServiceURL:       sharedcfg.String("OTP_SERVICE_URL", "http://otp-service:8083"),
		FavoritesServiceURL: sharedcfg.String("FAVORITES_SERVICE_URL", "http://favorites-service:8084"),
		AlertsServiceURL:    sharedcfg.String("ALERTS_SERVICE_URL", "http://alerts-service:8085"),
		RedisURL:            sharedcfg.String("REDIS_URL", ""),
		TrustedProxyCIDRs:   sharedcfg.CSV("TRUSTED_PROXY_CIDRS"),
		DocsEnabled:         sharedcfg.Bool("DOCS_ENABLED", true),
		RequestTimeout:      30 * time.Second,
		BodyLimitBytes:      1 << 20,
	}
	if len(cfg.TrustedProxyCIDRs) == 0 {
		cfg.TrustedProxyCIDRs = []string{"127.0.0.1/32", "::1/128"}
	}
	if cfg.InternalSecret == "" && cfg.AppEnv == "production" {
		return Config{}, fmt.Errorf("INTERNAL_SECRET is required in production")
	}
	if cfg.AppEnv == "production" {
		for _, origin := range cfg.AllowedOrigins {
			if origin == "*" {
				return Config{}, fmt.Errorf("CORS_ALLOWED_ORIGINS must not contain wildcard in production")
			}
		}
	}
	return cfg, nil
}
