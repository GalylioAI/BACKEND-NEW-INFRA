package handler

import (
	"net/http"
	"strings"

	"backend/otp-service/internal/service"
	"backend/shared/apperr"
	"backend/shared/httpjson"
	"backend/shared/middleware"
	"backend/shared/userctx"
	"backend/shared/validate"

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

	internalOnly := middleware.RequireInternalSecret(h.internalSecret)
	protected := func(fn http.HandlerFunc) http.Handler {
		return middleware.Chain(fn, middleware.RequireInternalSecret(h.internalSecret), middleware.RequireUserContext)
	}
	mux.Handle("POST /otp/email/send", internalOnly(http.HandlerFunc(h.sendEmailVerification)))
	mux.Handle("POST /otp/email/verify", internalOnly(http.HandlerFunc(h.verifyEmail)))
	mux.Handle("POST /otp/2fa/enable", protected(h.enableTwoFactor))
	mux.Handle("POST /otp/2fa/disable", protected(h.disableTwoFactor))
	mux.Handle("POST /otp/2fa/enable/verify", protected(h.verifyEnableTwoFactor))

	mux.Handle("POST /otp/2fa/login/verify", internalOnly(http.HandlerFunc(h.verifyLoginTwoFactor)))
	mux.HandleFunc("POST /otp/password-reset/send", h.sendPasswordReset)
	mux.HandleFunc("POST /otp/password-reset/verify", h.verifyPasswordReset)
	mux.HandleFunc("POST /otp/password-reset/apply", h.applyPasswordReset)

	mux.Handle("POST /internal/otp/2fa/send-login", internalOnly(http.HandlerFunc(h.internalSendLoginTwoFactor)))

	return mux
}

func (h *Handler) health(w http.ResponseWriter, r *http.Request) {
	if h.healthCheck != nil {
		h.healthCheck(w, r)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) sendEmailVerification(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email" validate:"required,email,max=255"`
	}
	if !decodeAndValidate(w, r, &req) {
		return
	}
	if err := h.service.SendEmailVerificationByEmail(r.Context(), req.Email); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]string{"message": "Verification code sent to your email"})
}

func (h *Handler) verifyEmail(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email" validate:"required,email,max=255"`
		Code  string `json:"code" validate:"required,len=6,numeric"`
	}
	if !decodeAndValidate(w, r, &req) {
		return
	}
	if err := h.service.VerifyEmailByEmail(r.Context(), req.Email, req.Code); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]string{"message": "Email verified successfully"})
}

func (h *Handler) enableTwoFactor(w http.ResponseWriter, r *http.Request) {
	user, ok := userctx.FromContext(r.Context())
	if !ok {
		httpjson.WriteError(w, r, apperr.New(http.StatusUnauthorized, apperr.CodeUnauthorized, "Authentication is required."))
		return
	}
	var req struct {
		Password string `json:"password" validate:"required,max=128"`
	}
	if !decodeAndValidate(w, r, &req) {
		return
	}
	if err := h.service.EnableTwoFactor(r.Context(), user.ID, req.Password); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]string{
		"message": "Enter the code sent to your email to confirm 2FA activation",
	})
}

func (h *Handler) verifyEnableTwoFactor(w http.ResponseWriter, r *http.Request) {
	user, ok := userctx.FromContext(r.Context())
	if !ok {
		httpjson.WriteError(w, r, apperr.New(http.StatusUnauthorized, apperr.CodeUnauthorized, "Authentication is required."))
		return
	}
	var req struct {
		Code string `json:"code" validate:"required,len=6,numeric"`
	}
	if !decodeAndValidate(w, r, &req) {
		return
	}
	if err := h.service.VerifyEnableTwoFactor(r.Context(), user.ID, req.Code); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]string{"message": "2FA enabled successfully"})
}

