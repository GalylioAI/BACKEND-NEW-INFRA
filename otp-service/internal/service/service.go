package service

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"fmt"
	"math/big"
	"net/http"
	"os"
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
	defaultOTPTTL            = 10 * time.Minute
	defaultResetTokenTTL     = 15 * time.Minute
	defaultTwoFactorOTPTTL   = 10 * time.Minute
	defaultTwoFactorAttempts = int16(3)
)

type Service struct {
	repo        repository.Repository
	userClient  client.UserClient
	authClient  client.AuthClient
	publisher   rabbit.Publisher
	jwtVerifier *PendingJWTVerifier
	options     Options
}

type PendingJWTVerifier struct {
	publicKey *rsa.PublicKey
	issuer    string
	audience  string
}

type PendingClaims struct {
	Type        string   `json:"typ"`
	Purpose     string   `json:"purpose"`
	AuthMethods []string `json:"amr"`
	jwtlib.RegisteredClaims
}

type AccessClaims struct {
	Type  string `json:"typ"`
	Role  string `json:"role"`
	Email string `json:"email"`
	jwtlib.RegisteredClaims
}

type Options struct {
	EmailVerificationOTPTTL time.Duration
	PasswordResetOTPTTL     time.Duration
	PasswordResetTokenTTL   time.Duration
	TwoFactorLoginOTPTTL    time.Duration
	TwoFactorEnableOTPTTL   time.Duration
	TwoFactorDisableOTPTTL  time.Duration
	TwoFactorMaxAttempts    int16
	OTPResendCooldown       time.Duration
}

func DefaultOptions() Options {
	return Options{
		EmailVerificationOTPTTL: defaultOTPTTL,
		PasswordResetOTPTTL:     defaultOTPTTL,
		PasswordResetTokenTTL:   defaultResetTokenTTL,
		TwoFactorLoginOTPTTL:    defaultTwoFactorOTPTTL,
		TwoFactorEnableOTPTTL:   defaultTwoFactorOTPTTL,
		TwoFactorDisableOTPTTL:  defaultTwoFactorOTPTTL,
		TwoFactorMaxAttempts:    defaultTwoFactorAttempts,
		OTPResendCooldown:       time.Minute,
	}
}

func New(repo repository.Repository, userClient client.UserClient, authClient client.AuthClient, publisher rabbit.Publisher, verifier *PendingJWTVerifier, options ...Options) *Service {
	if publisher == nil {
		publisher = rabbit.NoopPublisher{}
	}
	cfg := DefaultOptions()
	if len(options) > 0 {
		cfg = options[0].withDefaults()
	}
	return &Service{repo: repo, userClient: userClient, authClient: authClient, publisher: publisher, jwtVerifier: verifier, options: cfg}
}

