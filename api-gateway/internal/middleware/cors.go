package middleware

import (
	"net/http"
	"strconv"
	"strings"
)

type CORSConfig struct {
	AllowedOrigins   []string
	AllowedMethods   []string
	AllowedHeaders   []string
	AllowCredentials bool
	MaxAge           int
}

func DefaultCORSConfig(allowed []string) CORSConfig {
	return CORSConfig{
		AllowedOrigins:   allowed,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type", "X-Request-Id", "X-Confirm"},
		AllowCredentials: true,
		MaxAge:           600,
	}
}

func CORS(cfg CORSConfig) func(http.Handler) http.Handler {
	allowedSet := map[string]struct{}{}
	for _, origin := range cfg.AllowedOrigins {
		allowedSet[origin] = struct{}{}
	}
	methods := joinHeaderValues(cfg.AllowedMethods)
	headers := joinHeaderValues(cfg.AllowedHeaders)
	maxAge := strconv.Itoa(cfg.MaxAge)
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" {
				if _, ok := allowedSet[origin]; ok {
					w.Header().Set("Access-Control-Allow-Origin", origin)
					w.Header().Set("Vary", "Origin")
					if cfg.AllowCredentials {
						w.Header().Set("Access-Control-Allow-Credentials", "true")
					}
					w.Header().Set("Access-Control-Allow-Headers", headers)
					w.Header().Set("Access-Control-Allow-Methods", methods)
					w.Header().Set("Access-Control-Expose-Headers", "X-Request-Id")
					w.Header().Set("Access-Control-Max-Age", maxAge)
				}
			}
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func joinHeaderValues(values []string) string {
	cleaned := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value != "" {
			cleaned = append(cleaned, value)
		}
	}
	return strings.Join(cleaned, ", ")
}

func RequireAllowedOrigin(allowed []string, routeKeys ...string) func(http.Handler) http.Handler {
	allowedSet := map[string]struct{}{}
	for _, origin := range allowed {
		allowedSet[origin] = struct{}{}
	}
	protected := map[string]struct{}{}
	for _, routeKey := range routeKeys {
		protected[routeKey] = struct{}{}
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if _, ok := protected[r.Method+" "+r.URL.Path]; !ok {
				next.ServeHTTP(w, r)
				return
			}
			origin := r.Header.Get("Origin")
			if origin == "" {
				next.ServeHTTP(w, r)
				return
			}
			if _, ok := allowedSet[origin]; !ok {
				writeError(w, r, http.StatusForbidden, "INVALID_ORIGIN", "Request origin is not allowed.")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
