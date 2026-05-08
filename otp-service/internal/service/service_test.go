package service_test

import (
	"testing"

	"backend/otp-service/internal/service"
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
