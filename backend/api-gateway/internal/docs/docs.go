package docs

import (
	"embed"
	"net/http"
)

//go:embed openapi.yaml swagger.html
var files embed.FS

func Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /docs", swagger)
	mux.HandleFunc("GET /docs/", swagger)
	mux.HandleFunc("GET /openapi.yaml", openapi)
}

func swagger(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/docs" && r.URL.Path != "/docs/" {
		http.NotFound(w, r)
		return
	}
	body, err := files.ReadFile("swagger.html")
	if err != nil {
		http.Error(w, "Swagger UI is unavailable.", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(body)
}

func openapi(w http.ResponseWriter, r *http.Request) {
	body, err := files.ReadFile("openapi.yaml")
	if err != nil {
		http.Error(w, "OpenAPI spec is unavailable.", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/yaml; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(body)
}
