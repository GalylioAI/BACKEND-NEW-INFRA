package service_test

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"os"
	"testing"
	"time"

	"backend/otp-service/internal/service"

	jwtlib "github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func TestGenerateOTPReturnsSixDigitsAndBcryptHash(t *testing.T) {
	plain, hash, err := service.GenerateOTP()
	if err != nil {
		t.Fatalf("GenerateOTP returned error: %v", err)
	}
	if len(plain) != 6 {
		t.Fatalf("expected 6-digit OTP, got %q", plain)
	}
	for _, r := range plain {
		if r < '0' || r > '9' {
			t.Fatalf("OTP contains non-digit: %q", plain)
		}
	}
	if plain == hash {
		t.Fatal("OTP hash must not equal the plain code")
	}
	if !service.VerifyOTP(plain, hash) {
		t.Fatal("hash should verify the generated OTP")
	}
	if service.VerifyOTP("000000", hash) && plain != "000000" {
		t.Fatal("wrong OTP should not verify")
	}
}

func TestPendingJWTVerifierAcceptsOnlyLoginPendingTokens(t *testing.T) {
	privateKey, publicKeyPath := testJWTKey(t)
	verifier, err := service.NewPendingJWTVerifier(publicKeyPath, "test-issuer", "test-audience")
	if err != nil {
		t.Fatalf("NewPendingJWTVerifier returned error: %v", err)
	}
	userID := uuid.New()

	pending := signToken(t, privateKey, service.PendingClaims{
		Type:             "2fa_pending",
		Purpose:          "2fa_login",
		RegisteredClaims: registeredClaims(userID),
	})
	claims, err := verifier.VerifyLoginPending(pending)
	if err != nil {
		t.Fatalf("pending token should verify: %v", err)
	}
	if claims.UserID != userID || claims.JTI == "" {
		t.Fatalf("unexpected pending claims: %#v", claims)
	}

	access := signToken(t, privateKey, service.AccessClaims{
		Type:             "access",
		Role:             "user",
		Email:            "user@example.com",
		RegisteredClaims: registeredClaims(userID),
	})
	if _, err := verifier.VerifyLoginPending(access); err == nil {
		t.Fatal("access token must not verify as login 2FA pending token")
	}
}

func TestPendingJWTVerifierRejectsGenericSignedToken(t *testing.T) {
	privateKey, publicKeyPath := testJWTKey(t)
	verifier, err := service.NewPendingJWTVerifier(publicKeyPath, "test-issuer", "test-audience")
	if err != nil {
		t.Fatalf("NewPendingJWTVerifier returned error: %v", err)
	}
	raw := signToken(t, privateKey, jwtlib.RegisteredClaims{
		Issuer:    "test-issuer",
		Subject:   uuid.NewString(),
		Audience:  jwtlib.ClaimStrings{"test-audience"},
		ExpiresAt: jwtlib.NewNumericDate(time.Now().Add(time.Minute)),
		IssuedAt:  jwtlib.NewNumericDate(time.Now()),
		ID:        uuid.NewString(),
	})
	if _, err := verifier.VerifyLoginPending(raw); err == nil {
		t.Fatal("generic signed token must not verify as a 2FA session")
	}
}

func registeredClaims(userID uuid.UUID) jwtlib.RegisteredClaims {
	now := time.Now().UTC()
	return jwtlib.RegisteredClaims{
		Issuer:    "test-issuer",
		Subject:   userID.String(),
		Audience:  jwtlib.ClaimStrings{"test-audience"},
		ExpiresAt: jwtlib.NewNumericDate(now.Add(time.Minute)),
		IssuedAt:  jwtlib.NewNumericDate(now),
		ID:        uuid.NewString(),
	}
}

func testJWTKey(t *testing.T) (*rsa.PrivateKey, string) {
	t.Helper()
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("rsa.GenerateKey returned error: %v", err)
	}
	publicPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PUBLIC KEY",
		Bytes: x509.MarshalPKCS1PublicKey(&privateKey.PublicKey),
	})
	path := t.TempDir() + "/public.pem"
	if err := os.WriteFile(path, publicPEM, 0o600); err != nil {
		t.Fatalf("os.WriteFile returned error: %v", err)
	}
	return privateKey, path
}

func signToken(t *testing.T, privateKey *rsa.PrivateKey, claims jwtlib.Claims) string {
	t.Helper()
	raw, err := jwtlib.NewWithClaims(jwtlib.SigningMethodRS256, claims).SignedString(privateKey)
	if err != nil {
		t.Fatalf("SignedString returned error: %v", err)
	}
	return raw
}
