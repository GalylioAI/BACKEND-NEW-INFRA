package userctx

import (
	"context"
	"net/http"

	"backend/shared/apperr"

	"github.com/google/uuid"
)

const (
	HeaderUserID    = "X-User-Id"
	HeaderUserRole  = "X-User-Role"
	HeaderUserEmail = "X-User-Email"
)

type Role string

const (
	RoleUser       Role = "user"
	RoleAdmin      Role = "admin"
	RoleSuperAdmin Role = "superadmin"
)

type User struct {
	ID    uuid.UUID
	Role  Role
	Email string
}

type key struct{}

func FromHeaders(r *http.Request) (User, error) {
	id, err := uuid.Parse(r.Header.Get(HeaderUserID))
	if err != nil {
		return User{}, apperr.New(http.StatusUnauthorized, apperr.CodeUnauthorized, "Authentication is required.")
	}
	role := Role(r.Header.Get(HeaderUserRole))
	if role != RoleUser && role != RoleAdmin && role != RoleSuperAdmin {
		return User{}, apperr.New(http.StatusForbidden, apperr.CodeForbidden, "You do not have permission to perform this action.")
	}
	return User{ID: id, Role: role, Email: r.Header.Get(HeaderUserEmail)}, nil
}

func With(ctx context.Context, user User) context.Context {
	return context.WithValue(ctx, key{}, user)
}

func FromContext(ctx context.Context) (User, bool) {
	user, ok := ctx.Value(key{}).(User)
	return user, ok
}

func IsAdmin(role Role) bool {
	return role == RoleAdmin || role == RoleSuperAdmin
}
