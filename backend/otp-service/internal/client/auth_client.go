package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"backend/shared/apperr"
	"backend/shared/middleware"

	"github.com/google/uuid"
)

type TokenPair struct {
	AccessToken          string    `json:"access_token"`
	AccessTokenExpiresAt time.Time `json:"access_token_expires_at"`
	SetCookie            []string  `json:"-"`
}

type PendingToken struct {
	SessionToken string    `json:"session_token"`
	ExpiresAt    time.Time `json:"expires_at"`
}

type AuthClient interface {
	IssueJWT(ctx context.Context, userID uuid.UUID, authMethods []string) (TokenPair, error)
	IssuePendingTwoFactor(ctx context.Context, userID uuid.UUID, contextValue string) (PendingToken, error)
	RevokeSessions(ctx context.Context, userID uuid.UUID) error
}

type HTTPAuthClient struct {
	baseURL string
	secret  string
	client  *http.Client
}

func NewHTTPAuthClient(baseURL, secret string) *HTTPAuthClient {
	return &HTTPAuthClient{baseURL: strings.TrimRight(baseURL, "/"), secret: secret, client: &http.Client{Timeout: 5 * time.Second}}
}

func (c *HTTPAuthClient) IssueJWT(ctx context.Context, userID uuid.UUID, authMethods []string) (TokenPair, error) {
	var out TokenPair
	headers, err := c.post(ctx, "/internal/auth/issue-jwt", map[string]any{"user_id": userID.String(), "auth_methods": authMethods}, &out)
	if err == nil {
		out.SetCookie = headers.Values("Set-Cookie")
	}
	return out, err
}

func (c *HTTPAuthClient) IssuePendingTwoFactor(ctx context.Context, userID uuid.UUID, contextValue string) (PendingToken, error) {
	var out PendingToken
	_, err := c.post(ctx, "/internal/auth/2fa-pending", map[string]string{"user_id": userID.String(), "context": contextValue}, &out)
	return out, err
}

func (c *HTTPAuthClient) RevokeSessions(ctx context.Context, userID uuid.UUID) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, c.baseURL+"/internal/auth/sessions/"+userID.String(), nil)
	if err != nil {
		return err
	}
	req.Header.Set(middleware.HeaderInternalSecret, c.secret)
	_, err = c.do(req, nil)
	return err
}

func (c *HTTPAuthClient) post(ctx context.Context, path string, body any, dst any) (http.Header, error) {
	payload, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+path, bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set(middleware.HeaderInternalSecret, c.secret)
	return c.do(req, dst)
}

func (c *HTTPAuthClient) do(req *http.Request, dst any) (http.Header, error) {
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var envelope struct {
		Success bool            `json:"success"`
		Data    json.RawMessage `json:"data"`
		Error   struct {
			Code    string `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&envelope); err != nil {
		return nil, err
	}
	if resp.StatusCode >= 300 || !envelope.Success {
		if envelope.Error.Code == "" {
			return nil, fmt.Errorf("auth service returned status %d", resp.StatusCode)
		}
		return nil, apperr.New(resp.StatusCode, envelope.Error.Code, envelope.Error.Message)
	}
	if dst != nil {
		if err := json.Unmarshal(envelope.Data, dst); err != nil {
			return nil, err
		}
	}
	return resp.Header.Clone(), nil
}
