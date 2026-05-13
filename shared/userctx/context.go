package userctx

import (
	"context"
	"net/http"
	"strconv"
	"strings"
	"time"

	"backend/shared/apperr"

	"github.com/google/uuid"
)

const (
	HeaderUserID      = "X-User-Id"
	HeaderUserRole    = "X-User-Role"
	HeaderUserEmail   = "X-User-Email"
	HeaderAuthTime    = "X-Auth-Time"
	HeaderAuthMethods = "X-Auth-Methods"
	HeaderSessionID   = "X-Session-Id"
)

type Role string

const (
	RoleUser       Role = "user"
	RoleAdmin      Role = "admin"
	RoleSuperAdmin Role = "superadmin"
)

type User struct {
	ID          uuid.UUID
	Role        Role
	Email       string
	AuthTime    time.Time
	AuthMethods []string
	SessionID   uuid.UUID
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
	user := User{ID: id, Role: role, Email: r.Header.Get(HeaderUserEmail)}
	if raw := strings.TrimSpace(r.Header.Get(HeaderAuthTime)); raw != "" {
		seconds, err := strconv.ParseInt(raw, 10, 64)
		if err != nil || seconds <= 0 {
			return User{}, apperr.New(http.StatusUnauthorized, apperr.CodeUnauthorized, "Authentication is required.")
		}
		user.AuthTime = time.Unix(seconds, 0).UTC()
	}
	if raw := strings.TrimSpace(r.Header.Get(HeaderAuthMethods)); raw != "" {
		for _, method := range strings.Split(raw, ",") {
			method = strings.TrimSpace(method)
			if method != "" {
				user.AuthMethods = append(user.AuthMethods, method)
			}
		}
	}
	if raw := strings.TrimSpace(r.Header.Get(HeaderSessionID)); raw != "" {
		sessionID, err := uuid.Parse(raw)
		if err != nil {
			return User{}, apperr.New(http.StatusUnauthorized, apperr.CodeUnauthorized, "Authentication is required.")
		}
		user.SessionID = sessionID
	}
	return user, nil
}

func With(ctx context.Context, user User) context.Context {
	return context.WithValue(ctx, key{}, user)
}

func FromContext(ctx context.Context) (User, bool) {
	user, ok := ctx.Value(key{}).(User)
	return user, ok
}

func RoleRank(role Role) int {
	switch role {
	case RoleUser:
		return 10
	case RoleAdmin:
		return 20
	case RoleSuperAdmin:
		return 30
	default:
		return 0
	}
}

func HasMinRole(role, minimum Role) bool {
	return RoleRank(role) >= RoleRank(minimum) && RoleRank(minimum) > 0
}

func IsAdmin(role Role) bool {
	return HasMinRole(role, RoleAdmin)
}

func IsSuperAdmin(role Role) bool {
	return role == RoleSuperAdmin
}
