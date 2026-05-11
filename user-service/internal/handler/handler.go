package handler

import (
	"net/http"
	"strconv"

	"backend/shared/apperr"
	"backend/shared/httpjson"
	"backend/shared/middleware"
	"backend/shared/userctx"
	"backend/user-service/internal/service"

	"github.com/google/uuid"
)

type Handler struct {
	service        *service.Service
	internalSecret string
	healthCheck    http.HandlerFunc
}

func New(service *service.Service, internalSecret string, healthCheck ...http.HandlerFunc) *Handler {
	h := &Handler{service: service, internalSecret: internalSecret}
	if len(healthCheck) > 0 {
		h.healthCheck = healthCheck[0]
	}
	return h
}

func (h *Handler) Routes() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", h.health)
	mux.HandleFunc("GET /healthz", h.health)
	mux.HandleFunc("GET /gouvernorats", h.listGouvernorats)
	mux.HandleFunc("POST /users/signup", h.signup)

	protected := middleware.Chain(http.HandlerFunc(h.me), middleware.RequireInternalSecret(h.internalSecret), middleware.RequireUserContext)
	mux.Handle("GET /users/me", protected)
	mux.Handle("PUT /users/me", middleware.Chain(http.HandlerFunc(h.updateMe), middleware.RequireInternalSecret(h.internalSecret), middleware.RequireUserContext))
	mux.Handle("PUT /users/me/password", middleware.Chain(http.HandlerFunc(h.changePassword), middleware.RequireInternalSecret(h.internalSecret), middleware.RequireUserContext))
	mux.Handle("DELETE /users/me", middleware.Chain(http.HandlerFunc(h.deleteMe), middleware.RequireInternalSecret(h.internalSecret), middleware.RequireUserContext))

	mux.Handle("GET /users", middleware.Chain(http.HandlerFunc(h.listUsers), middleware.RequireInternalSecret(h.internalSecret), middleware.RequireUserContext))
	mux.Handle("GET /users/{id}", middleware.Chain(http.HandlerFunc(h.getUser), middleware.RequireInternalSecret(h.internalSecret), middleware.RequireUserContext))
	mux.Handle("PUT /users/{id}/role", middleware.Chain(http.HandlerFunc(h.changeRole), middleware.RequireInternalSecret(h.internalSecret), middleware.RequireUserContext))
	mux.Handle("PUT /users/{id}/ban", middleware.Chain(http.HandlerFunc(h.setBan), middleware.RequireInternalSecret(h.internalSecret), middleware.RequireUserContext))
	mux.Handle("DELETE /users/{id}", middleware.Chain(http.HandlerFunc(h.deleteUser), middleware.RequireInternalSecret(h.internalSecret), middleware.RequireUserContext))

	internal := middleware.RequireInternalSecret(h.internalSecret)
	mux.Handle("GET /internal/users/lookup", internal(http.HandlerFunc(h.internalLookup)))
	mux.Handle("GET /internal/users/by-email/{email}", internal(http.HandlerFunc(h.internalGetByEmail)))
	mux.Handle("GET /internal/users/{id}", internal(http.HandlerFunc(h.internalGetByID)))
	mux.Handle("PATCH /internal/users/{id}/verify", internal(http.HandlerFunc(h.internalMarkVerified)))
	mux.Handle("PATCH /internal/users/{id}/2fa", internal(http.HandlerFunc(h.internalSetTwoFactor)))
	mux.Handle("PATCH /internal/users/{id}/password", internal(http.HandlerFunc(h.internalUpdatePasswordHash)))
	mux.Handle("POST /internal/users/{id}/verify-password", internal(http.HandlerFunc(h.internalVerifyPassword)))
	mux.Handle("POST /internal/users/login-failure", internal(http.HandlerFunc(h.internalLoginFailure)))
	mux.Handle("POST /internal/users/login-success", internal(http.HandlerFunc(h.internalLoginSuccess)))
	mux.Handle("POST /internal/users/google", internal(http.HandlerFunc(h.internalGoogle)))

	return mux
}

func (h *Handler) health(w http.ResponseWriter, r *http.Request) {
	if h.healthCheck != nil {
		h.healthCheck(w, r)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) signup(w http.ResponseWriter, r *http.Request) {
	var req service.SignupRequest
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	user, err := h.service.Signup(r.Context(), req)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusCreated, user)
}

func (h *Handler) listGouvernorats(w http.ResponseWriter, r *http.Request) {
	items, err := h.service.ListGouvernorats(r.Context())
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) me(w http.ResponseWriter, r *http.Request) {
	user, ok := userctx.FromContext(r.Context())
	if !ok {
		httpjson.WriteError(w, r, apperr.New(http.StatusUnauthorized, apperr.CodeUnauthorized, "Authentication is required."))
		return
	}
	profile, err := h.service.GetProfile(r.Context(), user.ID)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, profile)
}

func (h *Handler) updateMe(w http.ResponseWriter, r *http.Request) {
	user, _ := userctx.FromContext(r.Context())
	var req service.UpdateProfileRequest
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	profile, err := h.service.UpdateProfile(r.Context(), user.ID, req)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, profile)
}

func (h *Handler) changePassword(w http.ResponseWriter, r *http.Request) {
	user, _ := userctx.FromContext(r.Context())
	var req service.ChangePasswordRequest
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	if err := h.service.ChangePassword(r.Context(), user.ID, req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.WriteNoContent(w, r)
}

func (h *Handler) deleteMe(w http.ResponseWriter, r *http.Request) {
	user, _ := userctx.FromContext(r.Context())
	if err := h.service.SoftDelete(r.Context(), user.ID); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.WriteNoContent(w, r)
}

func (h *Handler) listUsers(w http.ResponseWriter, r *http.Request) {
	if !requireAdmin(w, r) {
		return
	}
	page := queryInt(r, "page", 1)
	perPage := queryInt(r, "per_page", 20)
	items, pagination, err := h.service.ListUsers(r.Context(), page, perPage)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]any{"items": items, "pagination": pagination})
}