func (o Options) withDefaults() Options {
	defaults := DefaultOptions()
	if o.EmailVerificationOTPTTL <= 0 {
		o.EmailVerificationOTPTTL = defaults.EmailVerificationOTPTTL
	}
	if o.PasswordResetOTPTTL <= 0 {
		o.PasswordResetOTPTTL = defaults.PasswordResetOTPTTL
	}
	if o.PasswordResetTokenTTL <= 0 {
		o.PasswordResetTokenTTL = defaults.PasswordResetTokenTTL
	}
	if o.TwoFactorLoginOTPTTL <= 0 {
		o.TwoFactorLoginOTPTTL = defaults.TwoFactorLoginOTPTTL
	}
	if o.TwoFactorEnableOTPTTL <= 0 {
		o.TwoFactorEnableOTPTTL = defaults.TwoFactorEnableOTPTTL
	}
	if o.TwoFactorDisableOTPTTL <= 0 {
		o.TwoFactorDisableOTPTTL = defaults.TwoFactorDisableOTPTTL
	}
	if o.TwoFactorMaxAttempts <= 0 {
		o.TwoFactorMaxAttempts = defaults.TwoFactorMaxAttempts
	}
	if o.OTPResendCooldown <= 0 {
		o.OTPResendCooldown = defaults.OTPResendCooldown
	}
	return o
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

type VerifiedPendingClaims struct {
	UserID      uuid.UUID
	JTI         string
	AuthMethods []string
}

func (v *PendingJWTVerifier) VerifyLoginPending(raw string) (VerifiedPendingClaims, error) {
	userID, jti, purpose, authMethods, err := v.verifyPending(raw)
	if err != nil || purpose != domain.OTPTypeTwoFactorLogin {
		return VerifiedPendingClaims{}, invalidTwoFactorSession()
	}
	if len(authMethods) == 0 {
		authMethods = []string{"password"}
	}
	return VerifiedPendingClaims{UserID: userID, JTI: jti, AuthMethods: authMethods}, nil
}

func (v *PendingJWTVerifier) verifyPending(raw string) (uuid.UUID, string, string, []string, error) {
	claims := &PendingClaims{}
	parsed, err := jwtlib.ParseWithClaims(raw, claims, func(token *jwtlib.Token) (any, error) {
		return v.publicKey, nil
	}, jwtlib.WithIssuer(v.issuer), jwtlib.WithAudience(v.audience), jwtlib.WithValidMethods([]string{jwtlib.SigningMethodRS256.Alg()}))
	if err != nil || !parsed.Valid || claims.Type != "2fa_pending" || claims.ID == "" {
		return uuid.Nil, "", "", nil, invalidTwoFactorSession()
	}
	userID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return uuid.Nil, "", "", nil, invalidTwoFactorSession()
	}
	return userID, claims.ID, claims.Purpose, claims.AuthMethods, nil
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
		"expires_in_minutes": int(s.options.EmailVerificationOTPTTL.Minutes()),
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

func (s *Service) SendLoginTwoFactor(ctx context.Context, userID uuid.UUID, jti string) error {
	user, err := s.userClient.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if user.IsBanned {
		return apperr.New(http.StatusForbidden, apperr.CodeAccountBanned, "This account is banned.")
	}
	plain, err := s.issueTwoFactorChallenge(ctx, user.ID, jti, domain.OTPTypeTwoFactorLogin, s.options.TwoFactorLoginOTPTTL)
	if err != nil {
		return err
	}
	return s.publishMail(ctx, "mail.send.otp_2fa", user, "otp_2fa", map[string]any{
		"full_name":          user.FullName,
		"otp_code":           plain,
		"expires_in_minutes": int(s.options.TwoFactorLoginOTPTTL.Minutes()),
	})
}

func (s *Service) EnableTwoFactor(ctx context.Context, userID uuid.UUID, currentPassword string) error {
	if err := s.userClient.VerifyPassword(ctx, userID, currentPassword); err != nil {
		return err
	}
	user, err := s.userClient.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if user.IsBanned {
		return apperr.New(http.StatusForbidden, apperr.CodeAccountBanned, "This account is banned.")
	}
	plain, err := s.issueTwoFactorChallenge(ctx, user.ID, uuid.NewString(), domain.OTPTypeTwoFactorEnable, s.options.TwoFactorEnableOTPTTL)
	if err != nil {
		return err
	}
	return s.publishMail(ctx, "mail.send.otp_2fa", user, "otp_2fa", map[string]any{
		"full_name":          user.FullName,
		"otp_code":           plain,
		"expires_in_minutes": int(s.options.TwoFactorEnableOTPTTL.Minutes()),
	})
}

func (s *Service) VerifyLoginTwoFactor(ctx context.Context, code, pendingToken string) (client.TokenPair, error) {
	if s.jwtVerifier == nil {
		return client.TokenPair{}, apperr.New(http.StatusInternalServerError, apperr.CodeInternal, "2FA verifier is not configured.")
	}
	claims, err := s.jwtVerifier.VerifyLoginPending(pendingToken)
	if err != nil {
		return client.TokenPair{}, err
	}
	userID := claims.UserID
	user, err := s.userClient.GetByID(ctx, userID)
	if err != nil {
		return client.TokenPair{}, err
	}
	if user.IsBanned {
		return client.TokenPair{}, apperr.New(http.StatusForbidden, apperr.CodeAccountBanned, "This account is banned.")
	}
	if !user.IsVerified {
		return client.TokenPair{}, apperr.New(http.StatusForbidden, apperr.CodeAccountNotVerified, "Please verify your account before continuing.")
	}
	if err := s.verifyTwoFactorChallenge(ctx, userID, claims.JTI, domain.OTPTypeTwoFactorLogin, code); err != nil {
		return client.TokenPair{}, err
	}
	return s.authClient.IssueJWT(ctx, userID, withOTP(claims.AuthMethods))
}

func (s *Service) VerifyEnableTwoFactor(ctx context.Context, userID uuid.UUID, code string) error {
	if err := s.verifyLatestTwoFactorChallenge(ctx, userID, domain.OTPTypeTwoFactorEnable, code); err != nil {
		return err
	}
	return s.userClient.SetTwoFactor(ctx, userID, true)
}

func (s *Service) StartDisableTwoFactor(ctx context.Context, userID uuid.UUID, currentPassword string) error {
	user, err := s.userClient.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if user.IsBanned {
		return apperr.New(http.StatusForbidden, apperr.CodeAccountBanned, "This account is banned.")
	}
	if user.PasswordHash == nil {
		return apperr.New(http.StatusForbidden, apperr.CodeLocalPasswordRequired, "Set a local password before disabling 2FA.")
	}
	if err := s.userClient.VerifyPassword(ctx, userID, currentPassword); err != nil {
		return err
	}
	plain, err := s.issueTwoFactorChallenge(ctx, userID, uuid.NewString(), domain.OTPTypeTwoFactorDisable, s.options.TwoFactorDisableOTPTTL)
	if err != nil {
		return err
	}
	return s.publishMail(ctx, "mail.send.otp_2fa", user, "otp_2fa", map[string]any{
		"full_name":          user.FullName,
		"otp_code":           plain,
		"expires_in_minutes": int(s.options.TwoFactorDisableOTPTTL.Minutes()),
	})
}

func (s *Service) VerifyDisableTwoFactor(ctx context.Context, userID uuid.UUID, code string) error {
	if err := s.verifyLatestTwoFactorChallenge(ctx, userID, domain.OTPTypeTwoFactorDisable, code); err != nil {
		return err
	}
	return s.userClient.SetTwoFactor(ctx, userID, false)
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
	if user.IsBanned || user.PasswordHash == nil {
		return nil
	}
	plain, err := s.issueOTP(ctx, user.ID, domain.OTPTypePasswordReset)
	if err != nil {
		return err
	}
	return s.publishMail(ctx, "mail.send.password_reset", user, "password_reset", map[string]any{
		"full_name":          user.FullName,
		"otp_code":           plain,
		"expires_in_minutes": int(s.options.PasswordResetOTPTTL.Minutes()),
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
	if _, err := s.repo.CreatePasswordResetToken(ctx, user.ID, token.SHA256(resetToken), time.Now().UTC().Add(s.options.PasswordResetTokenTTL)); err != nil {
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
	user, err := s.userClient.GetByID(ctx, record.UserID)
	if err != nil {
		return err
	}
	if user.IsBanned {
		return apperr.New(http.StatusForbidden, apperr.CodeAccountBanned, "This account is banned.")
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
	if err := s.repo.MarkResetTokenUsed(ctx, record.ID); err != nil {
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
	retryAfter, err := s.repo.CheckAndIncrementRateLimit(ctx, userID, otpType, s.options.OTPResendCooldown)
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
	ttl := s.otpTTL(otpType)
	if _, err := s.repo.CreateOTPCode(ctx, userID, hash, otpType, time.Now().UTC().Add(ttl)); err != nil {
		return "", err
	}
	return plain, nil
}

func (s *Service) otpTTL(otpType string) time.Duration {
	switch otpType {
	case domain.OTPTypeEmailVerify:
		return s.options.EmailVerificationOTPTTL
	case domain.OTPTypePasswordReset:
		return s.options.PasswordResetOTPTTL
	default:
		return defaultOTPTTL
	}
}

func (s *Service) issueTwoFactorChallenge(ctx context.Context, userID uuid.UUID, jti, purpose string, ttl time.Duration) (string, error) {
	retryAfter, err := s.repo.CheckAndIncrementRateLimit(ctx, userID, purpose, s.options.OTPResendCooldown)
	if err != nil {
		return "", err
	}
	if retryAfter > 0 {
		return "", apperr.WithRetryAfter(http.StatusTooManyRequests, apperr.CodeOTPRateLimited, "Too many verification codes requested. Please try again later.", retryAfter)
	}
	if err := s.repo.RevokeTwoFactorChallenges(ctx, userID, purpose); err != nil {
		return "", err
	}
	plain, hash, err := GenerateOTP()
	if err != nil {
		return "", err
	}
	_, err = s.repo.CreateTwoFactorChallenge(ctx, userID, jti, purpose, hash, time.Now().UTC().Add(ttl), s.options.TwoFactorMaxAttempts)
	return plain, err
}

func (s *Service) verifyTwoFactorChallenge(ctx context.Context, userID uuid.UUID, jti, purpose, plain string) error {
	if len(plain) != 6 {
		return apperr.New(http.StatusUnprocessableEntity, apperr.CodeValidationError, "OTP code must be exactly 6 digits.")
	}
	challenge, err := s.repo.GetTwoFactorChallengeByJTI(ctx, userID, jti, purpose)
	if err != nil {
		return err
	}
	return s.verifyChallengeCode(ctx, challenge, plain)
}

func (s *Service) verifyLatestTwoFactorChallenge(ctx context.Context, userID uuid.UUID, purpose, plain string) error {
	if len(plain) != 6 {
		return apperr.New(http.StatusUnprocessableEntity, apperr.CodeValidationError, "OTP code must be exactly 6 digits.")
	}
	challenge, err := s.repo.GetLatestTwoFactorChallenge(ctx, userID, purpose)
	if err != nil {
		return err
	}
	return s.verifyChallengeCode(ctx, challenge, plain)
}

func (s *Service) verifyChallengeCode(ctx context.Context, challenge domain.TwoFactorChallenge, plain string) error {
	challenge, err := s.repo.IncrementTwoFactorChallengeAttempts(ctx, challenge.ID)
	if err != nil {
		return err
	}
	if !VerifyOTP(plain, challenge.OTPHash) {
		if challenge.Attempts >= challenge.MaxAttempts {
			_ = s.repo.ConsumeTwoFactorChallenge(ctx, challenge.ID)
			return apperr.New(http.StatusTooManyRequests, apperr.CodeOTPMaxAttempts, "Maximum verification attempts exceeded.")
		}
		return apperr.New(http.StatusUnauthorized, apperr.CodeOTPInvalid, "Verification code is invalid.")
	}
	return s.repo.ConsumeTwoFactorChallenge(ctx, challenge.ID)
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

func withOTP(methods []string) []string {
	out := make([]string, 0, len(methods)+1)
	seen := map[string]struct{}{}
	for _, method := range methods {
		if method == "" {
			continue
		}
		if _, ok := seen[method]; ok {
			continue
		}
		seen[method] = struct{}{}
		out = append(out, method)
	}
	if _, ok := seen["otp"]; !ok {
		out = append(out, "otp")
	}
	if len(out) == 1 {
		return []string{"password", "otp"}
	}
	return out
}
