package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"backend/auth-service/internal/domain"
	"backend/shared/apperr"
	"backend/shared/middleware"

	"github.com/google/uuid"
)

type UserClient interface {
	LookupCredential(ctx context.Context, identifier string) (domain.User, error)
	GetByID(ctx context.Context, userID uuid.UUID) (domain.User, error)
	GetPublicByID(ctx context.Context, userID uuid.UUID) (domain.PublicUser, error)
	RecordLoginFailure(ctx context.Context, userID uuid.UUID, currentFailures int16) error
	RecordLoginSuccess(ctx context.Context, userID uuid.UUID) error
	GetOrCreateGoogle(ctx context.Context, email, fullName, picture string) (domain.User, bool, error)
}

type HTTPUserClient struct {
	baseURL string
	secret  string
	client  *http.Client
}

func NewHTTPUserClient(baseURL, secret string) *HTTPUserClient {
	return &HTTPUserClient{baseURL: strings.TrimRight(baseURL, "/"), secret: secret, client: &http.Client{Timeout: 5 * time.Second}}
}

func (c *HTTPUserClient) LookupCredential(ctx context.Context, identifier string) (domain.User, error) {
	var user domain.User
	err := c.get(ctx, "/internal/users/lookup?identifier="+url.QueryEscape(identifier), &user)
	return user, err
}

func (c *HTTPUserClient) GetByID(ctx context.Context, userID uuid.UUID) (domain.User, error) {
	var user domain.User
	err := c.get(ctx, "/internal/users/"+userID.String(), &user)
	return user, err
}

func (c *HTTPUserClient) GetPublicByID(ctx context.Context, userID uuid.UUID) (domain.PublicUser, error) {
	var user domain.PublicUser
	err := c.get(ctx, "/internal/users/profile/"+userID.String(), &user)
	return user, err
}

func (c *HTTPUserClient) RecordLoginFailure(ctx context.Context, userID uuid.UUID, currentFailures int16) error {
	return c.post(ctx, "/internal/users/login-failure", map[string]any{"user_id": userID.String(), "current_failures": currentFailures}, nil)
}

func (c *HTTPUserClient) RecordLoginSuccess(ctx context.Context, userID uuid.UUID) error {
	return c.post(ctx, "/internal/users/login-success", map[string]any{"user_id": userID.String()}, nil)
}

func (c *HTTPUserClient) GetOrCreateGoogle(ctx context.Context, email, fullName, picture string) (domain.User, bool, error) {
	var out struct {
		User    domain.User `json:"user"`
		Created bool        `json:"created"`
	}
	err := c.post(ctx, "/internal/users/google", map[string]string{"email": email, "full_name": fullName, "picture": picture}, &out)
	return out.User, out.Created, err
}

func (c *HTTPUserClient) get(ctx context.Context, path string, dst any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+path, nil)
	if err != nil {
		return err
	}
	req.Header.Set(middleware.HeaderInternalSecret, c.secret)
	return c.do(req, dst)
}

func (c *HTTPUserClient) post(ctx context.Context, path string, body any, dst any) error {
	payload, err := json.Marshal(body)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+path, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set(middleware.HeaderInternalSecret, c.secret)
	return c.do(req, dst)
}

func (c *HTTPUserClient) do(req *http.Request, dst any) error {
	resp, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	var envelope struct {
		Success bool            `json:"success"`
		Data    json.RawMessage `json:"data"`
		Error   struct {
			Code    string             `json:"code"`
			Message string             `json:"message"`
			Fields  apperr.FieldErrors `json:"fields"`
		} `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&envelope); err != nil {
		return err
	}
	if resp.StatusCode >= 300 || !envelope.Success {
		if envelope.Error.Code == "" {
			return fmt.Errorf("user service returned status %d", resp.StatusCode)
		}
		if len(envelope.Error.Fields) > 0 {
			return apperr.WithFields(resp.StatusCode, envelope.Error.Code, envelope.Error.Message, envelope.Error.Fields)
		}
		return apperr.New(resp.StatusCode, envelope.Error.Code, envelope.Error.Message)
	}
	if dst == nil {
		return nil
	}
	return json.Unmarshal(envelope.Data, dst)
}
