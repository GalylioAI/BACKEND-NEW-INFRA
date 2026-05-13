package middleware

import (
	"context"
	"net/http"

	"github.com/google/uuid"
)

type requestIDKey struct{}

const HeaderRequestID = "X-Request-Id"

func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := r.Header.Get(HeaderRequestID)
		if requestID == "" {
			requestID = uuid.NewString()
		}
		r.Header.Set(HeaderRequestID, requestID)
		w.Header().Set(HeaderRequestID, requestID)
		ctx := context.WithValue(r.Context(), requestIDKey{}, requestID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func RequestIDFromContext(ctx context.Context) string {
	value, _ := ctx.Value(requestIDKey{}).(string)
	if value == "" {
		return "unknown"
	}
	return value
}
