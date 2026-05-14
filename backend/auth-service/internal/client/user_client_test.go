package client

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"backend/shared/apperr"
)

func TestHTTPUserClientPreservesFieldErrors(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict)
		_, _ = w.Write([]byte(`{
			"success": false,
			"error": {
				"code": "EMAIL_ALREADY_REGISTERED",
				"message": "Email address is already registered with password login.",
				"fields": {"email": "Email address is already registered with password login."}
			},
			"meta": {"request_id": "test", "timestamp": "2026-05-14T00:00:00Z"}
		}`))
	}))
	defer server.Close()

	client := NewHTTPUserClient(server.URL, "secret")
	_, _, err := client.GetOrCreateGoogle(context.Background(), "jane@example.com", "Jane Doe", "")

	app := apperr.From(err)
	if app.Status != http.StatusConflict || app.Code != apperr.CodeEmailRegistered {
		t.Fatalf("expected email registered conflict, got %#v", app)
	}
	if app.Fields["email"] == "" {
		t.Fatalf("expected email field error, got %#v", app.Fields)
	}
}
