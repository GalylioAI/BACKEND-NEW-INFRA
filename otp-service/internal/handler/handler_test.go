package handler

import (
	"net/http/httptest"
	"testing"
)

func TestTwoFactorPendingTokenPrefersGatewayHandoffHeader(t *testing.T) {
	req := httptest.NewRequest("POST", "/otp/2fa/login/verify", nil)
	req.Header.Set("X-2FA-Pending-Token", "handoff")
	req.Header.Set("Authorization", "Bearer authorization")

	if got := twoFactorPendingToken(req); got != "handoff" {
		t.Fatalf("expected handoff token, got %q", got)
	}
}

func TestTwoFactorPendingTokenFallsBackToBearerOnly(t *testing.T) {
	req := httptest.NewRequest("POST", "/otp/2fa/login/verify", nil)
	req.Header.Set("Authorization", "Bearer authorization")

	if got := twoFactorPendingToken(req); got != "authorization" {
		t.Fatalf("expected bearer token, got %q", got)
	}

	req.Header.Del("Authorization")
	if got := twoFactorPendingToken(req); got != "" {
		t.Fatalf("expected no body token fallback, got %q", got)
	}
}
