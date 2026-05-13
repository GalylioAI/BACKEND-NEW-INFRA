package middleware

import (
	"fmt"
	"net/http"
	"runtime"

	"backend/shared/apperr"
	"backend/shared/httpjson"
	"github.com/rs/zerolog"
)

func Recovery(logger zerolog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					buf := make([]byte, 64*1024)
					n := runtime.Stack(buf, false)
					requestID := r.Header.Get(HeaderRequestID)
					if requestID == "" {
						requestID = RequestIDFromContext(r.Context())
					}
					logger.Error().
						Str("request_id", requestID).
						Str("error", fmt.Sprintf("%v", err)).
						Str("stack", string(buf[:n])).
						Msg("panic recovered")
					httpjson.WriteError(w, r, apperr.Internal())
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}
