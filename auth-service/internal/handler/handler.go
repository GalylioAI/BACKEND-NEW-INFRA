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

const (
	refreshCookieName       = "refresh_token"
	legacyRefreshCookieName = "__Host-refresh_token"
	refreshCookiePath       = "/auth"
)

type Handler struct {
	service        *service.Service
	internalSecret string
	refreshTTL     time.Duration
	cookieSecure   bool
	cookieDomain   string
	healthCheck    http.HandlerFunc
}

func New(service *service.Service, internalSecret string, refreshTTL time.Duration, cookieSecure bool, cookieDomain string, healthCheck ...http.HandlerFunc) *Handler {
	h := &Handler{service: service, internalSecret: internalSecret, refreshTTL: refreshTTL, cookieSecure: cookieSecure, cookieDomain: cookieDomain}
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
	mux.HandleFunc("POST /auth/refresh", h.refresh)
	mux.HandleFunc("POST /auth/logout", h.logout)
	mux.Handle("POST /auth/logout-all", middleware.Chain(http.HandlerFunc(h.logoutAll), middleware.RequireInternalSecret(h.internalSecret), middleware.RequireUserContext))

	internal := middleware.RequireInternalSecret(h.internalSecret)
	mux.Handle("POST /internal/auth/revoke-all", internal(http.HandlerFunc(h.internalRevokeAll)))
	mux.Handle("DELETE /internal/auth/sessions/{user_id}", internal(http.HandlerFunc(h.internalDeleteSessions)))
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
	h.setRefreshCookie(w, tokens.RefreshToken)
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

func (h *Handler) logout(w http.ResponseWriter, r *http.Request) {
	if token := h.refreshCookieValue(r); token != "" {
		if err := h.service.Logout(r.Context(), token); err != nil {
			httpjson.WriteError(w, r, err)
			return
		}
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

func (h *Handler) internalIssueJWT(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID uuid.UUID `json:"user_id"`
	}
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	tokens, err := h.service.IssueTokenPairForUser(r.Context(), req.UserID, r.UserAgent(), clientIP(r))
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
		Name:     refreshCookieName,
		Value:    value,
		Path:     refreshCookiePath,
		Domain:   h.cookieDomain,
		MaxAge:   int(h.refreshTTL.Seconds()),
		HttpOnly: true,
		Secure:   h.cookieSecure,
		SameSite: http.SameSiteStrictMode,
	})
}

func (h *Handler) clearRefreshCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     refreshCookieName,
		Value:    "",
		Path:     refreshCookiePath,
		Domain:   h.cookieDomain,
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   h.cookieSecure,
		SameSite: http.SameSiteStrictMode,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     legacyRefreshCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   h.cookieSecure,
		SameSite: http.SameSiteStrictMode,
	})
}

func (h *Handler) refreshCookieValue(r *http.Request) string {
	if raw, _ := r.Cookie(refreshCookieName); raw != nil {
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
