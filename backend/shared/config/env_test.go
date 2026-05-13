package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestStringReadsFileFallback(t *testing.T) {
	t.Setenv("APP_SECRET", "")
	dir := t.TempDir()
	path := filepath.Join(dir, "secret")
	if err := os.WriteFile(path, []byte("from-file\n"), 0o600); err != nil {
		t.Fatalf("write secret: %v", err)
	}
	t.Setenv("APP_SECRET_FILE", path)

	if got := String("APP_SECRET", "fallback"); got != "from-file" {
		t.Fatalf("expected file value, got %q", got)
	}
}

func TestStringEnvWinsOverFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "secret")
	if err := os.WriteFile(path, []byte("from-file"), 0o600); err != nil {
		t.Fatalf("write secret: %v", err)
	}
	t.Setenv("APP_SECRET", "from-env")
	t.Setenv("APP_SECRET_FILE", path)

	if got := String("APP_SECRET", "fallback"); got != "from-env" {
		t.Fatalf("expected env value, got %q", got)
	}
}

func TestBoolParsesFileFallback(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "flag")
	if err := os.WriteFile(path, []byte("true"), 0o600); err != nil {
		t.Fatalf("write flag: %v", err)
	}
	t.Setenv("APP_FLAG_FILE", path)

	if !Bool("APP_FLAG", false) {
		t.Fatal("expected file bool to be true")
	}
}
