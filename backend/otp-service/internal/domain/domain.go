package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	OTPTypeEmailVerify      = "email_verify"
	OTPTypeTwoFactorLogin   = "2fa_login"
	OTPTypeTwoFactorEnable  = "2fa_enable"
	OTPTypeTwoFactorDisable = "2fa_disable"
	OTPTypePasswordReset    = "password_reset"

	ProviderManual = "manual"
	ProviderGoogle = "google"
)

type OTPCode struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	CodeHash    string
	Type        string
	Attempts    int16
	MaxAttempts int16
	Used        bool
	ExpiresAt   time.Time
	CreatedAt   time.Time
}

type PasswordResetToken struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	TokenHash string
	Used      bool
	ExpiresAt time.Time
	CreatedAt time.Time
}

type TwoFactorChallenge struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	JTI         string
	Purpose     string
	OTPHash     string
	Attempts    int16
	MaxAttempts int16
	ExpiresAt   time.Time
	ConsumedAt  *time.Time
	RevokedAt   *time.Time
	CreatedAt   time.Time
}

type User struct {
	ID               uuid.UUID  `json:"id"`
	FullName         string     `json:"full_name"`
	Username         string     `json:"username"`
	Email            string     `json:"email"`
	PasswordHash     *string    `json:"password_hash,omitempty"`
	Role             string     `json:"role"`
	AuthProvider     string     `json:"auth_provider"`
	IsVerified       bool       `json:"is_verified"`
	IsBanned         bool       `json:"is_banned"`
	TwoFactorEnabled bool       `json:"two_factor_enabled"`
	LockedUntil      *time.Time `json:"locked_until,omitempty"`
	DeletedAt        *time.Time `json:"deleted_at,omitempty"`
}
