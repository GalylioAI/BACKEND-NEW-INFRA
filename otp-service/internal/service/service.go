package service

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"strings"
	"time"

	"backend/otp-service/internal/client"
	"backend/otp-service/internal/domain"
	"backend/otp-service/internal/repository"
	"backend/shared/apperr"
	"backend/shared/password"
	"backend/shared/rabbit"
	"backend/shared/token"
	"backend/shared/validate"

	jwtlib "github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

const (
	otpTTL        = 10 * time.Minute
	resetTokenTTL = 15 * time.Minute
)

type Service struct {
	repo        repository.Repository
	userClient  client.UserClient
	authClient  client.AuthClient
	publisher   rabbit.Publisher
	jwtVerifier *PendingJWTVerifier
}

type PendingJWTVerifier struct {
	publicKey *rsa.PublicKey
	issuer    string
	audience  string
}

type PendingClaims struct {
	Type    string `json:"typ"`
	Context string `json:"context"`
	jwtlib.RegisteredClaims
}

type AccessClaims struct {
	Role  string `json:"role"`
	Email string `json:"email"`
	jwtlib.RegisteredClaims
}

func New(repo repository.Repository, userClient client.UserClient, authClient client.AuthClient, publisher rabbit.Publisher, verifier *PendingJWTVerifier) *Service {
	if publisher == nil {
		publisher = rabbit.NoopPublisher{}
	}
	return &Service{repo: repo, userClient: userClient, authClient: authClient, publisher: publisher, jwtVerifier: verifier}
}

func NewPendingJWTVerifier(publicKeyPath, issuer, audience string) (*PendingJWTVerifier, error) {
	publicPEM, err := os.ReadFile(publicKeyPath)
	if err != nil {
		return nil, err
	}
	publicKey, err := jwtlib.ParseRSAPublicKeyFromPEM(publicPEM)
	if err != nil {
		return nil, err
	}
	return &PendingJWTVerifier{publicKey: publicKey, issuer: issuer, audience: audience}, nil
}

func (v *PendingJWTVerifier) Verify(raw string) (uuid.UUID, string, error) {
	if userID, contextValue, err := v.verifyPending(raw); err == nil {
		return userID, contextValue, nil
	}
	if userID, err := v.verifyAccess(raw); err == nil {
		return userID, "2fa_enable", nil
	}
	return uuid.Nil, "", invalidTwoFactorSession()
}

func (v *PendingJWTVerifier) verifyPending(raw string) (uuid.UUID, string, error) {
	claims := &PendingClaims{}
	parsed, err := jwtlib.ParseWithClaims(raw, claims, func(token *jwtlib.Token) (any, error) {
		return v.publicKey, nil
	}, jwtlib.WithIssuer(v.issuer), jwtlib.WithAudience(v.audience), jwtlib.WithValidMethods([]string{jwtlib.SigningMethodRS256.Alg()}))
	if err != nil || !parsed.Valid || claims.Type != "2fa_pending" {
		return uuid.Nil, "", invalidTwoFactorSession()
	}
	userID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return uuid.Nil, "", invalidTwoFactorSession()
	}
	return userID, claims.Context, nil
}

func (v *PendingJWTVerifier) verifyAccess(raw string) (uuid.UUID, error) {
	claims := &AccessClaims{}
	parsed, err := jwtlib.ParseWithClaims(raw, claims, func(token *jwtlib.Token) (any, error) {
		return v.publicKey, nil
	}, jwtlib.WithIssuer(v.issuer), jwtlib.WithAudience(v.audience), jwtlib.WithValidMethods([]string{jwtlib.SigningMethodRS256.Alg()}))
	if err != nil || !parsed.Valid || claims.Role == "" || claims.Email == "" {
		return uuid.Nil, invalidTwoFactorSession()
	}
	userID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return uuid.Nil, invalidTwoFactorSession()
	}
	return userID, nil
}

