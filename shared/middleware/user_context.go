package middleware

import (
	"net/http"

	"backend/shared/httpjson"
	"backend/shared/userctx"
)

func RequireUserContext(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, err := userctx.FromHeaders(r)
		if err != nil {
			httpjson.WriteError(w, r, err)
			return
		}
		next.ServeHTTP(w, r.WithContext(userctx.With(r.Context(), user)))
	})
}
