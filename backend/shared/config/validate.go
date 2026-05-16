package config

import (
	"fmt"
	"os"
	"strings"
)

const minInternalSecretBytes = 32

func IsProduction(env string) bool {
	return strings.EqualFold(strings.TrimSpace(env), "production")
}

func ValidateInternalSecret(secret, env string) error {
	if !IsProduction(env) {
		return nil
	}
	if strings.TrimSpace(secret) == "" {
		return fmt.Errorf("INTERNAL_SECRET is required in production")
	}
	if len(secret) < minInternalSecretBytes {
		return fmt.Errorf("INTERNAL_SECRET must be at least %d bytes in production", minInternalSecretBytes)
	}
	return nil
}

func ValidateJWTKeyPaths(publicKeyPath, env string) error {
	if !IsProduction(env) {
		return nil
	}
	if strings.TrimSpace(publicKeyPath) == "" {
		return fmt.Errorf("JWT_PUBLIC_KEY_PATH is required in production")
	}
	if _, err := os.Stat(publicKeyPath); err != nil {
		return fmt.Errorf("JWT public key file is not readable at %s: %w", publicKeyPath, err)
	}
	return nil
}

func ValidateJWTSigningKeyPaths(privateKeyPath, publicKeyPath, env string) error {
	if err := ValidateJWTKeyPaths(publicKeyPath, env); err != nil {
		return err
	}
	if !IsProduction(env) {
		return nil
	}
	if strings.TrimSpace(privateKeyPath) == "" {
		return fmt.Errorf("JWT_PRIVATE_KEY_PATH is required in production")
	}
	if _, err := os.Stat(privateKeyPath); err != nil {
		return fmt.Errorf("JWT private key file is not readable at %s: %w", privateKeyPath, err)
	}
	return nil
}
