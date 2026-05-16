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

	jwtlib "github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func TestTwoLoginsProduceDifferentSessionIDs(t *testing.T) {
	user := verifiedManualUser(t, false)
	repo := &fakeAuthRepo{}
	users := &fakeUserClient{user: user}
	svc := service.New(repo, users, &fakeOTPClient{}, testJWTManager(t), nil, 30*24*time.Hour)

	res1, _, err := svc.ManualLogin(context.Background(), service.ManualLoginRequest{Identifier: user.Email, Password: "Strong$123"}, "device-a", net.ParseIP("127.0.0.1"))
	if err != nil {
		t.Fatalf("first login failed: %v", err)
	}
	res2, _, err := svc.ManualLogin(context.Background(), service.ManualLoginRequest{Identifier: user.Email, Password: "Strong$123"}, "device-b", net.ParseIP("127.0.0.2"))
	if err != nil {
		t.Fatalf("second login failed: %v", err)
	}
	sid1, _ := parseTokenClaims(t, res1.AccessToken)["sid"].(string)
	sid2, _ := parseTokenClaims(t, res2.AccessToken)["sid"].(string)
	if sid1 == "" || sid2 == "" || sid1 == sid2 {
		t.Fatalf("expected different session ids, got %q and %q", sid1, sid2)
	}
}

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
	if result.TokenType != "Bearer" || result.ExpiresIn <= 0 {
		t.Fatalf("expected bearer metadata on login result, got type=%q expires_in=%d", result.TokenType, result.ExpiresIn)
	}
	claims := parseTokenClaims(t, result.AccessToken)
	if got := claimStrings(claims["amr"]); len(got) != 1 || got[0] != "password" {
		t.Fatalf("expected password amr, got %#v", claims["amr"])
	}
	if _, ok := claims["auth_time"].(float64); !ok {
		t.Fatalf("expected auth_time claim, got %#v", claims["auth_time"])
	}
	if _, ok := claims["sid"].(string); !ok {
		t.Fatalf("expected sid claim, got %#v", claims["sid"])
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
	pendingClaims := parseTokenClaims(t, result.TwoFactorSessionToken)
	if got := claimStrings(pendingClaims["amr"]); len(got) != 1 || got[0] != "password" {
		t.Fatalf("expected pending token to preserve password primary method, got %#v", pendingClaims["amr"])
	}
	if tokens.RefreshToken != "" || repo.refreshCreated {
		t.Fatal("refresh token must not be issued before 2FA verification")
	}
	if !otp.sent {
		t.Fatal("expected 2FA OTP to be requested")
	}
}

func TestGoogleLoginWithTwoFactorIssuesPendingJWTAndSendsOTP(t *testing.T) {
	user := verifiedManualUser(t, true)
	user.AuthProvider = domain.ProviderGoogle
	user.PasswordHash = nil
	repo := &fakeAuthRepo{}
	otp := &fakeOTPClient{}
	svc := service.New(repo, &fakeUserClient{user: user}, otp, testJWTManager(t), fakeGoogleVerifier{claims: service.GoogleClaims{Email: user.Email, Name: user.FullName}}, 30*24*time.Hour)

	result, tokens, err := svc.GoogleLogin(context.Background(), "google-id-token", "device", net.ParseIP("127.0.0.1"))
	if err != nil {
		t.Fatalf("GoogleLogin returned error: %v", err)
	}
	if !result.TwoFactorRequired || result.TwoFactorSessionToken == "" {
		t.Fatal("expected Google login to require 2FA")
	}
	pendingClaims := parseTokenClaims(t, result.TwoFactorSessionToken)
	if got := claimStrings(pendingClaims["amr"]); len(got) != 1 || got[0] != "google" {
		t.Fatalf("expected pending token to preserve google primary method, got %#v", pendingClaims["amr"])
	}
	if tokens.AccessToken != "" || tokens.RefreshToken != "" || repo.refreshCreated {
		t.Fatal("Google login must not issue normal tokens before 2FA verification")
	}
	if !otp.sent {
		t.Fatal("expected 2FA OTP to be requested")
	}
}

func TestRefreshRotatesTokenAndIssuesAccess(t *testing.T) {
	user := verifiedManualUser(t, false)
	authTime := time.Now().Add(-30 * time.Minute).UTC()
	sessionID := uuid.New()
	repo := &fakeAuthRepo{rotateRecord: domain.RefreshRecord{
		UserID:      user.ID,
		AuthTime:    authTime,
		AuthMethods: []string{"password", "otp"},
		SessionID:   sessionID,
	}}
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
	claims := parseTokenClaims(t, tokens.AccessToken)
	if got := claimStrings(claims["amr"]); len(got) != 2 || got[0] != "password" || got[1] != "otp" {
		t.Fatalf("expected refresh to preserve amr, got %#v", claims["amr"])
	}
	if got := int64(claims["auth_time"].(float64)); got != authTime.Unix() {
		t.Fatalf("expected refresh to preserve auth_time %d, got %d", authTime.Unix(), got)
	}
	if got := claims["sid"]; got != sessionID.String() {
		t.Fatalf("expected refresh to preserve session id, got %#v", got)
	}
}

