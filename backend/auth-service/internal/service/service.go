package service

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"time"

	"backend/auth-service/internal/client"
	"backend/auth-service/internal/domain"
	authjwt "backend/auth-service/internal/jwt"
	"backend/auth-service/internal/repository"
	"backend/shared/apperr"
	"backend/shared/password"
	"backend/shared/token"

	"github.com/google/uuid"
	"google.golang.org/api/idtoken"
)

type Service struct {
	repo          repository.Repository
	userClient    client.UserClient
	otpClient     client.OTPClient
	jwtManager    *authjwt.Manager
	google        GoogleVerifier
	refreshExpiry time.Duration
	pendingExpiry time.Duration
}

type GoogleVerifier interface {
	Verify(ctx context.Context, idToken string) (GoogleClaims, error)
}

type GoogleClaims struct {
	Email   string
	Name    string
	Picture string
}

type GoogleIDTokenVerifier struct {
	ClientID string
}

func (v GoogleIDTokenVerifier) Verify(ctx context.Context, raw string) (GoogleClaims, error) {
	if v.ClientID == "" {
		return GoogleClaims{}, fmt.Errorf("GOOGLE_CLIENT_ID is required")
	}
	payload, err := idtoken.Validate(ctx, raw, v.ClientID)
	if err != nil {
		return GoogleClaims{}, err
	}
	claims := GoogleClaims{}
	if email, ok := payload.Claims["email"].(string); ok {
		claims.Email = email
	}
	if name, ok := payload.Claims["name"].(string); ok {
		claims.Name = name
	}
	if picture, ok := payload.Claims["picture"].(string); ok {
		claims.Picture = picture
	}
	if claims.Email == "" {
		return GoogleClaims{}, fmt.Errorf("google token did not include email")
	}
	return claims, nil
}

type LoginResult struct {
	AccessToken           string    `json:"access_token,omitempty"`
	AccessTokenExpiresAt  time.Time `json:"access_token_expires_at,omitempty"`
	TokenType             string    `json:"token_type,omitempty"`
	ExpiresIn             int64     `json:"expires_in,omitempty"`
	TwoFactorRequired     bool      `json:"two_factor_required,omitempty"`
	TwoFactorSessionToken string    `json:"two_factor_session_token,omitempty"`
}

func enrichLoginResult(result LoginResult) LoginResult {
	if result.AccessToken == "" || result.AccessTokenExpiresAt.IsZero() {
		return result
	}
	result.TokenType = "Bearer"
	remaining := time.Until(result.AccessTokenExpiresAt).Seconds()
	if remaining < 0 {
		remaining = 0
	}
	result.ExpiresIn = int64(remaining)
	return result
}

type SessionResult struct {
	AccessToken          string            `json:"access_token"`
	AccessTokenExpiresAt time.Time         `json:"access_token_expires_at"`
	User                 domain.PublicUser `json:"user"`
}

const (
	AuthMethodPassword = "password"
	AuthMethodGoogle   = "google"
	AuthMethodOTP      = "otp"
)

func New(repo repository.Repository, userClient client.UserClient, otpClient client.OTPClient, jwtManager *authjwt.Manager, google GoogleVerifier, refreshExpiry time.Duration, pendingExpiry ...time.Duration) *Service {
	if otpClient == nil {
		otpClient = client.NoopOTPClient{}
	}
	pendingTTL := 5 * time.Minute
	if len(pendingExpiry) > 0 && pendingExpiry[0] > 0 {
		pendingTTL = pendingExpiry[0]
	}
	return &Service{repo: repo, userClient: userClient, otpClient: otpClient, jwtManager: jwtManager, google: google, refreshExpiry: refreshExpiry, pendingExpiry: pendingTTL}
}

type ManualLoginRequest struct {
	Identifier string `json:"identifier"`
	Password   string `json:"password"`
}

