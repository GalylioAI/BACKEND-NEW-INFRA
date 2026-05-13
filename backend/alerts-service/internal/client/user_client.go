package client

import (
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

type User struct {
	ID       uuid.UUID `json:"id"`
	FullName string    `json:"full_name"`
	Email    string    `json:"email"`
}

type UserClient interface {
	GetByID(ctx context.Context, userID uuid.UUID) (User, error)
}

type HTTPUserClient struct {
	baseURL string
	secret  string
	client  *http.Client
}

func NewHTTPUserClient(baseURL, secret string) *HTTPUserClient {
	return &HTTPUserClient{baseURL: strings.TrimRight(baseURL, "/"), secret: secret, client: &http.Client{Timeout: 5 * time.Second}}
}

func (c *HTTPUserClient) GetByID(ctx context.Context, userID uuid.UUID) (User, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/internal/users/"+userID.String(), nil)
	if err != nil {
		return User{}, err
	}
	req.Header.Set(middleware.HeaderInternalSecret, c.secret)
	resp, err := c.client.Do(req)
	if err != nil {
		return User{}, err
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
		return User{}, err
	}
	if resp.StatusCode >= 300 || !envelope.Success {
		if envelope.Error.Code == "" {
			return User{}, fmt.Errorf("user service returned status %d", resp.StatusCode)
		}
		return User{}, apperr.New(resp.StatusCode, envelope.Error.Code, envelope.Error.Message)
	}
	var user User
	if err := json.Unmarshal(envelope.Data, &user); err != nil {
		return User{}, err
	}
	return user, nil
}