func invalidTwoFactorSession() error {
	return apperr.New(http.StatusUnauthorized, apperr.CodeInvalidTwoFASession, "2FA session token is invalid.")
}

func GenerateOTP() (plain string, hash string, err error) {
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", "", err
	}
	plain = fmt.Sprintf("%06d", n.Int64())
	hashed, err := bcrypt.GenerateFromPassword([]byte(plain), 10)
	return plain, string(hashed), err
}

func VerifyOTP(plain, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain)) == nil
}

func (s *Service) SendEmailVerification(ctx context.Context, userID uuid.UUID) error {
	user, err := s.userClient.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	return s.sendEmailVerificationForUser(ctx, user)
}

func (s *Service) SendEmailVerificationByEmail(ctx context.Context, email string) error {
	normalized := validate.NormalizeEmail(email)
	if !validate.ValidEmail(normalized) {
		return apperr.Validation(apperr.FieldErrors{"email": "Must be a valid email address."})
	}
	user, err := s.userClient.GetByEmail(ctx, normalized)
	if err != nil {
		return nil
	}
	if user.IsBanned {
		return nil
	}
	return s.sendEmailVerificationForUser(ctx, user)
}

func (s *Service) sendEmailVerificationForUser(ctx context.Context, user domain.User) error {
	if user.IsVerified {
		return nil
	}
	plain, err := s.issueOTP(ctx, user.ID, domain.OTPTypeEmailVerify)
	if err != nil {
		return err
	}
	return s.publishMail(ctx, "mail.send.email_verify", user, "email_verify", map[string]any{
		"full_name":          user.FullName,
		"otp_code":           plain,
		"expires_in_minutes": 10,
	})
}

func (s *Service) VerifyEmail(ctx context.Context, userID uuid.UUID, code string) error {
	if err := s.verifyOTP(ctx, userID, domain.OTPTypeEmailVerify, code); err != nil {
		return err
	}
	if err := s.userClient.MarkVerified(ctx, userID); err != nil {
		return err
	}
	user, err := s.userClient.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	return s.publishMail(ctx, "mail.send.welcome", user, "welcome", map[string]any{"full_name": user.FullName})
}

func (s *Service) VerifyEmailByEmail(ctx context.Context, email, code string) error {
	normalized := validate.NormalizeEmail(email)
	if !validate.ValidEmail(normalized) {
		return apperr.Validation(apperr.FieldErrors{"email": "Must be a valid email address."})
	}
	user, err := s.userClient.GetByEmail(ctx, normalized)
	if err != nil {
		return apperr.New(http.StatusUnauthorized, apperr.CodeOTPInvalid, "Verification code is invalid.")
	}
	if user.IsBanned {
		return apperr.New(http.StatusForbidden, apperr.CodeAccountBanned, "This account is banned.")
	}
	return s.VerifyEmail(ctx, user.ID, code)
}

func (s *Service) SendLoginTwoFactor(ctx context.Context, userID uuid.UUID) error {
	user, err := s.userClient.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if user.IsBanned {
		return apperr.New(http.StatusForbidden, apperr.CodeAccountBanned, "This account is banned.")
	}
	plain, err := s.issueOTP(ctx, user.ID, domain.OTPTypeTwoFactor)
	if err != nil {
		return err
	}
	return s.publishMail(ctx, "mail.send.otp_2fa", user, "otp_2fa", map[string]any{
		"full_name":          user.FullName,
		"otp_code":           plain,
		"expires_in_minutes": 10,
	})
}

func (s *Service) EnableTwoFactor(ctx context.Context, userID uuid.UUID, currentPassword string) (string, error) {
	if err := s.userClient.VerifyPassword(ctx, userID, currentPassword); err != nil {
		return "", err
	}
	if err := s.SendLoginTwoFactor(ctx, userID); err != nil {
		return "", err
	}
	pending, err := s.authClient.IssuePendingTwoFactor(ctx, userID, "2fa_enable")
	if err != nil {
		return "", err
	}
	return pending.SessionToken, nil
}

