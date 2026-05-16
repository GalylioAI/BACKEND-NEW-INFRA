package proxy

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/rs/zerolog"
)

func TestForwardedProtoFromTrustedProxy(t *testing.T) {
	var gotProto string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotProto = r.Header.Get("X-Forwarded-Proto")
		w.WriteHeader(http.StatusNoContent)
	}))
	defer upstream.Close()

	handler := NewServiceProxy(upstream.URL, "secret", []string{"127.0.0.1/32"}, zerolog.Nop())
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	req.RemoteAddr = "127.0.0.1:12345"
	req.Header.Set("X-Forwarded-Proto", "https")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if gotProto != "https" {
		t.Fatalf("expected https from trusted proxy, got %q", gotProto)
	}
}

func TestForwardedProtoIgnoresSpoofedHeaderFromUntrustedClient(t *testing.T) {
	var gotProto string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotProto = r.Header.Get("X-Forwarded-Proto")
		w.WriteHeader(http.StatusNoContent)
	}))
	defer upstream.Close()

	handler := NewServiceProxy(upstream.URL, "secret", []string{"127.0.0.1/32"}, zerolog.Nop())
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	req.RemoteAddr = "203.0.113.10:12345"
	req.Header.Set("X-Forwarded-Proto", "https")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if gotProto != "http" {
		t.Fatalf("expected http for untrusted client, got %q", gotProto)
	}
}
