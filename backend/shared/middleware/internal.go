package middleware

import (
	"crypto/subtle"
	"net/http"

	"backend/shared/apperr"
	"backend/shared/httpjson"
)

const HeaderInternalSecret = "X-Internal-Secret"

func RequireInternalSecret(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if secret == "" || subtle.ConstantTimeCompare([]byte(r.Header.Get(HeaderInternalSecret)), []byte(secret)) != 1 {
				httpjson.WriteError(w, r, apperr.New(http.StatusForbidden, apperr.CodeInternalAuthFailed, "Internal authentication failed."))
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
