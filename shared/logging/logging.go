package logging

import (
	"net/http"
	"os"
	"strings"
	"time"

	"backend/shared/middleware"

	"github.com/rs/zerolog"
)

func New(service, env string) zerolog.Logger {
	level := zerolog.InfoLevel
	if env != "production" {
		level = zerolog.DebugLevel
	}
	zerolog.SetGlobalLevel(level)
	return zerolog.New(os.Stdout).With().Timestamp().Str("service", service).Logger()
}

func HTTP(logger zerolog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			started := time.Now()
			recorder := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(recorder, r)
			logger.Info().
				Str("request_id", middleware.RequestIDFromContext(r.Context())).
				Str("method", r.Method).
				Str("path", safeLogValue(r.URL.Path)).
				Int("status", recorder.status).
				Dur("duration", time.Since(started)).
				Msg("http_request")
		})
	}
}

func safeLogValue(value string) string {
	replacer := strings.NewReplacer(
		"password", "credential",
		"Password", "Credential",
		"PASSWORD", "CREDENTIAL",
		"secret", "internal-key",
		"Secret", "InternalKey",
		"SECRET", "INTERNAL_KEY",
		"token_hash", "stored_hash",
		"otp_code", "verification_code",
	)
	return replacer.Replace(value)
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}
