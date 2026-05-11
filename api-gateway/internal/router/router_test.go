package router

import (
	"crypto/rand"
	"crypto/rsa"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"backend/api-gateway/internal/config"
	"backend/shared/middleware"

	jwtlib "github.com/golang-jwt/jwt/v5"
	"github.com/rs/zerolog"
)

func TestRouteAuthContract(t *testing.T) {
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}

	var otpHits atomic.Int32
	var favoritesHits atomic.Int32

	otpServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get(middleware.HeaderInternalSecret); got != "secret" {
			t.Fatalf("expected internal secret, got %q", got)
		}
		if r.Header.Get("Authorization") != "" {
			t.Fatal("authorization header must not be forwarded to downstream services")
		}
		if r.URL.Path == "/otp/2fa/verify" && r.Header.Get("X-2FA-Session-Token") != "pending-token" {
			t.Fatalf("expected 2FA session token handoff header, got %q", r.Header.Get("X-2FA-Session-Token"))
		}
		otpHits.Add(1)
		w.WriteHeader(http.StatusNoContent)
	}))
	defer otpServer.Close()

	userServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get(middleware.HeaderInternalSecret); got != "secret" {
			t.Fatalf("expected internal secret on user status check, got %q", got)
		}
		switch r.URL.Path {
		case "/internal/users/user-1":
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"success":true,"data":{"id":"user-1","email":"user@example.com","role":"user","is_verified":true,"is_banned":false}}`))
		case "/internal/users/admin-1":
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"success":true,"data":{"id":"admin-1","email":"admin@example.com","role":"admin","is_verified":true,"is_banned":false}}`))
		case "/internal/users/banned-1":
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"success":true,"data":{"id":"banned-1","email":"banned@example.com","role":"user","is_verified":true,"is_banned":true}}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer userServer.Close()

	favoritesServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get(middleware.HeaderInternalSecret); got != "secret" {
			t.Fatalf("expected internal secret, got %q", got)
		}
		favoritesHits.Add(1)
		w.WriteHeader(http.StatusNoContent)
	}))
	defer favoritesServer.Close()

	handler := New(config.Config{
		InternalSecret:      "secret",
		PublicKey:           &key.PublicKey,
		JWTIssuer:           "issuer",
		JWTAudience:         "audience",
		AllowedOrigins:      []string{"https://frontend.example"},
		AuthServiceURL:      otpServer.URL,
		UserServiceURL:      userServer.URL,
		OTPServiceURL:       otpServer.URL,
		FavoritesServiceURL: favoritesServer.URL,
		AlertsServiceURL:    favoritesServer.URL,
		TrustedProxyCIDRs:   []string{"127.0.0.1/32"},
		RequestTimeout:      30 * time.Second,
		BodyLimitBytes:      1 << 20,
	}, zerolog.Nop(), nil)

	t.Run("public otp email send does not require bearer", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/otp/email/send", strings.NewReader(`{"email":"user@example.com"}`))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-2FA-Session-Token", "client-injected")
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected public OTP route to pass, got %d: %s", rec.Code, rec.Body.String())
		}
		if otpHits.Load() != 1 {
			t.Fatalf("expected OTP upstream hit")
		}
	})

	t.Run("public 2fa verify forwards bearer token only as handoff header", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/otp/2fa/verify", strings.NewReader(`{"code":"123456"}`))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer pending-token")
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected public OTP 2FA route to pass, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("protected route rejects missing bearer", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/favorites", nil)
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 for missing bearer, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("admin route rejects normal user", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/admin/favorites/popular", nil)
		req.Header.Set("Authorization", "Bearer "+signGatewayToken(t, key, "user-1", "user"))
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusForbidden {
			t.Fatalf("expected 403 for normal user on admin route, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("protected route rejects banned user", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/favorites", nil)
		req.Header.Set("Authorization", "Bearer "+signGatewayToken(t, key, "banned-1", "user"))
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusForbidden {
			t.Fatalf("expected 403 for banned user, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("admin route uses live role from user service", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/admin/favorites/popular", nil)
		req.Header.Set("Authorization", "Bearer "+signGatewayToken(t, key, "admin-1", "user"))
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected live admin role to pass, got %d: %s", rec.Code, rec.Body.String())
		}
		if favoritesHits.Load() != 1 {
			t.Fatalf("expected favorites upstream hit")
		}
	})
}

func signGatewayToken(t *testing.T, key *rsa.PrivateKey, subject, role string) string {
	t.Helper()
	claims := jwtlib.MapClaims{
		"iss":   "issuer",
		"aud":   "audience",
		"sub":   subject,
		"role":  role,
		"email": subject + "@example.com",
		"exp":   time.Now().Add(time.Hour).Unix(),
		"iat":   time.Now().Add(-time.Minute).Unix(),
		"jti":   subject + "-jti",
	}
	token, err := jwtlib.NewWithClaims(jwtlib.SigningMethodRS256, claims).SignedString(key)
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return token
}