func (s *Service) ManualLogin(ctx context.Context, req ManualLoginRequest, deviceInfo string, ip net.IP) (LoginResult, domain.Tokens, error) {
	user, err := s.userClient.LookupCredential(ctx, req.Identifier)
	if err != nil {
		return LoginResult{}, domain.Tokens{}, apperr.InvalidCredentials()
	}
	now := time.Now().UTC()
	if user.IsBanned {
		return LoginResult{}, domain.Tokens{}, apperr.New(http.StatusForbidden, apperr.CodeAccountBanned, "This account is banned.")
	}
	if user.LockedUntil != nil && user.LockedUntil.After(now) {
		return LoginResult{}, domain.Tokens{}, apperr.New(http.StatusForbidden, apperr.CodeAccountLocked, "This account is temporarily locked. Please try again later.")
	}
	if !user.IsVerified {
		return LoginResult{}, domain.Tokens{}, apperr.New(http.StatusForbidden, apperr.CodeAccountNotVerified, "Please verify your account before logging in.")
	}
	if user.AuthProvider == domain.ProviderGoogle && user.PasswordHash == nil {
		return LoginResult{}, domain.Tokens{}, apperr.New(http.StatusConflict, apperr.CodeUseGoogleLogin, "Please sign in with Google.")
	}
	if user.PasswordHash == nil {
		return LoginResult{}, domain.Tokens{}, apperr.InvalidCredentials()
	}
	ok, verifyErr := password.Verify(req.Password, *user.PasswordHash)
	if verifyErr != nil || !ok {
		_ = s.userClient.RecordLoginFailure(ctx, user.ID, user.FailedLoginAttempts)
		s.audit(ctx, "login_failed", user.ID, ip, deviceInfo, map[string]any{"provider": domain.ProviderManual})
		return LoginResult{}, domain.Tokens{}, apperr.InvalidCredentials()
	}
	if user.TwoFactorEnabled {
		sessionToken, _, jti, err := s.jwtManager.IssuePendingTwoFactor(user.ID, "2fa_login", s.pendingExpiry, []string{AuthMethodPassword})
		if err != nil {
			return LoginResult{}, domain.Tokens{}, err
		}
		if err := s.otpClient.SendLogin2FA(ctx, user.ID, jti); err != nil {
			return LoginResult{}, domain.Tokens{}, err
		}
		s.audit(ctx, "2fa_required", user.ID, ip, deviceInfo, map[string]any{"provider": domain.ProviderManual, "jti": jti})
		return LoginResult{TwoFactorRequired: true, TwoFactorSessionToken: sessionToken}, domain.Tokens{}, nil
	}
	tokens, err := s.issueTokenPair(ctx, user, []string{AuthMethodPassword}, deviceInfo, ip)
	if err != nil {
		return LoginResult{}, domain.Tokens{}, err
	}
	_ = s.userClient.RecordLoginSuccess(ctx, user.ID)
	s.audit(ctx, "login_success", user.ID, ip, deviceInfo, map[string]any{"provider": domain.ProviderManual})
	return enrichLoginResult(LoginResult{AccessToken: tokens.AccessToken, AccessTokenExpiresAt: tokens.ExpiresAt}), tokens, nil
}

