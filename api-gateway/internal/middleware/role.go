package middleware

import "net/http"

func RequireRole(roles ...string) func(http.Handler) http.Handler {
	allowed := map[string]struct{}{}
	for _, role := range roles {
		allowed[role] = struct{}{}
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if _, ok := allowed[r.Header.Get("X-User-Role")]; ok {
				next.ServeHTTP(w, r)
				return
			}
			writeError(w, r, http.StatusForbidden, "INSUFFICIENT_PERMISSIONS", "You do not have permission to access this resource.")
		})
	}
}
