package handler

import (
	"net/http"
	"strconv"

	"backend/alerts-service/internal/service"
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
	mux.Handle("POST /alerts", protected(h.createAlert))
	mux.Handle("GET /alerts", protected(h.listAlerts))
	mux.Handle("GET /alerts/{id}", protected(h.getAlert))
	mux.Handle("PUT /alerts/{id}", protected(h.updateAlert))
	mux.Handle("DELETE /alerts/{id}", protected(h.deleteAlert))
	mux.Handle("PUT /alerts/{id}/toggle", protected(h.toggleAlert))
	mux.Handle("GET /admin/alerts", protected(h.listAdminAlerts))

	internal := middleware.RequireInternalSecret(h.internalSecret)
	mux.Handle("POST /internal/alerts/trigger", internal(http.HandlerFunc(h.triggerAlerts)))
	return mux
}

func (h *Handler) health(w http.ResponseWriter, r *http.Request) {
	if h.healthCheck != nil {
		h.healthCheck(w, r)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) createAlert(w http.ResponseWriter, r *http.Request) {
	user, ok := requireUser(w, r)
	if !ok {
		return
	}
	var req service.CreateAlertRequest
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	alert, err := h.service.CreateAlert(r.Context(), user.ID, req)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusCreated, alert)
}

func (h *Handler) listAlerts(w http.ResponseWriter, r *http.Request) {
	user, ok := requireUser(w, r)
	if !ok {
		return
	}
	page := queryInt(r, "page", 1)
	perPage := queryInt(r, "per_page", 20)
	active, err := queryBoolPtr(r, "is_active")
	if err != nil {
		httpjson.WriteError(w, r, apperr.Validation(apperr.FieldErrors{"is_active": "Must be true or false."}))
		return
	}
	alertType := queryStringPtr(r, "type")
	items, pagination, err := h.service.ListAlerts(r.Context(), user.ID, active, alertType, page, perPage)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]any{"items": items, "pagination": pagination})
}

func (h *Handler) getAlert(w http.ResponseWriter, r *http.Request) {
	user, ok := requireUser(w, r)
	if !ok {
		return
	}
	alertID, ok := parseUUID(w, r, "id")
	if !ok {
		return
	}
	alert, err := h.service.GetAlert(r.Context(), user.ID, alertID)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, alert)
}

func (h *Handler) updateAlert(w http.ResponseWriter, r *http.Request) {
	user, ok := requireUser(w, r)
	if !ok {
		return
	}
	alertID, ok := parseUUID(w, r, "id")
	if !ok {
		return
	}
	var req service.UpdateAlertRequest
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	alert, err := h.service.UpdateAlert(r.Context(), user.ID, alertID, req)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, alert)
}

func (h *Handler) toggleAlert(w http.ResponseWriter, r *http.Request) {
	user, ok := requireUser(w, r)
	if !ok {
		return
	}
	alertID, ok := parseUUID(w, r, "id")
	if !ok {
		return
	}
	var req struct {
		IsActive bool `json:"is_active"`
	}
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	alert, err := h.service.ToggleAlert(r.Context(), user.ID, alertID, req.IsActive)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, alert)
}

func (h *Handler) deleteAlert(w http.ResponseWriter, r *http.Request) {
	user, ok := requireUser(w, r)
	if !ok {
		return
	}
	alertID, ok := parseUUID(w, r, "id")
	if !ok {
		return
	}
	if err := h.service.DeleteAlert(r.Context(), user.ID, alertID); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]string{"message": "Alert deleted"})
}

func (h *Handler) triggerAlerts(w http.ResponseWriter, r *http.Request) {
	var req service.TriggerRequest
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	count, err := h.service.TriggerAlerts(r.Context(), req)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]int{"triggered_count": count})
}

func (h *Handler) listAdminAlerts(w http.ResponseWriter, r *http.Request) {
	user, ok := requireUser(w, r)
	if !ok {
		return
	}
	if !userctx.IsAdmin(user.Role) {
		httpjson.WriteError(w, r, apperr.New(http.StatusForbidden, apperr.CodeForbidden, "Admin access is required."))
		return
	}
	page := queryInt(r, "page", 1)
	perPage := queryInt(r, "per_page", 20)
	items, pagination, err := h.service.ListAllAlerts(r.Context(), page, perPage)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]any{"items": items, "pagination": pagination})
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
		httpjson.WriteError(w, r, apperr.New(http.StatusBadRequest, apperr.CodeValidationError, "Invalid UUID path parameter."))
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

func queryBoolPtr(r *http.Request, key string) (*bool, error) {
	raw := r.URL.Query().Get(key)
	if raw == "" {
		return nil, nil
	}
	value, err := strconv.ParseBool(raw)
	if err != nil {
		return nil, err
	}
	return &value, nil
}

func queryStringPtr(r *http.Request, key string) *string {
	raw := r.URL.Query().Get(key)
	if raw == "" {
		return nil
	}
	return &raw
}
