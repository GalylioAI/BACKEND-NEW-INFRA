package handler

import (
	"net/http/httptest"
	"testing"
)

func TestTwoFactorSessionTokenPrefersGatewayHandoffHeader(t *testing.T) {
	req := httptest.NewRequest("POST", "/otp/2fa/verify", nil)
	req.Header.Set("X-2FA-Session-Token", "handoff")
	req.Header.Set("Authorization", "Bearer authorization")

	if got := twoFactorSessionToken(req, "body"); got != "handoff" {
		t.Fatalf("expected handoff token, got %q", got)
	}
}

func TestTwoFactorSessionTokenFallsBackToBearerAndBody(t *testing.T) {
	req := httptest.NewRequest("POST", "/otp/2fa/verify", nil)
	req.Header.Set("Authorization", "Bearer authorization")

	if got := twoFactorSessionToken(req, "body"); got != "authorization" {
		t.Fatalf("expected bearer token, got %q", got)
	}

	req.Header.Del("Authorization")
	if got := twoFactorSessionToken(req, "body"); got != "body" {
		t.Fatalf("expected body token, got %q", got)
	}
}
