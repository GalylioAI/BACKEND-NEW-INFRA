package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"backend/shared/middleware"

	"github.com/google/uuid"
)

type OTPClient interface {
	SendLogin2FA(ctx context.Context, userID uuid.UUID, jti string) error
}

type NoopOTPClient struct{}

func (NoopOTPClient) SendLogin2FA(context.Context, uuid.UUID, string) error { return nil }

type HTTPOTPClient struct {
	baseURL string
	secret  string
	client  *http.Client
}

func NewHTTPOTPClient(baseURL, secret string) *HTTPOTPClient {
	return &HTTPOTPClient{baseURL: strings.TrimRight(baseURL, "/"), secret: secret, client: &http.Client{Timeout: 5 * time.Second}}
}

func (c *HTTPOTPClient) SendLogin2FA(ctx context.Context, userID uuid.UUID, jti string) error {
	if c.baseURL == "" {
		return nil
	}
	body, err := json.Marshal(map[string]string{"user_id": userID.String(), "jti": jti})
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/internal/otp/2fa/send-login", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set(middleware.HeaderInternalSecret, c.secret)
	resp, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("otp service returned status %d", resp.StatusCode)
	}
	return nil
}