func (h *Handler) getUser(w http.ResponseWriter, r *http.Request) {
	if !requireAdmin(w, r) {
		return
	}
	id, ok := parsePathUUID(w, r, "id")
	if !ok {
		return
	}
	user, err := h.service.GetAny(r.Context(), id)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, user)
}

func (h *Handler) changeRole(w http.ResponseWriter, r *http.Request) {
	if !requireAdmin(w, r) {
		return
	}
	id, ok := parsePathUUID(w, r, "id")
	if !ok {
		return
	}
	var req struct {
		Role string `json:"role"`
	}
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	user, err := h.service.ChangeRole(r.Context(), id, req.Role)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, user)
}

func (h *Handler) setBan(w http.ResponseWriter, r *http.Request) {
	if !requireAdmin(w, r) {
		return
	}
	id, ok := parsePathUUID(w, r, "id")
	if !ok {
		return
	}
	var req struct {
		IsBanned bool    `json:"is_banned"`
		Reason   *string `json:"reason"`
	}
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	user, err := h.service.SetBan(r.Context(), id, req.IsBanned, req.Reason)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, user)
}

func (h *Handler) deleteUser(w http.ResponseWriter, r *http.Request) {
	if !requireAdmin(w, r) {
		return
	}
	id, ok := parsePathUUID(w, r, "id")
	if !ok {
		return
	}
	if err := h.service.SoftDeleteManagedUser(r.Context(), id); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.WriteNoContent(w, r)
}

func (h *Handler) internalLookup(w http.ResponseWriter, r *http.Request) {
	identifier := r.URL.Query().Get("identifier")
	user, err := h.service.CredentialByIdentifier(r.Context(), identifier)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, user)
}

func (h *Handler) internalGetByID(w http.ResponseWriter, r *http.Request) {
	id, ok := parsePathUUID(w, r, "id")
	if !ok {
		return
	}
	user, err := h.service.CredentialByID(r.Context(), id)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, user)
}

func (h *Handler) internalGetByEmail(w http.ResponseWriter, r *http.Request) {
	user, err := h.service.UserByEmail(r.Context(), r.PathValue("email"))
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, user)
}

func (h *Handler) internalMarkVerified(w http.ResponseWriter, r *http.Request) {
	id, ok := parsePathUUID(w, r, "id")
	if !ok {
		return
	}
	user, err := h.service.MarkVerified(r.Context(), id)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, user)
}

func (h *Handler) internalSetTwoFactor(w http.ResponseWriter, r *http.Request) {
	id, ok := parsePathUUID(w, r, "id")
	if !ok {
		return
	}
	var req struct {
		Enabled bool `json:"enabled"`
	}
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	user, err := h.service.SetTwoFactor(r.Context(), id, req.Enabled)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, user)
}

func (h *Handler) internalUpdatePasswordHash(w http.ResponseWriter, r *http.Request) {
	id, ok := parsePathUUID(w, r, "id")
	if !ok {
		return
	}
	var req struct {
		PasswordHash string `json:"password_hash"`
	}
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	if err := h.service.UpdatePasswordHash(r.Context(), id, req.PasswordHash); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.WriteNoContent(w, r)
}

func (h *Handler) internalVerifyPassword(w http.ResponseWriter, r *http.Request) {
	id, ok := parsePathUUID(w, r, "id")
	if !ok {
		return
	}
	var req struct {
		Password string `json:"password"`
	}
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	if err := h.service.VerifyPassword(r.Context(), id, req.Password); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.WriteNoContent(w, r)
}

func (h *Handler) internalLoginFailure(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID          uuid.UUID `json:"user_id"`
		CurrentFailures int16     `json:"current_failures"`
	}
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	if err := h.service.RecordLoginFailure(r.Context(), req.UserID, req.CurrentFailures); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.WriteNoContent(w, r)
}

func (h *Handler) internalLoginSuccess(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID uuid.UUID `json:"user_id"`
	}
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	if err := h.service.RecordLoginSuccess(r.Context(), req.UserID); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.WriteNoContent(w, r)
}

func (h *Handler) internalGoogle(w http.ResponseWriter, r *http.Request) {
	var req service.GoogleUserRequest
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	user, created, err := h.service.GetOrCreateGoogleUser(r.Context(), req)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]any{"user": user, "created": created})
}

func requireAdmin(w http.ResponseWriter, r *http.Request) bool {
	user, _ := userctx.FromContext(r.Context())
	if !userctx.IsAdmin(user.Role) {
		httpjson.WriteError(w, r, apperr.New(http.StatusForbidden, apperr.CodeForbidden, "Admin access is required."))
		return false
	}
	return true
}

func requireSuperAdmin(w http.ResponseWriter, r *http.Request) bool {
	user, _ := userctx.FromContext(r.Context())
	if user.Role != userctx.RoleSuperAdmin {
		httpjson.WriteError(w, r, apperr.New(http.StatusForbidden, apperr.CodeForbidden, "Superadmin access is required."))
		return false
	}
	return true
}

func parsePathUUID(w http.ResponseWriter, r *http.Request, name string) (uuid.UUID, bool) {
	id, err := uuid.Parse(r.PathValue(name))
	if err != nil {
		httpjson.WriteError(w, r, apperr.New(http.StatusBadRequest, apperr.CodeValidationError, "Invalid UUID path parameter."))
		return uuid.Nil, false
	}
	return id, true
}

func queryInt(r *http.Request, key string, fallback int) int {
	value := r.URL.Query().Get(key)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}
