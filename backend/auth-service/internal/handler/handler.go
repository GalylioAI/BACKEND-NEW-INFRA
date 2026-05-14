package handler

import (
	"net"
	"net/http"
	"strings"
	"time"

	"backend/auth-service/internal/domain"
	"backend/auth-service/internal/service"
	"backend/shared/apperr"
	"backend/shared/httpjson"
	"backend/shared/middleware"
	"backend/shared/userctx"

	"github.com/google/uuid"
)

const legacyRefreshCookieName = "__Host-refresh_token"

type RefreshCookieConfig struct {
	Name     string
	Path     string
	Domain   string
	MaxAge   time.Duration
	HTTPOnly bool
	Secure   bool
	SameSite http.SameSite
}

type Handler struct {
	service        *service.Service
	internalSecret string
	refreshCookie  RefreshCookieConfig
	healthCheck    http.HandlerFunc
}

func New(service *service.Service, internalSecret string, refreshCookie RefreshCookieConfig, healthCheck ...http.HandlerFunc) *Handler {
	if refreshCookie.Name == "" {
		refreshCookie.Name = "refresh_token"
	}
	if refreshCookie.Path == "" {
		refreshCookie.Path = "/auth"
	}
	if refreshCookie.MaxAge <= 0 {
		refreshCookie.MaxAge = 30 * 24 * time.Hour
	}
	if refreshCookie.SameSite == 0 {
		refreshCookie.SameSite = http.SameSiteLaxMode
	}
	h := &Handler{service: service, internalSecret: internalSecret, refreshCookie: refreshCookie}
	if len(healthCheck) > 0 {
		h.healthCheck = healthCheck[0]
	}
	return h
}

func (h *Handler) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", h.health)
	mux.HandleFunc("GET /healthz", h.health)
	mux.HandleFunc("POST /auth/login", h.login)
	mux.HandleFunc("POST /auth/google", h.google)
	mux.HandleFunc("POST /auth/session", h.session)
	mux.HandleFunc("POST /auth/refresh", h.refresh)
	mux.HandleFunc("POST /auth/logout", h.logout)
	mux.Handle("POST /auth/logout-all", middleware.Chain(http.HandlerFunc(h.logoutAll), middleware.RequireInternalSecret(h.internalSecret), middleware.RequireUserContext))

	internal := middleware.RequireInternalSecret(h.internalSecret)
	mux.Handle("POST /internal/auth/revoke-all", internal(http.HandlerFunc(h.internalRevokeAll)))
	mux.Handle("DELETE /internal/auth/sessions/{user_id}", internal(http.HandlerFunc(h.internalDeleteSessions)))
	mux.Handle("DELETE /internal/auth/sessions/{user_id}/others/{session_id}", internal(http.HandlerFunc(h.internalDeleteOtherSessions)))
	mux.Handle("POST /internal/auth/issue-jwt", internal(http.HandlerFunc(h.internalIssueJWT)))
	mux.Handle("POST /internal/auth/2fa-pending", internal(http.HandlerFunc(h.internalTwoFAPending)))
	mux.Handle("POST /internal/auth/2fa/complete", internal(http.HandlerFunc(h.internalCompleteTwoFactor)))
	return mux
}

func (h *Handler) health(w http.ResponseWriter, r *http.Request) {
	if h.healthCheck != nil {
		h.healthCheck(w, r)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) login(w http.ResponseWriter, r *http.Request) {
	var req service.ManualLoginRequest
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	if strings.TrimSpace(req.Identifier) == "" || len(req.Identifier) > 255 || req.Password == "" || len(req.Password) > 128 {
		httpjson.WriteError(w, r, apperr.Validation(apperr.FieldErrors{
			"identifier": "Identifier is required and must be at most 255 characters.",
			"password":   "Password is required and must be at most 128 characters.",
		}))
		return
	}
	result, tokens, err := h.service.ManualLogin(r.Context(), req, r.UserAgent(), clientIP(r))
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	if tokens.RefreshToken != "" {
		h.setRefreshCookie(w, tokens.RefreshToken)
	}
	httpjson.Write(w, r, http.StatusOK, result)
}

func (h *Handler) google(w http.ResponseWriter, r *http.Request) {
	var req struct {
		IDToken string `json:"id_token"`
	}
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	if req.IDToken == "" || len(req.IDToken) > 4096 {
		httpjson.WriteError(w, r, apperr.Validation(apperr.FieldErrors{"id_token": "Google ID token is required and must be at most 4096 characters."}))
		return
	}
	result, tokens, err := h.service.GoogleLogin(r.Context(), req.IDToken, r.UserAgent(), clientIP(r))
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	if tokens.RefreshToken != "" {
		h.setRefreshCookie(w, tokens.RefreshToken)
	}
	httpjson.Write(w, r, http.StatusOK, result)
}

func (h *Handler) refresh(w http.ResponseWriter, r *http.Request) {
	token := h.refreshCookieValue(r)
	tokens, err := h.service.Refresh(r.Context(), token, r.UserAgent(), clientIP(r))
	if err != nil {
		h.clearRefreshCookie(w)
		httpjson.WriteError(w, r, err)
		return
	}
	h.setRefreshCookie(w, tokens.RefreshToken)
	httpjson.Write(w, r, http.StatusOK, map[string]any{"access_token": tokens.AccessToken, "access_token_expires_at": tokens.ExpiresAt})
}

func (h *Handler) session(w http.ResponseWriter, r *http.Request) {
	token := h.refreshCookieValue(r)
	result, tokens, err := h.service.Session(r.Context(), token, r.UserAgent(), clientIP(r))
	if err != nil {
		h.clearRefreshCookie(w)
		httpjson.WriteError(w, r, err)
		return
	}
	h.setRefreshCookie(w, tokens.RefreshToken)
	httpjson.Write(w, r, http.StatusOK, result)
}

func (h *Handler) logout(w http.ResponseWriter, r *http.Request) {
	if token := h.refreshCookieValue(r); token != "" {
		if err := h.service.Logout(r.Context(), token, r.UserAgent(), clientIP(r)); err != nil {
			httpjson.WriteError(w, r, err)
			return
		}
	} else if err := h.service.Logout(r.Context(), "", r.UserAgent(), clientIP(r)); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	h.clearRefreshCookie(w)
	httpjson.WriteNoContent(w, r)
}

func (h *Handler) logoutAll(w http.ResponseWriter, r *http.Request) {
	user, _ := userctx.FromContext(r.Context())
	if err := h.service.LogoutAll(r.Context(), user.ID); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	h.clearRefreshCookie(w)
	httpjson.WriteNoContent(w, r)
}

func (h *Handler) internalRevokeAll(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID uuid.UUID `json:"user_id"`
	}
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	if err := h.service.LogoutAll(r.Context(), req.UserID); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.WriteNoContent(w, r)
}

