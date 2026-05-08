package middleware

import (
	"net/http"

	"backend/shared/apperr"
	"backend/shared/httpjson"
)

func writeError(w http.ResponseWriter, r *http.Request, status int, code, message string) {
	httpjson.WriteError(w, r, apperr.New(status, code, message))
}

func writeRateLimit(w http.ResponseWriter, r *http.Request, retryAfter int) {
	httpjson.WriteError(w, r, apperr.WithRetryAfter(http.StatusTooManyRequests, "RATE_LIMIT_EXCEEDED", "Too many requests. Please try again later.", retryAfter))
}