func (s *Service) GoogleLogin(ctx context.Context, idToken string, deviceInfo string, ip net.IP) (LoginResult, domain.Tokens, error) {
	claims, err := s.google.Verify(ctx, idToken)
	if err != nil {
		return LoginResult{}, domain.Tokens{}, apperr.New(http.StatusUnauthorized, apperr.CodeInvalidGoogleToken, "Google login token is invalid.")
	}
	user, _, err := s.userClient.GetOrCreateGoogle(ctx, claims.Email, claims.Name, claims.Picture)
	if err != nil {
		return LoginResult{}, domain.Tokens{}, err
	}
	if user.IsBanned {
		return LoginResult{}, domain.Tokens{}, apperr.New(http.StatusForbidden, apperr.CodeAccountBanned, "This account is banned.")
	}
	if user.TwoFactorEnabled {
		sessionToken, _, jti, err := s.jwtManager.IssuePendingTwoFactor(user.ID, "2fa_login", s.pendingExpiry, []string{AuthMethodGoogle})
		if err != nil {
			return LoginResult{}, domain.Tokens{}, err
		}
		if err := s.otpClient.SendLogin2FA(ctx, user.ID, jti); err != nil {
			return LoginResult{}, domain.Tokens{}, err
		}
		s.audit(ctx, "2fa_required", user.ID, ip, deviceInfo, map[string]any{"provider": domain.ProviderGoogle, "jti": jti})
		return LoginResult{TwoFactorRequired: true, TwoFactorSessionToken: sessionToken}, domain.Tokens{}, nil
	}
	tokens, err := s.issueTokenPair(ctx, user, []string{AuthMethodGoogle}, deviceInfo, ip)
	if err != nil {
		return LoginResult{}, domain.Tokens{}, err
	}
	_ = s.userClient.RecordLoginSuccess(ctx, user.ID)
	s.audit(ctx, "login_success", user.ID, ip, deviceInfo, map[string]any{"provider": domain.ProviderGoogle})
	return enrichLoginResult(LoginResult{AccessToken: tokens.AccessToken, AccessTokenExpiresAt: tokens.ExpiresAt}), tokens, nil
}

func (s *Service) Refresh(ctx context.Context, rawRefreshToken string, deviceInfo string, ip net.IP) (domain.Tokens, error) {
	tokens, _, err := s.refresh(ctx, rawRefreshToken, deviceInfo, ip)
	return tokens, err
}

func (s *Service) Session(ctx context.Context, rawRefreshToken string, deviceInfo string, ip net.IP) (SessionResult, domain.Tokens, error) {
	tokens, userID, err := s.refresh(ctx, rawRefreshToken, deviceInfo, ip)
	if err != nil {
		return SessionResult{}, domain.Tokens{}, err
	}
	user, err := s.userClient.GetPublicByID(ctx, userID)
	if err != nil {
		return SessionResult{}, domain.Tokens{}, err
	}
	return SessionResult{
		AccessToken:          tokens.AccessToken,
		AccessTokenExpiresAt: tokens.ExpiresAt,
		User:                 user,
	}, tokens, nil
}

func (s *Service) refresh(ctx context.Context, rawRefreshToken string, deviceInfo string, ip net.IP) (domain.Tokens, uuid.UUID, error) {
	if rawRefreshToken == "" {
		return domain.Tokens{}, uuid.Nil, apperr.New(http.StatusUnauthorized, apperr.CodeInvalidRefreshToken, "Refresh token is invalid.")
	}
	newRefresh, err := token.RandomURL(32)
	if err != nil {
		return domain.Tokens{}, uuid.Nil, err
	}
	record, reused, err := s.repo.RotateRefreshToken(ctx, token.SHA256(rawRefreshToken), token.SHA256(newRefresh), deviceInfo, ip, time.Now().UTC().Add(s.refreshExpiry))
	if err != nil {
		if reused {
			s.audit(ctx, "refresh_reuse_detected", record.UserID, ip, deviceInfo, nil)
		}
		return domain.Tokens{}, uuid.Nil, err
	}
	user, err := s.userClient.GetByID(ctx, record.UserID)
	if err != nil {
		return domain.Tokens{}, uuid.Nil, err
	}
	if user.IsBanned {
		_ = s.repo.RevokeAllRefreshTokens(ctx, user.ID)
		return domain.Tokens{}, uuid.Nil, apperr.New(http.StatusForbidden, apperr.CodeAccountBanned, "This account is banned.")
	}
	access, expiresAt, err := s.jwtManager.IssueAccess(user, authjwt.AccessContext{
		AuthTime:    record.AuthTime,
		AuthMethods: record.AuthMethods,
		SessionID:   record.SessionID,
	})
	if err != nil {
		return domain.Tokens{}, uuid.Nil, err
	}
	s.audit(ctx, "refresh_success", user.ID, ip, deviceInfo, nil)
	return domain.Tokens{AccessToken: access, ExpiresAt: expiresAt, RefreshToken: newRefresh}, user.ID, nil
}

