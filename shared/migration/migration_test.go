package migration

import (
	"strings"
	"testing"
)

func TestRedactPostgresURLPassword(t *testing.T) {
	input := `failed to open database, "postgres://auth_user:secret-pass@host.docker.internal:5432/auth_db?sslmode=disable"`
	got := redact(input)

	if strings.Contains(got, "secret-pass") {
		t.Fatalf("expected password to be redacted, got %q", got)
	}
	if !strings.Contains(got, "auth_user:<redacted>@host.docker.internal") {
		t.Fatalf("expected redacted URL, got %q", got)
	}
}
