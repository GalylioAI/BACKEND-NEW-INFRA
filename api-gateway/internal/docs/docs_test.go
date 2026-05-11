package docs

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestRegisterServesSwaggerAndOpenAPI(t *testing.T) {
	mux := http.NewServeMux()
	Register(mux)

	swagger := httptest.NewRecorder()
	mux.ServeHTTP(swagger, httptest.NewRequest(http.MethodGet, "/docs", nil))
	if swagger.Code != http.StatusOK {
		t.Fatalf("expected swagger status 200, got %d", swagger.Code)
	}
	if !strings.Contains(swagger.Body.String(), "SwaggerUIBundle") {
		t.Fatal("expected swagger UI document")
	}

	spec := httptest.NewRecorder()
	mux.ServeHTTP(spec, httptest.NewRequest(http.MethodGet, "/openapi.yaml", nil))
	if spec.Code != http.StatusOK {
		t.Fatalf("expected spec status 200, got %d", spec.Code)
	}
	if !strings.Contains(spec.Body.String(), "openapi: 3.0.3") {
		t.Fatal("expected embedded OpenAPI document")
	}
}
