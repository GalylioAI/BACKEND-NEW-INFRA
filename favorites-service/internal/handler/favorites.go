package handler

import (
	"net/http"
	"strconv"

	"backend/favorites-service/internal/service"
	"backend/shared/apperr"
	"backend/shared/httpjson"
	"backend/shared/middleware"
	"backend/shared/userctx"

	"github.com/google/uuid"
)

type Handler struct {
	service        *service.Service
	internalSecret string
	healthCheck    http.HandlerFunc
}

func New(service *service.Service, internalSecret string, healthCheck http.HandlerFunc) *Handler {
	return &Handler{service: service, internalSecret: internalSecret, healthCheck: healthCheck}
}

func (h *Handler) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", h.health)
	mux.HandleFunc("GET /healthz", h.health)

	protected := func(fn http.HandlerFunc) http.Handler {
		return middleware.Chain(fn, middleware.RequireInternalSecret(h.internalSecret), middleware.RequireUserContext)
	}
	mux.Handle("POST /favorites", protected(h.addFavorite))
	mux.Handle("GET /favorites", protected(h.listFavorites))
	mux.Handle("DELETE /favorites/all", protected(h.clearFavorites))
	mux.Handle("GET /favorites/{product_id}", protected(h.checkFavorite))
	mux.Handle("DELETE /favorites/{product_id}", protected(h.removeFavorite))
	mux.Handle("GET /admin/favorites/popular", protected(h.popularFavorites))
	return mux
}

func (h *Handler) health(w http.ResponseWriter, r *http.Request) {
	if h.healthCheck != nil {
		h.healthCheck(w, r)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) addFavorite(w http.ResponseWriter, r *http.Request) {
	user, ok := requireUser(w, r)
	if !ok {
		return
	}
	var req struct {
		ProductID uuid.UUID `json:"product_id"`
	}
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	favorite, err := h.service.AddFavorite(r.Context(), user.ID, req.ProductID)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusCreated, favorite)
}

func (h *Handler) removeFavorite(w http.ResponseWriter, r *http.Request) {
	user, ok := requireUser(w, r)
	if !ok {
		return
	}
	productID, ok := parseUUID(w, r, "product_id")
	if !ok {
		return
	}
	if err := h.service.RemoveFavorite(r.Context(), user.ID, productID); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]string{"message": "Removed from favorites"})
}

func (h *Handler) listFavorites(w http.ResponseWriter, r *http.Request) {
	user, ok := requireUser(w, r)
	if !ok {
		return
	}
	page := queryInt(r, "page", 1)
	perPage := queryInt(r, "per_page", 20)
	items, pagination, err := h.service.ListFavorites(r.Context(), user.ID, page, perPage)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]any{"items": items, "pagination": pagination})
}

func (h *Handler) checkFavorite(w http.ResponseWriter, r *http.Request) {
	user, ok := requireUser(w, r)
	if !ok {
		return
	}
	productID, ok := parseUUID(w, r, "product_id")
	if !ok {
		return
	}
	isFavorited, err := h.service.IsFavorited(r.Context(), user.ID, productID)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]bool{"is_favorited": isFavorited})
}

func (h *Handler) clearFavorites(w http.ResponseWriter, r *http.Request) {
	user, ok := requireUser(w, r)
	if !ok {
		return
	}
	if err := h.service.ClearFavorites(r.Context(), user.ID, r.Header.Get("X-Confirm")); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]string{"message": "All favorites cleared"})
}

func (h *Handler) popularFavorites(w http.ResponseWriter, r *http.Request) {
	user, ok := requireUser(w, r)
	if !ok {
		return
	}
	if !userctx.IsAdmin(user.Role) {
		httpjson.WriteError(w, r, apperr.New(http.StatusForbidden, apperr.CodeForbidden, "Admin access is required."))
		return
	}
	limit := queryInt(r, "limit", 10)
	items, err := h.service.PopularProducts(r.Context(), limit)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]any{"items": items})
}

func requireUser(w http.ResponseWriter, r *http.Request) (userctx.User, bool) {
	user, ok := userctx.FromContext(r.Context())
	if !ok {
		httpjson.WriteError(w, r, apperr.New(http.StatusUnauthorized, apperr.CodeUnauthorized, "Authentication is required."))
		return userctx.User{}, false
	}
	return user, true
}

func parseUUID(w http.ResponseWriter, r *http.Request, name string) (uuid.UUID, bool) {
	id, err := uuid.Parse(r.PathValue(name))
	if err != nil {
		httpjson.WriteError(w, r, apperr.New(http.StatusBadRequest, "INVALID_PRODUCT_ID", "Product ID must be a valid UUID."))
		return uuid.Nil, false
	}
	return id, true
}

func queryInt(r *http.Request, key string, fallback int) int {
	raw := r.URL.Query().Get(key)
	if raw == "" {
		return fallback
	}
	value, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	return value
}
