package config

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"os"
	"path/filepath"
	"testing"
)

func TestLoadRequiresStrongInternalSecretInProduction(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("INTERNAL_SECRET", "short")
	publicPath := writeTestPublicKey(t)
	t.Setenv("JWT_PUBLIC_KEY_PATH", publicPath)
	t.Setenv("RS256_PUBLIC_KEY_PATH", publicPath)
	t.Setenv("CORS_ALLOWED_ORIGINS", "https://example.com")
	t.Setenv("REDIS_URL", "redis://localhost:6379/0")

	_, err := Load()
	if err == nil {
		t.Fatal("expected production config to reject short INTERNAL_SECRET")
	}
}

func writeTestPublicKey(t *testing.T) string {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	publicDER, err := x509.MarshalPKIXPublicKey(&key.PublicKey)
	if err != nil {
		t.Fatalf("marshal public key: %v", err)
	}
	path := filepath.Join(t.TempDir(), "jwt_public.pem")
	file, err := os.Create(path)
	if err != nil {
		t.Fatalf("create key file: %v", err)
	}
	if err := pem.Encode(file, &pem.Block{Type: "PUBLIC KEY", Bytes: publicDER}); err != nil {
		t.Fatalf("encode pem: %v", err)
	}
	if err := file.Close(); err != nil {
		t.Fatalf("close key file: %v", err)
	}
	return path
}