func (s *Service) VerifyTwoFactor(ctx context.Context, code, sessionToken string) (client.TokenPair, string, error) {
	if s.jwtVerifier == nil {
		return client.TokenPair{}, "", apperr.New(http.StatusInternalServerError, apperr.CodeInternal, "2FA verifier is not configured.")
	}
	userID, contextValue, err := s.jwtVerifier.Verify(sessionToken)
	if err != nil {
		return client.TokenPair{}, "", err
	}
	user, err := s.userClient.GetByID(ctx, userID)
	if err != nil {
		return client.TokenPair{}, "", err
	}
	if user.IsBanned {
		return client.TokenPair{}, "", apperr.New(http.StatusForbidden, apperr.CodeAccountBanned, "This account is banned.")
	}
	if !user.IsVerified {
		return client.TokenPair{}, "", apperr.New(http.StatusForbidden, apperr.CodeAccountNotVerified, "Please verify your account before continuing.")
	}
	if err := s.verifyOTP(ctx, userID, domain.OTPTypeTwoFactor, code); err != nil {
		return client.TokenPair{}, "", err
	}
	switch contextValue {
	case "login":
		tokens, err := s.authClient.IssueJWT(ctx, userID)
		return tokens, "", err
	case "2fa_enable":
		if err := s.userClient.SetTwoFactor(ctx, userID, true); err != nil {
			return client.TokenPair{}, "", err
		}
		return client.TokenPair{}, "2FA enabled successfully", nil
	default:
		return client.TokenPair{}, "", invalidTwoFactorSession()
	}
}

func (s *Service) DisableTwoFactor(ctx context.Context, userID uuid.UUID, code string) (string, error) {
	if strings.TrimSpace(code) == "" {
		if err := s.SendLoginTwoFactor(ctx, userID); err != nil {
			return "", err
		}
		return "Enter the code sent to your email to confirm 2FA disable", nil
	}
	if err := s.verifyOTP(ctx, userID, domain.OTPTypeTwoFactor, code); err != nil {
		return "", err
	}
	if err := s.userClient.SetTwoFactor(ctx, userID, false); err != nil {
		return "", err
	}
	return "2FA disabled successfully", nil
}

func (s *Service) SendPasswordReset(ctx context.Context, email string) error {
	normalized := validate.NormalizeEmail(email)
	if !validate.ValidEmail(normalized) {
		return apperr.Validation(apperr.FieldErrors{"email": "Must be a valid email address."})
	}
	user, err := s.userClient.GetByEmail(ctx, normalized)
	if err != nil {
		return nil
	}
	if user.IsBanned || user.AuthProvider != domain.ProviderManual {
		return nil
	}
	plain, err := s.issueOTP(ctx, user.ID, domain.OTPTypePasswordReset)
	if err != nil {
		return err
	}
	return s.publishMail(ctx, "mail.send.password_reset", user, "password_reset", map[string]any{
		"full_name":          user.FullName,
		"otp_code":           plain,
		"expires_in_minutes": 10,
	})
}

func (s *Service) VerifyPasswordReset(ctx context.Context, email, code string) (string, error) {
	user, err := s.userClient.GetByEmail(ctx, validate.NormalizeEmail(email))
	if err != nil {
		return "", apperr.New(http.StatusUnauthorized, apperr.CodeOTPInvalid, "Verification code is invalid.")
	}
	if err := s.verifyOTP(ctx, user.ID, domain.OTPTypePasswordReset, code); err != nil {
		return "", err
	}
	resetToken, err := token.RandomURL(32)
	if err != nil {
		return "", err
	}
	if err := s.repo.InvalidateResetTokens(ctx, user.ID); err != nil {
		return "", err
	}
	if _, err := s.repo.CreatePasswordResetToken(ctx, user.ID, token.SHA256(resetToken), time.Now().UTC().Add(resetTokenTTL)); err != nil {
		return "", err
	}
	return resetToken, nil
}

