package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	ProviderManual = "manual"
	ProviderGoogle = "google"

	RoleUser       = "user"
	RoleAdmin      = "admin"
	RoleSuperAdmin = "superadmin"
)

type User struct {
	ID                  uuid.UUID  `json:"id"`
	FullName            string     `json:"full_name"`
	Username            string     `json:"username"`
	Email               string     `json:"email"`
	PasswordHash        *string    `json:"password_hash,omitempty"`
	Role                string     `json:"role"`
	AuthProvider        string     `json:"auth_provider"`
	IsVerified          bool       `json:"is_verified"`
	IsBanned            bool       `json:"is_banned"`
	TwoFactorEnabled    bool       `json:"two_factor_enabled"`
	FailedLoginAttempts int16      `json:"failed_login_attempts"`
	LockedUntil         *time.Time `json:"locked_until,omitempty"`
	DeletedAt           *time.Time `json:"deleted_at,omitempty"`
}

type Tokens struct {
	AccessToken  string    `json:"access_token"`
	ExpiresAt    time.Time `json:"expires_at"`
	RefreshToken string    `json:"-"`
}

type RefreshRecord struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	TokenHash   string
	Revoked     bool
	ExpiresAt   time.Time
	AuthTime    time.Time
	AuthMethods []string
	SessionID   uuid.UUID
}
