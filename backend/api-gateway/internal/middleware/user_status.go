package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"backend/shared/apperr"
	"backend/shared/httpjson"
	sharedmw "backend/shared/middleware"
	"backend/shared/userctx"
)

type UserStatusChecker struct {
	userServiceURL string
	internalSecret string
	client         *http.Client
}

type gatewayUserStatus struct {
	ID         string `json:"id"`
	Email      string `json:"email"`
	Role       string `json:"role"`
	IsVerified bool   `json:"is_verified"`
	IsBanned   bool   `json:"is_banned"`
}

func NewUserStatusChecker(userServiceURL, internalSecret string) *UserStatusChecker {
	return &UserStatusChecker{
		userServiceURL: strings.TrimRight(userServiceURL, "/"),
		internalSecret: internalSecret,
		client:         &http.Client{Timeout: 2 * time.Second},
	}
}

func (c *UserStatusChecker) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if c == nil || c.userServiceURL == "" || c.internalSecret == "" {
			httpjson.WriteError(w, r, apperr.New(http.StatusServiceUnavailable, "USER_STATUS_UNAVAILABLE", "User status could not be verified."))
			return
		}
		userID := r.Header.Get(userctx.HeaderUserID)
		if strings.TrimSpace(userID) == "" {
			httpjson.WriteError(w, r, apperr.New(http.StatusUnauthorized, "INVALID_TOKEN", "Token claims are malformed."))
			return
		}
		user, err := c.fetch(r.Context(), userID)
		if err != nil {
			httpjson.WriteError(w, r, err)
			return
		}
		if user.IsBanned {
			httpjson.WriteError(w, r, apperr.New(http.StatusForbidden, apperr.CodeAccountBanned, "This account is banned."))
			return
		}
		if !user.IsVerified {
			httpjson.WriteError(w, r, apperr.New(http.StatusForbidden, apperr.CodeAccountNotVerified, "Please verify your account before continuing."))
			return
		}
		r.Header.Set(userctx.HeaderUserRole, user.Role)
		r.Header.Set(userctx.HeaderUserEmail, user.Email)
		next.ServeHTTP(w, r)
	})
}

func (c *UserStatusChecker) fetch(ctx context.Context, userID string) (gatewayUserStatus, error) {
	reqCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(reqCtx, http.MethodGet, c.userServiceURL+"/internal/users/status/"+userID, nil)
	if err != nil {
		return gatewayUserStatus{}, apperr.New(http.StatusServiceUnavailable, "USER_STATUS_UNAVAILABLE", "User status could not be verified.")
	}
	req.Header.Set(sharedmw.HeaderInternalSecret, c.internalSecret)
	resp, err := c.client.Do(req)
	if err != nil {
		return gatewayUserStatus{}, apperr.New(http.StatusServiceUnavailable, "USER_STATUS_UNAVAILABLE", "User status could not be verified.")
	}
	defer resp.Body.Close()
	var envelope struct {
		Success bool              `json:"success"`
		Data    gatewayUserStatus `json:"data"`
		Error   struct {
			Code    string `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&envelope); err != nil {
		return gatewayUserStatus{}, apperr.New(http.StatusServiceUnavailable, "USER_STATUS_UNAVAILABLE", "User status could not be verified.")
	}
	if resp.StatusCode >= 300 || !envelope.Success {
		if resp.StatusCode == http.StatusNotFound {
			return gatewayUserStatus{}, apperr.New(http.StatusUnauthorized, "INVALID_TOKEN", "Access token is invalid.")
		}
		if envelope.Error.Code != "" {
			return gatewayUserStatus{}, apperr.New(resp.StatusCode, envelope.Error.Code, envelope.Error.Message)
		}
		return gatewayUserStatus{}, apperr.New(http.StatusServiceUnavailable, "USER_STATUS_UNAVAILABLE", "User status could not be verified.")
	}
	return envelope.Data, nil
}
