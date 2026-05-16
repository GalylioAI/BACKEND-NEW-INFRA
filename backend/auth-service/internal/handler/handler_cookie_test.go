package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestSetRefreshCookieAttributes(t *testing.T) {
	h := &Handler{refreshCookie: RefreshCookieConfig{
		Name:     "refresh_token",
		Path:     "/auth",
		Domain:   "backend.example.com",
		MaxAge:   24 * time.Hour,
		HTTPOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
	}}
	rec := httptest.NewRecorder()
	h.setRefreshCookie(rec, "refresh-value")

	cookies := rec.Result().Cookies()
	if len(cookies) != 1 {
		t.Fatalf("expected one cookie, got %#v", cookies)
	}
	c := cookies[0]
	if c.Name != "refresh_token" || c.Value != "refresh-value" {
		t.Fatalf("unexpected cookie: %#v", c)
	}
	if c.Path != "/auth" || c.Domain != "backend.example.com" {
		t.Fatalf("unexpected scope: path=%q domain=%q", c.Path, c.Domain)
	}
	if !c.HttpOnly || !c.Secure || c.SameSite != http.SameSiteNoneMode {
		t.Fatalf("unexpected flags: httpOnly=%v secure=%v sameSite=%v", c.HttpOnly, c.Secure, c.SameSite)
	}
}

func TestClearRefreshCookieClearsLegacyAndCurrent(t *testing.T) {
	h := &Handler{refreshCookie: RefreshCookieConfig{
		Name:     "refresh_token",
		Path:     "/auth",
		Domain:   "api.example.com",
		HTTPOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	}}
	rec := httptest.NewRecorder()
	h.clearRefreshCookie(rec)

	names := map[string]bool{}
	for _, c := range rec.Result().Cookies() {
		names[c.Name] = true
		if c.MaxAge >= 0 {
			t.Fatalf("expected expired cookie, got maxAge=%d for %s", c.MaxAge, c.Name)
		}
	}
	if !names["refresh_token"] || !names["__Host-refresh_token"] {
		t.Fatalf("expected both refresh cookies cleared, got %#v", names)
	}
}

func TestLegacyTwoFACompleteRouteRemoved(t *testing.T) {
	h := &Handler{internalSecret: "secret", refreshCookie: RefreshCookieConfig{Name: "refresh_token", Path: "/auth"}}
	app := h.Routes()
	req := httptest.NewRequest(http.MethodPost, "/internal/auth/2fa/complete", nil)
	req.Header.Set("X-Internal-Secret", "secret")
	rec := httptest.NewRecorder()
	app.ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for removed route, got %d", rec.Code)
	}
}
