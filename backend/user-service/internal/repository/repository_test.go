package repository

import (
	"net/http"
	"testing"

	"backend/shared/apperr"

	"github.com/jackc/pgx/v5/pgconn"
)

func TestMapPGErrorMapsUniqueConstraintsToFieldErrors(t *testing.T) {
	tests := []struct {
		name       string
		constraint string
		field      string
	}{
		{name: "email", constraint: "uq_users_email_active", field: "email"},
		{name: "username", constraint: "uq_users_username_active", field: "username"},
		{name: "phone", constraint: "uq_users_phone_active", field: "phone"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := mapPGError(&pgconn.PgError{
				Code:           "23505",
				ConstraintName: tt.constraint,
			})

			app := apperr.From(err)
			if app.Status != http.StatusConflict || app.Code != apperr.CodeConflict {
				t.Fatalf("expected conflict app error, got %#v", app)
			}
			if app.Fields[tt.field] == "" {
				t.Fatalf("expected field error for %q, got %#v", tt.field, app.Fields)
			}
		})
	}
}
