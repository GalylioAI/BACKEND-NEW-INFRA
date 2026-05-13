package service_test

import (
	"context"
	"net/http"
	"testing"
	"time"

	otpclient "backend/otp-service/internal/client"
	otpdomain "backend/otp-service/internal/domain"
	"backend/otp-service/internal/service"
	"backend/shared/apperr"
	"backend/shared/password"

	jwtlib "github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func TestStartDisableTwoFactorRejectsOAuthOnlyUserWithoutPassword(t *testing.T) {
	userID := uuid.New()
	repo := &fakeOTPRepo{}
	users := &fakeOTPUserClient{user: otpdomain.User{
		ID:               userID,
		Email:            "google@example.com",
		AuthProvider:     otpdomain.ProviderGoogle,
		PasswordHash:     nil,
		TwoFactorEnabled: true,
	}}
	svc := service.New(repo, users, &fakeOTPAuthClient{}, fakePublisher{}, nil)

	err := svc.StartDisableTwoFactor(context.Background(), userID, "Strong$123")

	app := apperr.From(err)
	if app.Status != http.StatusForbidden || app.Code != apperr.CodeLocalPasswordRequired {
		t.Fatalf("expected local password required, got %#v", app)
	}
	if repo.createdChallenge.Purpose != "" {
		t.Fatalf("disable challenge must not be created, got %#v", repo.createdChallenge)
	}
	if users.twoFactorSet {
		t.Fatal("2FA must not be disabled during disable start")
	}
}

func TestStartDisableTwoFactorCreatesDisableChallengeWithoutDisabling(t *testing.T) {
	userID := uuid.New()
	hash := testPasswordHash(t, "Strong$123")
	repo := &fakeOTPRepo{}
	users := &fakeOTPUserClient{user: otpdomain.User{
		ID:               userID,
		Email:            "linked@example.com",
		FullName:         "Linked User",
		AuthProvider:     otpdomain.ProviderGoogle,
		PasswordHash:     &hash,
		TwoFactorEnabled: true,
	}}
	svc := service.New(repo, users, &fakeOTPAuthClient{}, fakePublisher{}, nil)

	if err := svc.StartDisableTwoFactor(context.Background(), userID, "Strong$123"); err != nil {
		t.Fatalf("StartDisableTwoFactor returned error: %v", err)
	}
	if repo.createdChallenge.Purpose != otpdomain.OTPTypeTwoFactorDisable {
		t.Fatalf("expected 2fa_disable challenge, got %#v", repo.createdChallenge)
	}
	if users.twoFactorSet {
		t.Fatal("disable start must not disable 2FA")
	}
}

func TestVerifyDisableTwoFactorConsumesChallengeAndDisables(t *testing.T) {
	userID := uuid.New()
	repo := &fakeOTPRepo{challenge: testChallenge(t, userID, "disable-jti", otpdomain.OTPTypeTwoFactorDisable, "123456")}
	users := &fakeOTPUserClient{user: otpdomain.User{ID: userID, Email: "user@example.com", TwoFactorEnabled: true}}
	svc := service.New(repo, users, &fakeOTPAuthClient{}, fakePublisher{}, nil)

	if err := svc.VerifyDisableTwoFactor(context.Background(), userID, "123456"); err != nil {
		t.Fatalf("VerifyDisableTwoFactor returned error: %v", err)
	}
	if !repo.consumed {
		t.Fatal("disable challenge should be consumed")
	}
	if !users.twoFactorSet || users.twoFactorEnabled {
		t.Fatal("2FA should be disabled only after disable verification")
	}
}

func TestVerifyEnableTwoFactorRejectsWrongPurpose(t *testing.T) {
	userID := uuid.New()
	repo := &fakeOTPRepo{challenge: testChallenge(t, userID, "disable-jti", otpdomain.OTPTypeTwoFactorDisable, "123456")}
	users := &fakeOTPUserClient{user: otpdomain.User{ID: userID, Email: "user@example.com"}}
	svc := service.New(repo, users, &fakeOTPAuthClient{}, fakePublisher{}, nil)

	err := svc.VerifyEnableTwoFactor(context.Background(), userID, "123456")

	if apperr.From(err).Code != apperr.CodeInvalidTwoFASession {
		t.Fatalf("expected wrong-purpose challenge to fail, got %v", err)
	}
	if users.twoFactorSet {
		t.Fatal("wrong-purpose challenge must not enable 2FA")
	}
}