func (h *Handler) internalDeleteSessions(w http.ResponseWriter, r *http.Request) {
	userID, err := uuid.Parse(r.PathValue("user_id"))
	if err != nil {
		httpjson.WriteError(w, r, apperr.New(http.StatusBadRequest, apperr.CodeValidationError, "Invalid UUID path parameter."))
		return
	}
	if err := h.service.LogoutAll(r.Context(), userID); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.WriteNoContent(w, r)
}

func (h *Handler) internalDeleteOtherSessions(w http.ResponseWriter, r *http.Request) {
	userID, err := uuid.Parse(r.PathValue("user_id"))
	if err != nil {
		httpjson.WriteError(w, r, apperr.New(http.StatusBadRequest, apperr.CodeValidationError, "Invalid UUID path parameter."))
		return
	}
	sessionID, err := uuid.Parse(r.PathValue("session_id"))
	if err != nil {
		httpjson.WriteError(w, r, apperr.New(http.StatusBadRequest, apperr.CodeValidationError, "Invalid UUID path parameter."))
		return
	}
	if err := h.service.RevokeOtherRefreshTokens(r.Context(), userID, sessionID); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.WriteNoContent(w, r)
}

func (h *Handler) internalIssueJWT(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID      uuid.UUID `json:"user_id"`
		AuthMethods []string  `json:"auth_methods"`
	}
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	tokens, err := h.service.IssueTokenPairForUser(r.Context(), req.UserID, req.AuthMethods, r.UserAgent(), clientIP(r))
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	h.setRefreshCookie(w, tokens.RefreshToken)
	httpjson.Write(w, r, http.StatusOK, map[string]any{"access_token": tokens.AccessToken, "access_token_expires_at": tokens.ExpiresAt})
}

func (h *Handler) internalTwoFAPending(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID  uuid.UUID `json:"user_id"`
		Context string    `json:"context"`
	}
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	pending, expiresAt, err := h.service.IssuePendingTwoFactor(r.Context(), req.UserID, req.Context)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]any{"session_token": pending, "expires_at": expiresAt})
}

func (h *Handler) internalCompleteTwoFactor(w http.ResponseWriter, r *http.Request) {
	var req struct {
		SessionToken string `json:"session_token"`
	}
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	tokens, err := h.service.CompleteTwoFactor(r.Context(), req.SessionToken, r.UserAgent(), clientIP(r))
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]any{"access_token": tokens.AccessToken, "refresh_token": tokens.RefreshToken, "access_token_expires_at": tokens.ExpiresAt})
}

func (h *Handler) setRefreshCookie(w http.ResponseWriter, value string) {
	http.SetCookie(w, &http.Cookie{
		Name:     h.refreshCookie.Name,
		Value:    value,
		Path:     h.refreshCookie.Path,
		Domain:   h.refreshCookie.Domain,
		MaxAge:   int(h.refreshCookie.MaxAge.Seconds()),
		HttpOnly: h.refreshCookie.HTTPOnly,
		Secure:   h.refreshCookie.Secure,
		SameSite: h.refreshCookie.SameSite,
	})
}

func (h *Handler) clearRefreshCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     h.refreshCookie.Name,
		Value:    "",
		Path:     h.refreshCookie.Path,
		Domain:   h.refreshCookie.Domain,
		MaxAge:   -1,
		HttpOnly: h.refreshCookie.HTTPOnly,
		Secure:   h.refreshCookie.Secure,
		SameSite: h.refreshCookie.SameSite,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     legacyRefreshCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: h.refreshCookie.HTTPOnly,
		Secure:   h.refreshCookie.Secure,
		SameSite: h.refreshCookie.SameSite,
	})
}

func (h *Handler) refreshCookieValue(r *http.Request) string {
	if raw, _ := r.Cookie(h.refreshCookie.Name); raw != nil {
		return raw.Value
	}
	if raw, _ := r.Cookie(legacyRefreshCookieName); raw != nil {
		return raw.Value
	}
	return ""
}

func clientIP(r *http.Request) net.IP {
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		forwarded = strings.Split(forwarded, ",")[0]
		return net.ParseIP(strings.TrimSpace(forwarded))
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return nil
	}
	return net.ParseIP(host)
}

func TokenResponse(tokens domain.Tokens) map[string]any {
	if tokens.AccessToken == "" {
		return nil
	}
	return map[string]any{"access_token": tokens.AccessToken, "access_token_expires_at": tokens.ExpiresAt}
}

func Unauthorized(w http.ResponseWriter, r *http.Request) {
	httpjson.WriteError(w, r, apperr.New(http.StatusUnauthorized, apperr.CodeUnauthorized, "Authentication is required."))
}