func TestSessionRotatesRefreshAndReturnsPublicUser(t *testing.T) {
	user := verifiedManualUser(t, false)
	authTime := time.Now().Add(-30 * time.Minute).UTC()
	sessionID := uuid.New()
	repo := &fakeAuthRepo{rotateRecord: domain.RefreshRecord{
		UserID:      user.ID,
		AuthTime:    authTime,
		AuthMethods: []string{"password"},
		SessionID:   sessionID,
	}}
	users := &fakeUserClient{
		user:       user,
		publicUser: domain.PublicUser{ID: user.ID, FullName: user.FullName, Username: user.Username, Email: user.Email, Role: user.Role, AuthProvider: user.AuthProvider, IsVerified: user.IsVerified},
	}
	svc := service.New(repo, users, &fakeOTPClient{}, testJWTManager(t), nil, 30*24*time.Hour)

	result, tokens, err := svc.Session(context.Background(), "old-refresh-token", "device", net.ParseIP("127.0.0.1"))
	if err != nil {
		t.Fatalf("Session returned error: %v", err)
	}
	if result.AccessToken == "" || tokens.RefreshToken == "" {
		t.Fatal("expected session to return access token and rotated refresh token")
	}
	if result.User.ID != user.ID || result.User.Email != user.Email {
		t.Fatalf("expected public session user, got %#v", result.User)
	}
	if !users.publicLookup {
		t.Fatal("expected public user lookup")
	}
}

func TestIssuedAccessTokenContainsAccessType(t *testing.T) {
	user := verifiedManualUser(t, false)
	manager := testJWTManager(t)
	raw, _, err := manager.IssueAccess(user)
	if err != nil {
		t.Fatalf("IssueAccess returned error: %v", err)
	}
	parsed, _, err := jwtlib.NewParser().ParseUnverified(raw, jwtlib.MapClaims{})
	if err != nil {
		t.Fatalf("ParseUnverified returned error: %v", err)
	}
	claims := parsed.Claims.(jwtlib.MapClaims)
	if claims["typ"] != "access" {
		t.Fatalf("expected typ=access, got %#v", claims["typ"])
	}
}

func TestIssueTokenPairForUserUsesProvidedAuthMethodsFor2FALogin(t *testing.T) {
	user := verifiedManualUser(t, true)
	repo := &fakeAuthRepo{}
	svc := service.New(repo, &fakeUserClient{user: user}, &fakeOTPClient{}, testJWTManager(t), nil, 30*24*time.Hour)

	tokens, err := svc.IssueTokenPairForUser(context.Background(), user.ID, []string{"google", "otp"}, "device", net.ParseIP("127.0.0.1"))
	if err != nil {
		t.Fatalf("IssueTokenPairForUser returned error: %v", err)
	}
	claims := parseTokenClaims(t, tokens.AccessToken)
	if got := claimStrings(claims["amr"]); len(got) != 2 || got[0] != "google" || got[1] != "otp" {
		t.Fatalf("expected google+otp amr, got %#v", claims["amr"])
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
	rotateRecord     domain.RefreshRecord
}

func (f *fakeAuthRepo) CreateRefreshToken(context.Context, uuid.UUID, string, string, net.IP, time.Time, time.Time, []string, uuid.UUID) error {
	f.refreshCreated = true
	return nil
}
func (f *fakeAuthRepo) RotateRefreshToken(context.Context, string, string, string, net.IP, time.Time) (domain.RefreshRecord, bool, error) {
	f.refreshRotated = true
	return f.rotateRecord, false, nil
}
func (f *fakeAuthRepo) RevokeRefreshToken(context.Context, string) error { return nil }
func (f *fakeAuthRepo) RevokeAllRefreshTokens(context.Context, uuid.UUID) error {
	return nil
}
func (f *fakeAuthRepo) RevokeOtherRefreshTokens(context.Context, uuid.UUID, uuid.UUID) error {
	return nil
}
func (f *fakeAuthRepo) CreateAuditEvent(context.Context, string, uuid.UUID, net.IP, string, any) error {
	return nil
}
func (f *fakeAuthRepo) Ping(context.Context) error { return nil }

func parseTokenClaims(t *testing.T, raw string) jwtlib.MapClaims {
	t.Helper()
	parsed, _, err := jwtlib.NewParser().ParseUnverified(raw, jwtlib.MapClaims{})
	if err != nil {
		t.Fatalf("ParseUnverified returned error: %v", err)
	}
	return parsed.Claims.(jwtlib.MapClaims)
}

func claimStrings(raw any) []string {
	values, ok := raw.([]any)
	if !ok {
		return nil
	}
	out := make([]string, 0, len(values))
	for _, value := range values {
		text, _ := value.(string)
		out = append(out, text)
	}
	return out
}

type fakeOTPClient struct {
	sent bool
	jti  string
}

func (f *fakeOTPClient) SendLogin2FA(_ context.Context, _ uuid.UUID, jti string) error {
	f.sent = true
	f.jti = jti
	return nil
}

type fakeUserClient struct {
	user         domain.User
	publicUser   domain.PublicUser
	loginFailure bool
	loginSuccess bool
	publicLookup bool
}

func (f *fakeUserClient) LookupCredential(context.Context, string) (domain.User, error) {
	return f.user, nil
}
func (f *fakeUserClient) GetByID(context.Context, uuid.UUID) (domain.User, error) { return f.user, nil }
func (f *fakeUserClient) GetPublicByID(context.Context, uuid.UUID) (domain.PublicUser, error) {
	f.publicLookup = true
	return f.publicUser, nil
}
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

type fakeGoogleVerifier struct {
	claims service.GoogleClaims
	err    error
}

func (f fakeGoogleVerifier) Verify(context.Context, string) (service.GoogleClaims, error) {
	if f.err != nil {
		return service.GoogleClaims{}, f.err
	}
	return f.claims, nil
}
