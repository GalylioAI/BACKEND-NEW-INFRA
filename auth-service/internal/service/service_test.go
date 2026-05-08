package service_test

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"net"
	"os"
	"testing"
	"time"

	"backend/auth-service/internal/domain"
	authjwt "backend/auth-service/internal/jwt"
	"backend/auth-service/internal/service"
	"backend/shared/apperr"
	"backend/shared/password"

	"github.com/google/uuid"
)

func TestManualLoginIssuesTokenPair(t *testing.T) {
	user := verifiedManualUser(t, false)
	repo := &fakeAuthRepo{}
	users := &fakeUserClient{user: user}
	svc := service.New(repo, users, &fakeOTPClient{}, testJWTManager(t), nil, 30*24*time.Hour)

	result, tokens, err := svc.ManualLogin(context.Background(), service.ManualLoginRequest{Identifier: user.Email, Password: "Strong$123"}, "test-device", net.ParseIP("127.0.0.1"))
	if err != nil {
		t.Fatalf("ManualLogin returned error: %v", err)
	}
	if result.AccessToken == "" || tokens.RefreshToken == "" {
		t.Fatal("expected access and refresh tokens")
	}
	if !repo.refreshCreated {
		t.Fatal("expected refresh token to be stored")
	}
	if !users.loginSuccess {
		t.Fatal("expected login success to be recorded")
	}
}

func TestManualLoginInvalidPasswordRecordsFailure(t *testing.T) {
	user := verifiedManualUser(t, false)
	users := &fakeUserClient{user: user}
	svc := service.New(&fakeAuthRepo{}, users, &fakeOTPClient{}, testJWTManager(t), nil, 30*24*time.Hour)

	_, _, err := svc.ManualLogin(context.Background(), service.ManualLoginRequest{Identifier: user.Email, Password: "Wrong$123"}, "", nil)
	app := apperr.From(err)
	if app.Code != apperr.CodeInvalidCredentials {
		t.Fatalf("expected invalid credentials, got %#v", app)
	}
	if !users.loginFailure {
		t.Fatal("expected login failure to be recorded")
	}
}

func TestManualLoginWithTwoFactorIssuesPendingJWTAndSendsOTP(t *testing.T) {
	user := verifiedManualUser(t, true)
	repo := &fakeAuthRepo{}
	otp := &fakeOTPClient{}
	svc := service.New(repo, &fakeUserClient{user: user}, otp, testJWTManager(t), nil, 30*24*time.Hour)

	result, tokens, err := svc.ManualLogin(context.Background(), service.ManualLoginRequest{Identifier: user.Email, Password: "Strong$123"}, "", nil)
	if err != nil {
		t.Fatalf("ManualLogin returned error: %v", err)
	}
	if !result.TwoFactorRequired || result.TwoFactorSessionToken == "" {
		t.Fatal("expected 2FA session token")
	}
	if tokens.RefreshToken != "" || repo.refreshCreated {
		t.Fatal("refresh token must not be issued before 2FA verification")
	}
	if !otp.sent {
		t.Fatal("expected 2FA OTP to be requested")
	}
	if repo.twoFactorCreated {
		t.Fatal("2FA pending JWT must not create DB sessions")
	}
}

func TestRefreshRotatesTokenAndIssuesAccess(t *testing.T) {
	user := verifiedManualUser(t, false)
	repo := &fakeAuthRepo{rotateUserID: user.ID}
	svc := service.New(repo, &fakeUserClient{user: user}, &fakeOTPClient{}, testJWTManager(t), nil, 30*24*time.Hour)

	tokens, err := svc.Refresh(context.Background(), "old-refresh-token", "", nil)
	if err != nil {
		t.Fatalf("Refresh returned error: %v", err)
	}
	if tokens.AccessToken == "" || tokens.RefreshToken == "" {
		t.Fatal("expected rotated token pair")
	}
	if !repo.refreshRotated {
		t.Fatal("expected refresh token rotation")
	}
}

