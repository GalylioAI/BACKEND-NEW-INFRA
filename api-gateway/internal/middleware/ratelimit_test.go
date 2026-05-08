package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/rs/zerolog"
)

func TestClientIPIgnoresForwardedForFromUntrustedRemote(t *testing.T) {
	limiter := NewRateLimiter(nil, zerolog.Nop(), []string{"127.0.0.1/32"})
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "203.0.113.10:45678"
	req.Header.Set("X-Forwarded-For", "198.51.100.99")

	if got := limiter.clientIP(req); got != "203.0.113.10" {
		t.Fatalf("expected untrusted remote address, got %q", got)
	}
}

func TestClientIPTrustsForwardedForFromLoopbackProxy(t *testing.T) {
	limiter := NewRateLimiter(nil, zerolog.Nop(), []string{"127.0.0.1/32"})
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "127.0.0.1:45678"
	req.Header.Set("X-Forwarded-For", "198.51.100.99")

	if got := limiter.clientIP(req); got != "198.51.100.99" {
		t.Fatalf("expected forwarded client IP, got %q", got)
	}
}

func TestClientIPTrustsConfiguredProxyCIDR(t *testing.T) {
	limiter := NewRateLimiter(nil, zerolog.Nop(), []string{"172.18.0.1/32"})
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "172.18.0.1:45678"
	req.Header.Set("X-Forwarded-For", "198.51.100.99")

	if got := limiter.clientIP(req); got != "198.51.100.99" {
		t.Fatalf("expected forwarded client IP, got %q", got)
	}
}
