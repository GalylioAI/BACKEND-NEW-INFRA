package middleware

import "net/http"

var sensitiveHeaders = []string{
	"X-User-Id",
	"X-User-Role",
	"X-User-Email",
	"X-Auth-Time",
	"X-Auth-Methods",
	"X-Session-Id",
	"X-Internal-Secret",
	"X-2FA-Session-Token",
	"X-2FA-Pending-Token",
}

func StripSensitiveHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		for _, header := range sensitiveHeaders {
			r.Header.Del(header)
		}
		next.ServeHTTP(w, r)
	})
}