func TestVerifyLoginTwoFactorRejectsWrongJTIAndConsumesOnSuccess(t *testing.T) {
	privateKey, publicKeyPath := testJWTKey(t)
	verifier, err := service.NewPendingJWTVerifier(publicKeyPath, "test-issuer", "test-audience")
	if err != nil {
		t.Fatalf("NewPendingJWTVerifier returned error: %v", err)
	}
	userID := uuid.New()
	repo := &fakeOTPRepo{challenge: testChallenge(t, userID, "expected-jti", otpdomain.OTPTypeTwoFactorLogin, "123456")}
	users := &fakeOTPUserClient{user: otpdomain.User{ID: userID, Email: "user@example.com", IsVerified: true}}
	auth := &fakeOTPAuthClient{}
	svc := service.New(repo, users, auth, fakePublisher{}, verifier)

	wrong := signToken(t, privateKey, service.PendingClaims{
		Type:             "2fa_pending",
		Purpose:          otpdomain.OTPTypeTwoFactorLogin,
		RegisteredClaims: registeredClaimsWithJTI(userID, "wrong-jti"),
	})
	if _, err := svc.VerifyLoginTwoFactor(context.Background(), "123456", wrong); apperr.From(err).Code != apperr.CodeInvalidTwoFASession {
		t.Fatalf("expected wrong JTI to fail, got %v", err)
	}

	valid := signToken(t, privateKey, service.PendingClaims{
		Type:             "2fa_pending",
		Purpose:          otpdomain.OTPTypeTwoFactorLogin,
		RegisteredClaims: registeredClaimsWithJTI(userID, "expected-jti"),
	})
	tokens, err := svc.VerifyLoginTwoFactor(context.Background(), "123456", valid)
	if err != nil {
		t.Fatalf("VerifyLoginTwoFactor returned error: %v", err)
	}
	if tokens.AccessToken != "access-token" || !repo.consumed {
		t.Fatalf("expected access token and consumed login challenge, tokens=%#v consumed=%v", tokens, repo.consumed)
	}
	if len(auth.authMethods) != 2 || auth.authMethods[0] != "password" || auth.authMethods[1] != "otp" {
		t.Fatalf("expected password+otp auth methods, got %#v", auth.authMethods)
	}
}

func TestVerifyLoginTwoFactorIncrementsAttemptsAndFailsAfterMaxAttempts(t *testing.T) {
	privateKey, publicKeyPath := testJWTKey(t)
	verifier, err := service.NewPendingJWTVerifier(publicKeyPath, "test-issuer", "test-audience")
	if err != nil {
		t.Fatalf("NewPendingJWTVerifier returned error: %v", err)
	}
	userID := uuid.New()
	repo := &fakeOTPRepo{challenge: testChallenge(t, userID, "login-jti", otpdomain.OTPTypeTwoFactorLogin, "123456")}
	repo.challenge.MaxAttempts = 2
	users := &fakeOTPUserClient{user: otpdomain.User{ID: userID, Email: "user@example.com", IsVerified: true}}
	svc := service.New(repo, users, &fakeOTPAuthClient{}, fakePublisher{}, verifier)
	pending := signToken(t, privateKey, service.PendingClaims{
		Type:             "2fa_pending",
		Purpose:          otpdomain.OTPTypeTwoFactorLogin,
		RegisteredClaims: registeredClaimsWithJTI(userID, "login-jti"),
	})

	if _, err := svc.VerifyLoginTwoFactor(context.Background(), "000000", pending); apperr.From(err).Code != apperr.CodeOTPInvalid {
		t.Fatalf("expected first bad OTP to be invalid, got %v", err)
	}
	if repo.challenge.Attempts != 1 {
		t.Fatalf("expected attempts increment, got %d", repo.challenge.Attempts)
	}
	if _, err := svc.VerifyLoginTwoFactor(context.Background(), "000000", pending); apperr.From(err).Code != apperr.CodeOTPMaxAttempts {
		t.Fatalf("expected max attempts error, got %v", err)
	}
	if !repo.consumed {
		t.Fatal("challenge should be consumed after max failed attempts")
	}
}