func verifiedManualUser(t *testing.T, twoFactor bool) domain.User {
	t.Helper()
	hash, err := password.HashWithParams("Strong$123", password.Params{Memory: 1024, Iterations: 1, Parallelism: 1, SaltLength: 16, KeyLength: 32})
	if err != nil {
		t.Fatalf("hash password: %v", err)
	}
	return domain.User{
		ID:               uuid.New(),
		FullName:         "Jane Doe",
		Username:         "janed",
		Email:            "jane@example.com",
		PasswordHash:     &hash,
		Role:             domain.RoleUser,
		AuthProvider:     domain.ProviderManual,
		IsVerified:       true,
		TwoFactorEnabled: twoFactor,
	}
}

func testJWTManager(t *testing.T) *authjwt.Manager {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate rsa key: %v", err)
	}
	privatePEM := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(key)})
	publicBytes, err := x509.MarshalPKIXPublicKey(&key.PublicKey)
	if err != nil {
		t.Fatalf("marshal public key: %v", err)
	}
	publicPEM := pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: publicBytes})
	dir := t.TempDir()
	privatePath := dir + "/jwt_private.pem"
	publicPath := dir + "/jwt_public.pem"
	if err := os.WriteFile(privatePath, privatePEM, 0600); err != nil {
		t.Fatalf("write private key: %v", err)
	}
	if err := os.WriteFile(publicPath, publicPEM, 0600); err != nil {
		t.Fatalf("write public key: %v", err)
	}
	manager, err := authjwt.New(privatePath, publicPath, "issuer", "audience", 15*time.Minute)
	if err != nil {
		t.Fatalf("create jwt manager: %v", err)
	}
	return manager
}

type fakeAuthRepo struct {
	refreshCreated   bool
	refreshRotated   bool
	twoFactorCreated bool
	rotateUserID     uuid.UUID
}

func (f *fakeAuthRepo) CreateRefreshToken(context.Context, uuid.UUID, string, string, net.IP, time.Time) error {
	f.refreshCreated = true
	return nil
}
func (f *fakeAuthRepo) RotateRefreshToken(context.Context, string, string, string, net.IP, time.Time) (uuid.UUID, bool, error) {
	f.refreshRotated = true
	return f.rotateUserID, false, nil
}
func (f *fakeAuthRepo) RevokeRefreshToken(context.Context, string) error { return nil }
func (f *fakeAuthRepo) RevokeAllRefreshTokens(context.Context, uuid.UUID) error {
	return nil
}
func (f *fakeAuthRepo) CreateTwoFactorSession(context.Context, uuid.UUID, string, time.Time) error {
	f.twoFactorCreated = true
	return nil
}
func (f *fakeAuthRepo) ConsumeTwoFactorSession(context.Context, string) (uuid.UUID, error) {
	return f.rotateUserID, nil
}
func (f *fakeAuthRepo) Ping(context.Context) error { return nil }

type fakeOTPClient struct {
	sent bool
}

func (f *fakeOTPClient) SendLogin2FA(context.Context, uuid.UUID) error {
	f.sent = true
	return nil
}

type fakeUserClient struct {
	user         domain.User
	loginFailure bool
	loginSuccess bool
}

func (f *fakeUserClient) LookupCredential(context.Context, string) (domain.User, error) {
	return f.user, nil
}
func (f *fakeUserClient) GetByID(context.Context, uuid.UUID) (domain.User, error) { return f.user, nil }
func (f *fakeUserClient) RecordLoginFailure(context.Context, uuid.UUID, int16) error {
	f.loginFailure = true
	return nil
}
func (f *fakeUserClient) RecordLoginSuccess(context.Context, uuid.UUID) error {
	f.loginSuccess = true
	return nil
}
func (f *fakeUserClient) GetOrCreateGoogle(context.Context, string, string, string) (domain.User, bool, error) {
	return f.user, false, nil
}
