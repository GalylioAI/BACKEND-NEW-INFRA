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
	var userAdminHits atomic.Int32

	otpServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get(middleware.HeaderInternalSecret); got != "secret" {
			t.Fatalf("expected internal secret, got %q", got)
		}
		if r.Header.Get("Authorization") != "" {
			t.Fatal("authorization header must not be forwarded to downstream services")
		}
		if r.URL.Path == "/otp/2fa/login/verify" && r.Header.Get("X-2FA-Pending-Token") != "pending-token" {
			t.Fatalf("expected 2FA pending token handoff header, got %q", r.Header.Get("X-2FA-Pending-Token"))
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
		case "/internal/users/superadmin-1":
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"success":true,"data":{"id":"superadmin-1","email":"superadmin@example.com","role":"superadmin","is_verified":true,"is_banned":false}}`))
		case "/internal/users/banned-1":
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"success":true,"data":{"id":"banned-1","email":"banned@example.com","role":"user","is_verified":true,"is_banned":true}}`))
		case "/users/target/role":
			if got := r.Header.Get(middleware.HeaderInternalSecret); got != "secret" {
				t.Fatalf("expected internal secret on admin mutation, got %q", got)
			}
			userAdminHits.Add(1)
			w.WriteHeader(http.StatusNoContent)
		case "/users/me/password/set":
			if r.Header.Get("X-Auth-Methods") == "" || r.Header.Get("X-Auth-Time") == "" || r.Header.Get("X-Session-Id") == "" {
				t.Fatalf("expected auth context headers to reach user service")
			}
			w.WriteHeader(http.StatusNoContent)
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

	t.Run("old ambiguous 2fa verify route is removed", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/otp/2fa/verify", strings.NewReader(`{"code":"123456"}`))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer pending-token")
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusNotFound {
			t.Fatalf("expected removed route to return 404, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("login 2fa verify forwards bearer only as pending token handoff header", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/otp/2fa/login/verify", strings.NewReader(`{"code":"123456"}`))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer pending-token")
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected public OTP 2FA route to pass, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("enable 2fa verify requires access token", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/otp/2fa/enable/verify", strings.NewReader(`{"code":"123456"}`))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected protected enable verify route to reject missing bearer, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("disable 2fa verify requires access token", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/otp/2fa/disable/verify", strings.NewReader(`{"code":"123456"}`))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected protected disable verify route to reject missing bearer, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("protected 2fa routes reject pending token type", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/otp/2fa/disable", strings.NewReader(`{"current_password":"Strong$123"}`))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+signGatewayPendingToken(t, key, "user-1"))
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected pending token to be rejected on access route, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("disable 2fa verify forwards with valid access token", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/otp/2fa/disable/verify", strings.NewReader(`{"code":"123456"}`))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+signGatewayToken(t, key, "user-1", "user"))
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected protected disable verify route to pass, got %d: %s", rec.Code, rec.Body.String())
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

	t.Run("password set route forwards auth context", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/users/me/password/set", strings.NewReader(`{"new_password":"Strong$123","new_password_confirm":"Strong$123"}`))
		req.Header.Set("Authorization", "Bearer "+signGatewayToken(t, key, "user-1", "user"))
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusNoContent {
			t.Fatalf("expected password set route to pass, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("protected route rejects access token without token type", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/favorites", nil)
		req.Header.Set("Authorization", "Bearer "+signGatewayTokenWithoutType(t, key, "user-1", "user"))
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 for missing access token type, got %d: %s", rec.Code, rec.Body.String())
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

	t.Run("role mutation rejects admin and allows superadmin", func(t *testing.T) {
		adminReq := httptest.NewRequest(http.MethodPut, "/users/target/role", strings.NewReader(`{"role":"admin"}`))
		adminReq.Header.Set("Authorization", "Bearer "+signGatewayToken(t, key, "admin-1", "admin"))
		adminRec := httptest.NewRecorder()
		handler.ServeHTTP(adminRec, adminReq)
		if adminRec.Code != http.StatusForbidden {
			t.Fatalf("expected admin role mutation to be forbidden, got %d: %s", adminRec.Code, adminRec.Body.String())
		}

		superReq := httptest.NewRequest(http.MethodPut, "/users/target/role", strings.NewReader(`{"role":"admin"}`))
		superReq.Header.Set("Authorization", "Bearer "+signGatewayToken(t, key, "superadmin-1", "superadmin"))
		superRec := httptest.NewRecorder()
		handler.ServeHTTP(superRec, superReq)
		if superRec.Code != http.StatusNoContent {
			t.Fatalf("expected superadmin role mutation to pass, got %d: %s", superRec.Code, superRec.Body.String())
		}
		if userAdminHits.Load() != 1 {
			t.Fatalf("expected one upstream role mutation, got %d", userAdminHits.Load())
		}
	})
}

func signGatewayPendingToken(t *testing.T, key *rsa.PrivateKey, subject string) string {
	t.Helper()
	claims := jwtlib.MapClaims{
		"iss":     "issuer",
		"aud":     "audience",
		"sub":     subject,
		"typ":     "2fa_pending",
		"purpose": "2fa_login",
		"exp":     time.Now().Add(time.Hour).Unix(),
		"iat":     time.Now().Add(-time.Minute).Unix(),
		"jti":     subject + "-pending-jti",
	}
	token, err := jwtlib.NewWithClaims(jwtlib.SigningMethodRS256, claims).SignedString(key)
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return token
}

func signGatewayToken(t *testing.T, key *rsa.PrivateKey, subject, role string) string {
	t.Helper()
	claims := jwtlib.MapClaims{
		"iss":       "issuer",
		"aud":       "audience",
		"sub":       subject,
		"role":      role,
		"email":     subject + "@example.com",
		"typ":       "access",
		"auth_time": time.Now().Add(-time.Minute).Unix(),
		"amr":       []string{"password"},
		"sid":       uuidLike(subject),
		"exp":       time.Now().Add(time.Hour).Unix(),
		"iat":       time.Now().Add(-time.Minute).Unix(),
		"jti":       subject + "-jti",
	}
	token, err := jwtlib.NewWithClaims(jwtlib.SigningMethodRS256, claims).SignedString(key)
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return token
}

func uuidLike(seed string) string {
	switch seed {
	case "admin-1":
		return "00000000-0000-0000-0000-000000000001"
	case "superadmin-1":
		return "00000000-0000-0000-0000-000000000002"
	case "banned-1":
		return "00000000-0000-0000-0000-000000000003"
	default:
		return "00000000-0000-0000-0000-000000000004"
	}
}

func signGatewayTokenWithoutType(t *testing.T, key *rsa.PrivateKey, subject, role string) string {
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