func registeredClaimsWithJTI(userID uuid.UUID, jti string) jwtlib.RegisteredClaims {
	claims := registeredClaims(userID)
	claims.ID = jti
	return claims
}

func testPasswordHash(t *testing.T, plain string) string {
	t.Helper()
	hash, err := password.HashWithParams(plain, password.Params{Memory: 1024, Iterations: 1, Parallelism: 1, SaltLength: 16, KeyLength: 32})
	if err != nil {
		t.Fatalf("hash password: %v", err)
	}
	return hash
}

func testChallenge(t *testing.T, userID uuid.UUID, jti, purpose, code string) otpdomain.TwoFactorChallenge {
	t.Helper()
	hash, err := bcrypt.GenerateFromPassword([]byte(code), 4)
	if err != nil {
		t.Fatalf("GenerateFromPassword returned error: %v", err)
	}
	return otpdomain.TwoFactorChallenge{
		ID:          uuid.New(),
		UserID:      userID,
		JTI:         jti,
		Purpose:     purpose,
		OTPHash:     string(hash),
		MaxAttempts: 3,
		ExpiresAt:   time.Now().Add(time.Minute),
		CreatedAt:   time.Now(),
	}
}

type fakeOTPRepo struct {
	challenge        otpdomain.TwoFactorChallenge
	createdChallenge otpdomain.TwoFactorChallenge
	consumed         bool
}

func (f *fakeOTPRepo) InvalidateOTPCodes(context.Context, uuid.UUID, string) error { return nil }
func (f *fakeOTPRepo) CreateOTPCode(context.Context, uuid.UUID, string, string, time.Time) (otpdomain.OTPCode, error) {
	return otpdomain.OTPCode{}, nil
}
func (f *fakeOTPRepo) GetActiveOTPCode(context.Context, uuid.UUID, string) (otpdomain.OTPCode, error) {
	return otpdomain.OTPCode{}, apperr.New(http.StatusNotFound, apperr.CodeOTPNotFound, "Verification code was not found or has expired.")
}
func (f *fakeOTPRepo) IncrementOTPAttempts(context.Context, uuid.UUID) (otpdomain.OTPCode, error) {
	return otpdomain.OTPCode{}, nil
}
func (f *fakeOTPRepo) MarkOTPUsed(context.Context, uuid.UUID) error { return nil }
func (f *fakeOTPRepo) CheckAndIncrementRateLimit(context.Context, uuid.UUID, string, time.Duration) (int, error) {
	return 0, nil
}
func (f *fakeOTPRepo) RevokeTwoFactorChallenges(context.Context, uuid.UUID, string) error { return nil }
func (f *fakeOTPRepo) CreateTwoFactorChallenge(_ context.Context, userID uuid.UUID, jti, purpose, otpHash string, expiresAt time.Time, maxAttempts int16) (otpdomain.TwoFactorChallenge, error) {
	f.createdChallenge = otpdomain.TwoFactorChallenge{
		ID:          uuid.New(),
		UserID:      userID,
		JTI:         jti,
		Purpose:     purpose,
		OTPHash:     otpHash,
		ExpiresAt:   expiresAt,
		MaxAttempts: maxAttempts,
		CreatedAt:   time.Now(),
	}
	f.challenge = f.createdChallenge
	return f.createdChallenge, nil
}
func (f *fakeOTPRepo) GetTwoFactorChallengeByJTI(_ context.Context, userID uuid.UUID, jti, purpose string) (otpdomain.TwoFactorChallenge, error) {
	if f.challenge.UserID != userID || f.challenge.JTI != jti || f.challenge.Purpose != purpose || f.challenge.ConsumedAt != nil || f.challenge.RevokedAt != nil || time.Now().After(f.challenge.ExpiresAt) || f.challenge.Attempts >= f.challenge.MaxAttempts {
		return otpdomain.TwoFactorChallenge{}, apperr.New(http.StatusUnauthorized, apperr.CodeInvalidTwoFASession, "2FA challenge is invalid or expired.")
	}
	return f.challenge, nil
}
func (f *fakeOTPRepo) GetLatestTwoFactorChallenge(_ context.Context, userID uuid.UUID, purpose string) (otpdomain.TwoFactorChallenge, error) {
	if f.challenge.UserID != userID || f.challenge.Purpose != purpose || f.challenge.ConsumedAt != nil || f.challenge.RevokedAt != nil || time.Now().After(f.challenge.ExpiresAt) || f.challenge.Attempts >= f.challenge.MaxAttempts {
		return otpdomain.TwoFactorChallenge{}, apperr.New(http.StatusUnauthorized, apperr.CodeInvalidTwoFASession, "2FA challenge is invalid or expired.")
	}
	return f.challenge, nil
}
func (f *fakeOTPRepo) IncrementTwoFactorChallengeAttempts(context.Context, uuid.UUID) (otpdomain.TwoFactorChallenge, error) {
	if f.challenge.Attempts >= f.challenge.MaxAttempts {
		return otpdomain.TwoFactorChallenge{}, apperr.New(http.StatusUnauthorized, apperr.CodeInvalidTwoFASession, "2FA challenge is invalid or expired.")
	}
	f.challenge.Attempts++
	return f.challenge, nil
}
func (f *fakeOTPRepo) ConsumeTwoFactorChallenge(_ context.Context, id uuid.UUID) error {
	now := time.Now()
	f.challenge.ConsumedAt = &now
	f.consumed = true
	return nil
}
func (f *fakeOTPRepo) CreatePasswordResetToken(context.Context, uuid.UUID, string, time.Time) (otpdomain.PasswordResetToken, error) {
	return otpdomain.PasswordResetToken{}, nil
}
func (f *fakeOTPRepo) GetPasswordResetToken(context.Context, string) (otpdomain.PasswordResetToken, error) {
	return otpdomain.PasswordResetToken{}, nil
}
func (f *fakeOTPRepo) MarkResetTokenUsed(context.Context, uuid.UUID) error    { return nil }
func (f *fakeOTPRepo) InvalidateResetTokens(context.Context, uuid.UUID) error { return nil }
func (f *fakeOTPRepo) Ping(context.Context) error                             { return nil }

