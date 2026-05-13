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

	"backend/otp-service/internal/domain"
	"backend/shared/apperr"
	"backend/shared/middleware"

	"github.com/google/uuid"
)

type UserClient interface {
	GetByID(ctx context.Context, id uuid.UUID) (domain.User, error)
	GetByEmail(ctx context.Context, email string) (domain.User, error)
	MarkVerified(ctx context.Context, id uuid.UUID) error
	SetTwoFactor(ctx context.Context, id uuid.UUID, enabled bool) error
	UpdatePasswordHash(ctx context.Context, id uuid.UUID, passwordHash string) error
	VerifyPassword(ctx context.Context, id uuid.UUID, plain string) error
}

type HTTPUserClient struct {
	baseURL string
	secret  string
	client  *http.Client
}

func NewHTTPUserClient(baseURL, secret string) *HTTPUserClient {
	return &HTTPUserClient{baseURL: strings.TrimRight(baseURL, "/"), secret: secret, client: &http.Client{Timeout: 5 * time.Second}}
}

func (c *HTTPUserClient) GetByID(ctx context.Context, id uuid.UUID) (domain.User, error) {
	var user domain.User
	err := c.get(ctx, "/internal/users/"+id.String(), &user)
	return user, err
}

func (c *HTTPUserClient) GetByEmail(ctx context.Context, email string) (domain.User, error) {
	var user domain.User
	err := c.get(ctx, "/internal/users/by-email/"+url.PathEscape(email), &user)
	return user, err
}

func (c *HTTPUserClient) MarkVerified(ctx context.Context, id uuid.UUID) error {
	return c.patch(ctx, "/internal/users/"+id.String()+"/verify", map[string]bool{}, nil)
}

func (c *HTTPUserClient) SetTwoFactor(ctx context.Context, id uuid.UUID, enabled bool) error {
	return c.patch(ctx, "/internal/users/"+id.String()+"/2fa", map[string]bool{"enabled": enabled}, nil)
}

func (c *HTTPUserClient) UpdatePasswordHash(ctx context.Context, id uuid.UUID, passwordHash string) error {
	return c.patch(ctx, "/internal/users/"+id.String()+"/password", map[string]string{"password_hash": passwordHash}, nil)
}

func (c *HTTPUserClient) VerifyPassword(ctx context.Context, id uuid.UUID, plain string) error {
	return c.post(ctx, "/internal/users/"+id.String()+"/verify-password", map[string]string{"password": plain}, nil)
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
	return c.withBody(ctx, http.MethodPost, path, body, dst)
}

func (c *HTTPUserClient) patch(ctx context.Context, path string, body any, dst any) error {
	return c.withBody(ctx, http.MethodPatch, path, body, dst)
}

func (c *HTTPUserClient) withBody(ctx context.Context, method, path string, body any, dst any) error {
	payload, err := json.Marshal(body)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, bytes.NewReader(payload))
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
			Code    string `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&envelope); err != nil {
		return err
	}
	if resp.StatusCode >= 300 || !envelope.Success {
		if envelope.Error.Code == "" {
			return fmt.Errorf("user service returned status %d", resp.StatusCode)
		}
		return apperr.New(resp.StatusCode, envelope.Error.Code, envelope.Error.Message)
	}
	if dst == nil {
		return nil
	}
	return json.Unmarshal(envelope.Data, dst)
}
