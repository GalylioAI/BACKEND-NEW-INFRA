package httpjson

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"backend/shared/apperr"
)

func TestDecodeRejectsMultipleJSONObjects(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"name":"first"} {"name":"second"}`))
	var body struct {
		Name string `json:"name"`
	}

	err := Decode(req, &body)
	if err == nil {
		t.Fatal("expected multiple JSON objects to be rejected")
	}
	app := apperr.From(err)
	if app.Status != http.StatusBadRequest {
		t.Fatalf("expected bad request, got %d", app.Status)
	}
}

func TestDecodeAcceptsSingleJSONObject(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"name":"first"}`))
	var body struct {
		Name string `json:"name"`
	}

	if err := Decode(req, &body); err != nil {
		t.Fatalf("expected single JSON object to decode: %v", err)
	}
	if body.Name != "first" {
		t.Fatalf("unexpected decoded value: %q", body.Name)
	}
}