type fakeOTPUserClient struct {
	user             otpdomain.User
	twoFactorSet     bool
	twoFactorEnabled bool
}

func (f *fakeOTPUserClient) GetByID(context.Context, uuid.UUID) (otpdomain.User, error) {
	return f.user, nil
}
func (f *fakeOTPUserClient) GetByEmail(context.Context, string) (otpdomain.User, error) {
	return f.user, nil
}
func (f *fakeOTPUserClient) MarkVerified(context.Context, uuid.UUID) error { return nil }
func (f *fakeOTPUserClient) SetTwoFactor(_ context.Context, _ uuid.UUID, enabled bool) error {
	f.twoFactorSet = true
	f.twoFactorEnabled = enabled
	return nil
}
func (f *fakeOTPUserClient) UpdatePasswordHash(context.Context, uuid.UUID, string) error { return nil }
func (f *fakeOTPUserClient) VerifyPassword(_ context.Context, _ uuid.UUID, plain string) error {
	if f.user.PasswordHash == nil {
		return apperr.New(http.StatusForbidden, apperr.CodeLocalPasswordRequired, "Set a local password before disabling 2FA.")
	}
	ok, err := password.Verify(plain, *f.user.PasswordHash)
	if err != nil || !ok {
		return apperr.New(http.StatusUnauthorized, apperr.CodeInvalidCurrentPass, "Current password is incorrect.")
	}
	return nil
}

type fakeOTPAuthClient struct {
	authMethods []string
}

func (f *fakeOTPAuthClient) IssueJWT(_ context.Context, _ uuid.UUID, authMethods []string) (otpclient.TokenPair, error) {
	f.authMethods = authMethods
	return otpclient.TokenPair{AccessToken: "access-token", SetCookie: []string{"refresh_token=value"}}, nil
}
func (f *fakeOTPAuthClient) IssuePendingTwoFactor(context.Context, uuid.UUID, string) (otpclient.PendingToken, error) {
	return otpclient.PendingToken{}, nil
}
func (f *fakeOTPAuthClient) RevokeSessions(context.Context, uuid.UUID) error { return nil }

type fakePublisher struct{}

func (fakePublisher) Publish(context.Context, string, any) error { return nil }
func (fakePublisher) Close() error                               { return nil }