func (s *Service) Logout(ctx context.Context, rawRefreshToken string, deviceInfo string, ip net.IP) error {
	if rawRefreshToken == "" {
		s.audit(ctx, "logout", uuid.Nil, ip, deviceInfo, map[string]any{"refresh_cookie_present": false})
		return nil
	}
	err := s.repo.RevokeRefreshToken(ctx, token.SHA256(rawRefreshToken))
	if err == nil {
		s.audit(ctx, "logout", uuid.Nil, ip, deviceInfo, map[string]any{"refresh_cookie_present": true})
	}
	return err
}

func (s *Service) LogoutAll(ctx context.Context, userID uuid.UUID) error {
	err := s.repo.RevokeAllRefreshTokens(ctx, userID)
	if err == nil {
		s.audit(ctx, "logout_all", userID, nil, "", nil)
	}
	return err
}

func (s *Service) IssueTokenPairForUser(ctx context.Context, userID uuid.UUID, authMethods []string, deviceInfo string, ip net.IP) (domain.Tokens, error) {
	user, err := s.userClient.GetByID(ctx, userID)
	if err != nil {
		return domain.Tokens{}, err
	}
	if user.IsBanned {
		return domain.Tokens{}, apperr.New(http.StatusForbidden, apperr.CodeAccountBanned, "This account is banned.")
	}
	tokens, err := s.issueTokenPair(ctx, user, authMethods, deviceInfo, ip)
	if err != nil {
		return domain.Tokens{}, err
	}
	_ = s.userClient.RecordLoginSuccess(ctx, user.ID)
	s.audit(ctx, "login_success", user.ID, ip, deviceInfo, map[string]any{"issued_by": "internal"})
	return tokens, nil
}

func (s *Service) IssuePendingTwoFactor(ctx context.Context, userID uuid.UUID, contextValue string) (string, time.Time, error) {
	if contextValue != "2fa_login" && contextValue != "login" {
		return "", time.Time{}, apperr.New(http.StatusUnprocessableEntity, apperr.CodeValidationError, "Invalid 2FA context.")
	}
	user, err := s.userClient.GetByID(ctx, userID)
	if err != nil {
		return "", time.Time{}, err
	}
	if user.IsBanned {
		return "", time.Time{}, apperr.New(http.StatusForbidden, apperr.CodeAccountBanned, "This account is banned.")
	}
	pending, expiresAt, _, err := s.jwtManager.IssuePendingTwoFactor(userID, "2fa_login", s.pendingExpiry, []string{AuthMethodPassword})
	return pending, expiresAt, err
}

func (s *Service) audit(ctx context.Context, eventType string, userID uuid.UUID, ip net.IP, userAgent string, metadata any) {
	if s.repo == nil {
		return
	}
	_ = s.repo.CreateAuditEvent(ctx, eventType, userID, ip, userAgent, metadata)
}

func (s *Service) Ping(ctx context.Context) error {
	return s.repo.Ping(ctx)
}

func (s *Service) RevokeOtherRefreshTokens(ctx context.Context, userID, sessionID uuid.UUID) error {
	return s.repo.RevokeOtherRefreshTokens(ctx, userID, sessionID)
}

func (s *Service) issueTokenPair(ctx context.Context, user domain.User, authMethods []string, deviceInfo string, ip net.IP) (domain.Tokens, error) {
	refreshToken, err := token.RandomURL(32)
	if err != nil {
		return domain.Tokens{}, err
	}
	now := time.Now().UTC()
	sessionID := uuid.New()
	accessToken, expiresAt, err := s.jwtManager.IssueAccess(user, authjwt.AccessContext{
		AuthTime:    now,
		AuthMethods: authMethods,
		SessionID:   sessionID,
	})
	if err != nil {
		return domain.Tokens{}, err
	}
	if err := s.repo.CreateRefreshToken(ctx, user.ID, token.SHA256(refreshToken), deviceInfo, ip, now.Add(s.refreshExpiry), now, authMethods, sessionID); err != nil {
		return domain.Tokens{}, err
	}
	return domain.Tokens{AccessToken: accessToken, ExpiresAt: expiresAt, RefreshToken: refreshToken}, nil
}