func (h *Handler) verifyLoginTwoFactor(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Code string `json:"code" validate:"required,len=6,numeric"`
	}
	if !decodeAndValidate(w, r, &req) {
		return
	}
	sessionToken := twoFactorPendingToken(r)
	if sessionToken == "" {
		httpjson.WriteError(w, r, apperr.Validation(apperr.FieldErrors{"authorization": "2FA pending token is required."}))
		return
	}
	tokens, err := h.service.VerifyLoginTwoFactor(r.Context(), req.Code, sessionToken)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	for _, cookie := range tokens.SetCookie {
		w.Header().Add("Set-Cookie", cookie)
	}
	httpjson.Write(w, r, http.StatusOK, map[string]any{"access_token": tokens.AccessToken, "access_token_expires_at": tokens.AccessTokenExpiresAt})
}

func twoFactorPendingToken(r *http.Request) string {
	if token := strings.TrimSpace(r.Header.Get("X-2FA-Pending-Token")); token != "" {
		return token
	}
	if token := bearerToken(r.Header.Get("Authorization")); token != "" {
		return token
	}
	return ""
}

func bearerToken(header string) string {
	if len(header) < len("Bearer ") || !strings.EqualFold(header[:len("Bearer ")], "Bearer ") {
		return ""
	}
	return strings.TrimSpace(header[len("Bearer "):])
}

func (h *Handler) disableTwoFactor(w http.ResponseWriter, r *http.Request) {
	user, ok := userctx.FromContext(r.Context())
	if !ok {
		httpjson.WriteError(w, r, apperr.New(http.StatusUnauthorized, apperr.CodeUnauthorized, "Authentication is required."))
		return
	}
	var req struct {
		Code string `json:"code"`
	}
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	if req.Code != "" && len(req.Code) != 6 {
		httpjson.WriteError(w, r, apperr.Validation(apperr.FieldErrors{"code": "Must be exactly 6 digits."}))
		return
	}
	message, err := h.service.DisableTwoFactor(r.Context(), user.ID, req.Code)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]string{"message": message})
}

func (h *Handler) sendPasswordReset(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email" validate:"required,email,max=255"`
	}
	if !decodeAndValidate(w, r, &req) {
		return
	}
	if err := h.service.SendPasswordReset(r.Context(), req.Email); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]string{"message": "If an account exists, a reset code has been sent"})
}

func (h *Handler) verifyPasswordReset(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email" validate:"required,email,max=255"`
		Code  string `json:"code" validate:"required,len=6,numeric"`
	}
	if !decodeAndValidate(w, r, &req) {
		return
	}
	resetToken, err := h.service.VerifyPasswordReset(r.Context(), req.Email, req.Code)
	if err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]string{"reset_token": resetToken})
}

func (h *Handler) applyPasswordReset(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ResetToken         string `json:"reset_token" validate:"required,max=256"`
		NewPassword        string `json:"new_password" validate:"required,min=8,max=128"`
		NewPasswordConfirm string `json:"new_password_confirm" validate:"required,min=8,max=128"`
	}
	if !decodeAndValidate(w, r, &req) {
		return
	}
	if err := h.service.ApplyPasswordReset(r.Context(), req.ResetToken, req.NewPassword, req.NewPasswordConfirm); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.Write(w, r, http.StatusOK, map[string]string{"message": "Password reset successful. Please log in."})
}

func (h *Handler) internalSendLoginTwoFactor(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID uuid.UUID `json:"user_id"`
		JTI    string    `json:"jti"`
	}
	if err := httpjson.Decode(r, &req); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	if req.UserID == uuid.Nil {
		httpjson.WriteError(w, r, apperr.Validation(apperr.FieldErrors{"user_id": "This field is required."}))
		return
	}
	if strings.TrimSpace(req.JTI) == "" {
		httpjson.WriteError(w, r, apperr.Validation(apperr.FieldErrors{"jti": "This field is required."}))
		return
	}
	if err := h.service.SendLoginTwoFactor(r.Context(), req.UserID, req.JTI); err != nil {
		httpjson.WriteError(w, r, err)
		return
	}
	httpjson.WriteNoContent(w, r)
}

func decodeAndValidate(w http.ResponseWriter, r *http.Request, dst any) bool {
	if err := httpjson.Decode(r, dst); err != nil {
		httpjson.WriteError(w, r, err)
		return false
	}
	if errors := validate.Validate(dst); len(errors) > 0 {
		httpjson.WriteError(w, r, apperr.Validation(validate.Fields(errors)))
		return false
	}
	return true
}
