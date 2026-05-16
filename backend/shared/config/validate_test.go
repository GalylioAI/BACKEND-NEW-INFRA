package config

import "testing"

func TestValidateInternalSecretProduction(t *testing.T) {
	if err := ValidateInternalSecret("", "production"); err == nil {
		t.Fatal("expected error for empty secret")
	}
	short := make([]byte, 16)
	for i := range short {
		short[i] = 'a'
	}
	if err := ValidateInternalSecret(string(short), "production"); err == nil {
		t.Fatal("expected error for short secret")
	}
	secret := make([]byte, 32)
	for i := range secret {
		secret[i] = 'b'
	}
	if err := ValidateInternalSecret(string(secret), "production"); err != nil {
		t.Fatalf("expected valid secret, got %v", err)
	}
}

func TestValidateInternalSecretDevelopment(t *testing.T) {
	if err := ValidateInternalSecret("", "development"); err != nil {
		t.Fatalf("development should allow empty secret: %v", err)
	}
}
