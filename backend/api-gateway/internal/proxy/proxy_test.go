package proxy

import (
	"net/http"
	"net/http/httptest"
	"testing"

	gwmw "backend/api-gateway/internal/middleware"

	"github.com/rs/zerolog"
)

func TestServiceProxyLetsGatewayOwnCORSHeaders(t *testing.T) {
	var upstreamOrigin string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		upstreamOrigin = r.Header.Get("Origin")
		w.Header().Set("Access-Control-Allow-Origin", "https://1111.tn")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("X-Frame-Options", "SAMEORIGIN")
		http.SetCookie(w, &http.Cookie{
			Name:     "refresh_token",
			Value:    "test-refresh",
			Path:     "/auth",
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteLaxMode,
		})
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"success":true,"data":{"ok":true}}`))
	}))
	defer upstream.Close()

	handler := gwmw.CORS(gwmw.CORSConfig{
		AllowedOrigins:   []string{"https://1111.tn"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           600,
	})(NewServiceProxy(upstream.URL, "internal-secret", zerolog.Nop()))

	req := httptest.NewRequest(http.MethodPost, "/auth/refresh", nil)
	req.Header.Set("Origin", "https://1111.tn")
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if upstreamOrigin != "" {
		t.Fatalf("gateway should not forward browser Origin to internal upstream, got %q", upstreamOrigin)
	}

	if got := rr.Result().Header.Values("Access-Control-Allow-Origin"); len(got) != 1 || got[0] != "https://1111.tn" {
		t.Fatalf("expected one gateway-owned Access-Control-Allow-Origin header, got %#v", got)
	}
	if got := rr.Result().Header.Values("Access-Control-Allow-Credentials"); len(got) != 1 || got[0] != "true" {
		t.Fatalf("expected one gateway-owned Access-Control-Allow-Credentials header, got %#v", got)
	}
	if got := rr.Result().Header.Get("X-Frame-Options"); got != "" {
		t.Fatalf("upstream security header should be stripped, got %q", got)
	}
	if cookies := rr.Result().Cookies(); len(cookies) != 1 || cookies[0].Name != "refresh_token" {
		t.Fatalf("refresh cookie must still pass through, got %#v", cookies)
	}
}
