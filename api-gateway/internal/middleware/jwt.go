package middleware

import (
	"crypto/rsa"
	"errors"
	"net/http"
	"strings"

	jwtlib "github.com/golang-jwt/jwt/v5"
)

type AppClaims struct {
	Type  string `json:"typ"`
	Role  string `json:"role"`
	Email string `json:"email"`
	jwtlib.RegisteredClaims
}

func JWT(publicKey *rsa.PublicKey, issuer, audience string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				writeError(w, r, http.StatusUnauthorized, "MISSING_TOKEN", "Authorization token is required.")
				return
			}
			tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
			claims := &AppClaims{}
			token, err := jwtlib.ParseWithClaims(tokenString, claims, func(token *jwtlib.Token) (any, error) {
				return publicKey, nil
			}, jwtlib.WithIssuer(issuer), jwtlib.WithAudience(audience), jwtlib.WithValidMethods([]string{jwtlib.SigningMethodRS256.Alg()}))
			if err != nil || !token.Valid {
				if errors.Is(err, jwtlib.ErrTokenExpired) {
					writeError(w, r, http.StatusUnauthorized, "TOKEN_EXPIRED", "Access token has expired.")
					return
				}
				writeError(w, r, http.StatusUnauthorized, "INVALID_TOKEN", "Access token is invalid.")
				return
			}
			if claims.Subject == "" || claims.Type != "access" || claims.Role == "" || claims.Email == "" {
				writeError(w, r, http.StatusUnauthorized, "INVALID_TOKEN", "Token claims are malformed.")
				return
			}
			r.Header.Set("X-User-Id", claims.Subject)
			r.Header.Set("X-User-Role", claims.Role)
			r.Header.Set("X-User-Email", claims.Email)
			next.ServeHTTP(w, r)
		})
	}
}
