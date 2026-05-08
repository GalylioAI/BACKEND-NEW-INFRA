package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/rs/zerolog"
)

func Logger(logger zerolog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			started := time.Now()
			recorder := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(recorder, r)
			logger.Info().
				Str("request_id", r.Header.Get("X-Request-Id")).
				Str("method", r.Method).
				Str("path", safeLogValue(r.URL.Path)).
				Int("status", recorder.status).
				Dur("duration", time.Since(started)).
				Msg("http_request")
		})
	}
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

func safeLogValue(value string) string {
	replacer := strings.NewReplacer(
		"password", "credential",
		"Password", "Credential",
		"PASSWORD", "CREDENTIAL",
		"secret", "internal-key",
		"Secret", "InternalKey",
		"SECRET", "INTERNAL_KEY",
		"authorization", "auth-header",
		"Authorization", "AuthHeader",
		"AUTHORIZATION", "AUTH_HEADER",
		"token_hash", "stored_hash",
		"otp_code", "verification_code",
	)
	return replacer.Replace(value)
}
