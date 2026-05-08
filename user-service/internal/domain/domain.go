package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	RoleUser       = "user"
	RoleAdmin      = "admin"
	RoleSuperAdmin = "superadmin"

	ProviderManual = "manual"
	ProviderGoogle = "google"
)

type User struct {
	ID                  uuid.UUID  `json:"id"`
	FullName            string     `json:"full_name"`
	Username            string     `json:"username"`
	Email               string     `json:"email"`
	Phone               *string    `json:"phone,omitempty"`
	PasswordHash        *string    `json:"-"`
	GouvernoratID       *int16     `json:"gouvernorat_id,omitempty"`
	Role                string     `json:"role"`
	AuthProvider        string     `json:"auth_provider"`
	IsVerified          bool       `json:"is_verified"`
	IsBanned            bool       `json:"is_banned"`
	BanReason           *string    `json:"ban_reason,omitempty"`
	TwoFactorEnabled    bool       `json:"two_factor_enabled"`
	TwoFactorEnabledAt  *time.Time `json:"two_factor_enabled_at,omitempty"`
	FailedLoginAttempts int16      `json:"failed_login_attempts,omitempty"`
	LockedUntil         *time.Time `json:"locked_until,omitempty"`
	LastLoginAt         *time.Time `json:"last_login_at,omitempty"`
	DeletedAt           *time.Time `json:"deleted_at,omitempty"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
}

type Gouvernorat struct {
	ID   int16  `json:"id"`
	Name string `json:"name"`
}

type PublicUser struct {
	ID                 uuid.UUID  `json:"id"`
	FullName           string     `json:"full_name"`
	Username           string     `json:"username"`
	Email              string     `json:"email"`
	Phone              *string    `json:"phone,omitempty"`
	GouvernoratID      *int16     `json:"gouvernorat_id,omitempty"`
	Role               string     `json:"role"`
	AuthProvider       string     `json:"auth_provider"`
	IsVerified         bool       `json:"is_verified"`
	IsBanned           bool       `json:"is_banned"`
	BanReason          *string    `json:"ban_reason,omitempty"`
	TwoFactorEnabled   bool       `json:"two_factor_enabled"`
	TwoFactorEnabledAt *time.Time `json:"two_factor_enabled_at,omitempty"`
	LastLoginAt        *time.Time `json:"last_login_at,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

func Public(user User) PublicUser {
	return PublicUser{
		ID:                 user.ID,
		FullName:           user.FullName,
		Username:           user.Username,
		Email:              user.Email,
		Phone:              user.Phone,
		GouvernoratID:      user.GouvernoratID,
		Role:               user.Role,
		AuthProvider:       user.AuthProvider,
		IsVerified:         user.IsVerified,
		IsBanned:           user.IsBanned,
		BanReason:          user.BanReason,
		TwoFactorEnabled:   user.TwoFactorEnabled,
		TwoFactorEnabledAt: user.TwoFactorEnabledAt,
		LastLoginAt:        user.LastLoginAt,
		CreatedAt:          user.CreatedAt,
		UpdatedAt:          user.UpdatedAt,
	}
}

type CredentialUser struct {
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
	TwoFactorEnabledAt  *time.Time `json:"two_factor_enabled_at,omitempty"`
	FailedLoginAttempts int16      `json:"failed_login_attempts"`
	LockedUntil         *time.Time `json:"locked_until,omitempty"`
	DeletedAt           *time.Time `json:"deleted_at,omitempty"`
}

func Credential(user User) CredentialUser {
	return CredentialUser{
		ID:                  user.ID,
		FullName:            user.FullName,
		Username:            user.Username,
		Email:               user.Email,
		PasswordHash:        user.PasswordHash,
		Role:                user.Role,
		AuthProvider:        user.AuthProvider,
		IsVerified:          user.IsVerified,
		IsBanned:            user.IsBanned,
		TwoFactorEnabled:    user.TwoFactorEnabled,
		TwoFactorEnabledAt:  user.TwoFactorEnabledAt,
		FailedLoginAttempts: user.FailedLoginAttempts,
		LockedUntil:         user.LockedUntil,
		DeletedAt:           user.DeletedAt,
	}
}