func (s *Service) ApplyPasswordReset(ctx context.Context, resetToken, newPassword, confirm string) error {
	fields := apperr.FieldErrors{}
	if resetToken == "" {
		fields["reset_token"] = "This field is required."
	}
	if newPassword != confirm {
		fields["new_password_confirm"] = "Passwords must match."
	}
	if !validate.StrongPassword(newPassword) {
		fields["new_password"] = "Password must be at least 8 characters and include uppercase, number, and special character."
	}
	if len(fields) > 0 {
		return apperr.Validation(fields)
	}
	record, err := s.repo.GetPasswordResetToken(ctx, token.SHA256(resetToken))
	if err != nil {
		return err
	}
	if err := s.repo.MarkResetTokenUsed(ctx, record.ID); err != nil {
		return err
	}
	user, err := s.userClient.GetByID(ctx, record.UserID)
	if err != nil {
		return err
	}
	hash, err := password.Hash(newPassword)
	if err != nil {
		return err
	}
	if err := s.userClient.UpdatePasswordHash(ctx, record.UserID, hash); err != nil {
		return err
	}
	if err := s.authClient.RevokeSessions(ctx, record.UserID); err != nil {
		return err
	}
	return s.publishMail(ctx, "mail.send.password_changed", user, "password_changed", map[string]any{
		"full_name":  user.FullName,
		"changed_at": time.Now().UTC().Format(time.RFC3339),
	})
}

func (s *Service) AutoSendEmailVerification(ctx context.Context, userID uuid.UUID) error {
	return s.SendEmailVerification(ctx, userID)
}

func (s *Service) Ping(ctx context.Context) error {
	return s.repo.Ping(ctx)
}

func (s *Service) issueOTP(ctx context.Context, userID uuid.UUID, otpType string) (string, error) {
	retryAfter, err := s.repo.CheckAndIncrementRateLimit(ctx, userID, otpType)
	if err != nil {
		return "", err
	}
	if retryAfter > 0 {
		return "", apperr.WithRetryAfter(http.StatusTooManyRequests, apperr.CodeOTPRateLimited, "Too many verification codes requested. Please try again later.", retryAfter)
	}
	if err := s.repo.InvalidateOTPCodes(ctx, userID, otpType); err != nil {
		return "", err
	}
	plain, hash, err := GenerateOTP()
	if err != nil {
		return "", err
	}
	if _, err := s.repo.CreateOTPCode(ctx, userID, hash, otpType, time.Now().UTC().Add(otpTTL)); err != nil {
		return "", err
	}
	return plain, nil
}

func (s *Service) verifyOTP(ctx context.Context, userID uuid.UUID, otpType, plain string) error {
	if len(plain) != 6 {
		return apperr.New(http.StatusUnprocessableEntity, apperr.CodeValidationError, "OTP code must be exactly 6 digits.")
	}
	stored, err := s.repo.GetActiveOTPCode(ctx, userID, otpType)
	if err != nil {
		return err
	}
	stored, err = s.repo.IncrementOTPAttempts(ctx, stored.ID)
	if err != nil {
		return err
	}
	if !VerifyOTP(plain, stored.CodeHash) {
		if stored.Attempts >= stored.MaxAttempts {
			_ = s.repo.MarkOTPUsed(ctx, stored.ID)
			return apperr.New(http.StatusTooManyRequests, apperr.CodeOTPMaxAttempts, "Maximum verification attempts exceeded.")
		}
		return apperr.New(http.StatusUnauthorized, apperr.CodeOTPInvalid, "Verification code is invalid.")
	}
	return s.repo.MarkOTPUsed(ctx, stored.ID)
}

func (s *Service) publishMail(ctx context.Context, routingKey string, user domain.User, template string, data map[string]any) error {
	return s.publisher.Publish(ctx, routingKey, map[string]any{
		"to":       user.Email,
		"template": template,
		"locale":   "en",
		"data":     data,
	})
}
