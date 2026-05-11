package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"backend/shared/apperr"
	"backend/shared/middleware"
	"backend/shared/password"
	"backend/shared/validate"
	"backend/user-service/internal/domain"
	"backend/user-service/internal/repository"

	"github.com/google/uuid"
)

type Service struct {
	repo            repository.Repository
	authClient      AuthClient
	validator       *validate.Validator
	lockoutFailures int16
	lockoutWindow   time.Duration
}

type AuthClient interface {
	RevokeAllRefreshTokens(ctx context.Context, userID uuid.UUID) error
}

type HTTPAuthClient struct {
	baseURL string
	secret  string
	client  *http.Client
}

func NewHTTPAuthClient(baseURL, secret string) *HTTPAuthClient {
	return &HTTPAuthClient{baseURL: strings.TrimRight(baseURL, "/"), secret: secret, client: &http.Client{Timeout: 5 * time.Second}}
}

func (c *HTTPAuthClient) RevokeAllRefreshTokens(ctx context.Context, userID uuid.UUID) error {
	if c.baseURL == "" {
		return nil
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, c.baseURL+"/internal/auth/sessions/"+userID.String(), nil)
	if err != nil {
		return err
	}
	req.Header.Set(middleware.HeaderInternalSecret, c.secret)
	resp, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		body, _ := json.Marshal(map[string]string{"user_id": userID.String()})
		req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/internal/auth/revoke-all", bytes.NewReader(body))
		if err != nil {
			return err
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set(middleware.HeaderInternalSecret, c.secret)
		resp, err := c.client.Do(req)
		if err != nil {
			return err
		}
		defer resp.Body.Close()
		if resp.StatusCode >= 300 {
			return fmt.Errorf("auth service revoke-all failed with status %d", resp.StatusCode)
		}
	}
	return nil
}

func New(repo repository.Repository, authClient AuthClient) *Service {
	return &Service{
		repo:            repo,
		authClient:      authClient,
		validator:       validate.New(),
		lockoutFailures: 5,
		lockoutWindow:   15 * time.Minute,
	}
}

type SignupRequest struct {
	FullName      string `json:"full_name" validate:"required,min=2,max=150"`
	Username      string `json:"username" validate:"required,min=3,max=50"`
	Email         string `json:"email" validate:"required,email,max=255"`
	Phone         string `json:"phone" validate:"required,max=20"`
	Password      string `json:"password" validate:"required,min=8,max=128"`
	GouvernoratID int16  `json:"gouvernorat_id"`
}

type UpdateProfileRequest struct {
	FullName      *string `json:"full_name" validate:"omitempty,min=2,max=150"`
	Username      *string `json:"username" validate:"omitempty,min=3,max=50"`
	Phone         *string `json:"phone" validate:"omitempty,max=20"`
	GouvernoratID *int16  `json:"gouvernorat_id" validate:"omitempty,min=1,max=24"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required,max=128"`
	NewPassword     string `json:"new_password" validate:"required,min=8,max=128"`
}

func (s *Service) Signup(ctx context.Context, req SignupRequest) (domain.PublicUser, error) {
	fullName := strings.TrimSpace(req.FullName)
	username := validate.NormalizeUsername(req.Username)
	email := validate.NormalizeEmail(req.Email)
	phone := validate.NormalizePhone(req.Phone)
	fields := apperr.FieldErrors{}
	if len(fullName) < 2 || len(fullName) > 150 {
		fields["full_name"] = "Full name must be between 2 and 150 characters."
	}
	if len(username) < 3 || len(username) > 50 {
		fields["username"] = "Username must be between 3 and 50 characters."
	}
	if !validate.ValidEmail(email) {
		fields["email"] = "Email address is invalid."
	}
	if phone != "" && !validate.ValidTunisianPhone(phone) {
		fields["phone"] = "Phone number must be a valid Tunisian number."
	}
	if len(req.Password) > 128 || !validate.StrongPassword(req.Password) {
		fields["password"] = "Password must be at least 8 characters and include uppercase, number, and special character."
	}
	if req.GouvernoratID < 1 || req.GouvernoratID > 24 {
		fields["gouvernorat_id"] = "Gouvernorat is invalid."
	}
	if len(fields) > 0 {
		return domain.PublicUser{}, apperr.Validation(fields)
	}
	if exists, err := s.repo.ExistsEmail(ctx, email); err != nil {
		return domain.PublicUser{}, err
	} else if exists {
		fields["email"] = "Email address is already in use."
	}
	if exists, err := s.repo.ExistsUsername(ctx, username); err != nil {
		return domain.PublicUser{}, err
	} else if exists {
		fields["username"] = "Username is already in use."
	}
	if phone != "" {
		if exists, err := s.repo.ExistsPhone(ctx, phone); err != nil {
			return domain.PublicUser{}, err
		} else if exists {
			fields["phone"] = "Phone number is already in use."
		}
	}
	if len(fields) > 0 {
		return domain.PublicUser{}, apperr.WithFields(http.StatusConflict, apperr.CodeConflict, "One or more fields are already in use.", fields)
	}
	hash, err := password.Hash(req.Password)
	if err != nil {
		return domain.PublicUser{}, err
	}
	govID := req.GouvernoratID
	var phonePtr *string
	if phone != "" {
		phonePtr = &phone
	}
	user, err := s.repo.CreateUserWithOutbox(ctx, repository.CreateUserParams{
		FullName:      fullName,
		Username:      username,
		Email:         email,
		Phone:         phonePtr,
		PasswordHash:  &hash,
		GouvernoratID: &govID,
		AuthProvider:  domain.ProviderManual,
		IsVerified:    false,
	}, "user.created", map[string]any{"user_id": "", "email": email, "full_name": fullName})
	if err != nil {
		return domain.PublicUser{}, err
	}
	return domain.Public(user), nil
}

func (s *Service) GetProfile(ctx context.Context, id uuid.UUID) (domain.PublicUser, error) {
	user, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return domain.PublicUser{}, err
	}
	return domain.Public(user), nil
}

func (s *Service) UpdateProfile(ctx context.Context, id uuid.UUID, req UpdateProfileRequest) (domain.PublicUser, error) {
	current, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return domain.PublicUser{}, err
	}
	fields := apperr.FieldErrors{}
	var fullName *string
	if req.FullName != nil {
		value := strings.TrimSpace(*req.FullName)
		if len(value) < 2 || len(value) > 150 {
			fields["full_name"] = "Full name must be between 2 and 150 characters."
		} else {
			fullName = &value
		}
	}

	var username *string
	if req.Username != nil {
		value := validate.NormalizeUsername(*req.Username)
		if len(value) < 3 || len(value) > 50 {
			fields["username"] = "Username must be between 3 and 50 characters."
		} else if value != current.Username {
			if exists, err := s.repo.ExistsUsername(ctx, value); err != nil {
				return domain.PublicUser{}, err
			} else if exists {
				fields["username"] = "Username is already in use."
			} else {
				username = &value
			}
		} else {
			username = &value
		}
	}

	var phonePtr *string
	if req.Phone != nil {
		value := validate.NormalizePhone(*req.Phone)
		if value != "" && !validate.ValidTunisianPhone(value) {
			fields["phone"] = "Phone number must be a valid Tunisian number."
		} else if value != "" {
			if exists, err := s.repo.ExistsPhone(ctx, value); err != nil {
				return domain.PublicUser{}, err
			} else if exists && (current.Phone == nil || *current.Phone != value) {
				fields["phone"] = "Phone number is already in use."
			} else {
				phonePtr = &value
			}
		}
	}

	var govID *int16
	if req.GouvernoratID != nil {
		if *req.GouvernoratID < 1 || *req.GouvernoratID > 24 {
			fields["gouvernorat_id"] = "Gouvernorat is invalid."
		} else {
			value := *req.GouvernoratID
			govID = &value
		}
	}
	if len(fields) > 0 {
		return domain.PublicUser{}, apperr.Validation(fields)
	}
	if fullName == nil && username == nil && phonePtr == nil && govID == nil {
		return domain.Public(current), nil
	}
	user, err := s.repo.UpdateProfile(ctx, repository.UpdateProfileParams{ID: id, FullName: fullName, Username: username, Phone: phonePtr, GouvernoratID: govID})
	if err != nil {
		return domain.PublicUser{}, err
	}
	return domain.Public(user), nil
}

func (s *Service) ChangePassword(ctx context.Context, id uuid.UUID, req ChangePasswordRequest) error {
	user, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if user.AuthProvider != domain.ProviderManual || user.PasswordHash == nil {
		return apperr.New(http.StatusForbidden, apperr.CodeInvalidProvider, "Password changes are only available for manual accounts.")
	}
	ok, err := password.Verify(req.CurrentPassword, *user.PasswordHash)
	if err != nil || !ok {
		return apperr.New(http.StatusUnauthorized, apperr.CodeInvalidCurrentPass, "Current password is incorrect.")
	}
	if len(req.CurrentPassword) > 128 || len(req.NewPassword) > 128 || !validate.StrongPassword(req.NewPassword) {
		return apperr.New(http.StatusUnprocessableEntity, apperr.CodeWeakPassword, "New password does not meet strength requirements.")
	}
	same, err := password.Verify(req.NewPassword, *user.PasswordHash)
	if err == nil && same {
		return apperr.New(http.StatusConflict, apperr.CodePasswordReuse, "New password must be different from the current password.")
	}
	hash, err := password.Hash(req.NewPassword)
	if err != nil {
		return err
	}
	if err := s.repo.UpdatePasswordWithOutbox(ctx, id, hash, map[string]any{"user_id": id.String(), "email": user.Email, "full_name": user.FullName}); err != nil {
		return err
	}
	return s.authClient.RevokeAllRefreshTokens(ctx, id)
}

func (s *Service) SoftDelete(ctx context.Context, id uuid.UUID) error {
	if err := s.repo.SoftDelete(ctx, id); err != nil {
		return err
	}
	return s.authClient.RevokeAllRefreshTokens(ctx, id)
}

func (s *Service) SoftDeleteManagedUser(ctx context.Context, id uuid.UUID) error {
	user, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if user.Role == domain.RoleSuperAdmin {
		return apperr.New(http.StatusForbidden, apperr.CodeForbidden, "Superadmin accounts cannot be deleted via API.")
	}
	return s.SoftDelete(ctx, id)
}

func (s *Service) ListUsers(ctx context.Context, page, perPage int) ([]domain.PublicUser, map[string]int, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 20
	}
	if perPage > 100 {
		perPage = 100
	}
	users, total, err := s.repo.List(ctx, page, perPage)
	if err != nil {
		return nil, nil, err
	}
	items := make([]domain.PublicUser, 0, len(users))
	for _, user := range users {
		items = append(items, domain.Public(user))
	}
	totalPages := int((total + int64(perPage) - 1) / int64(perPage))
	return items, map[string]int{"total": int(total), "page": page, "per_page": perPage, "total_pages": totalPages}, nil
}

func (s *Service) GetAny(ctx context.Context, id uuid.UUID) (domain.PublicUser, error) {
	user, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return domain.PublicUser{}, err
	}
	return domain.Public(user), nil
}

func (s *Service) ChangeRole(ctx context.Context, id uuid.UUID, role string) (domain.PublicUser, error) {
	if role != domain.RoleUser && role != domain.RoleAdmin {
		return domain.PublicUser{}, apperr.New(http.StatusUnprocessableEntity, apperr.CodeInvalidRole, "Role must be user or admin.")
	}
	current, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return domain.PublicUser{}, err
	}
	if current.Role == domain.RoleSuperAdmin {
		return domain.PublicUser{}, apperr.New(http.StatusForbidden, apperr.CodeForbidden, "Superadmin role cannot be changed via API.")
	}
	user, err := s.repo.ChangeRole(ctx, id, role)
	if err != nil {
		return domain.PublicUser{}, err
	}
	return domain.Public(user), nil
}

func (s *Service) SetBan(ctx context.Context, id uuid.UUID, banned bool, reason *string) (domain.PublicUser, error) {
	current, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return domain.PublicUser{}, err
	}
	if current.Role == domain.RoleSuperAdmin && banned {
		return domain.PublicUser{}, apperr.New(http.StatusForbidden, apperr.CodeForbidden, "Superadmin accounts cannot be banned via API.")
	}
	if reason != nil {
		trimmed := strings.TrimSpace(*reason)
		reason = &trimmed
	}
	user, err := s.repo.SetBan(ctx, id, banned, reason)
	if err != nil {
		return domain.PublicUser{}, err
	}
	if banned {
		_ = s.authClient.RevokeAllRefreshTokens(ctx, id)
	}
	return domain.Public(user), nil
}

func (s *Service) CredentialByIdentifier(ctx context.Context, identifier string) (domain.CredentialUser, error) {
	normalized := validate.NormalizeEmail(identifier)
	if !strings.Contains(normalized, "@") {
		normalized = validate.NormalizeUsername(identifier)
	}
	user, err := s.repo.GetByIdentifier(ctx, normalized)
	if err != nil {
		return domain.CredentialUser{}, err
	}
	return domain.Credential(user), nil
}

func (s *Service) CredentialByID(ctx context.Context, id uuid.UUID) (domain.CredentialUser, error) {
	user, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return domain.CredentialUser{}, err
	}
	return domain.Credential(user), nil
}

func (s *Service) UserByEmail(ctx context.Context, email string) (domain.CredentialUser, error) {
	user, err := s.repo.GetByEmail(ctx, validate.NormalizeEmail(email))
	if err != nil {
		return domain.CredentialUser{}, err
	}
	return domain.Credential(user), nil
}

func (s *Service) MarkVerified(ctx context.Context, id uuid.UUID) (domain.PublicUser, error) {
	user, err := s.repo.MarkVerified(ctx, id)
	if err != nil {
		return domain.PublicUser{}, err
	}
	return domain.Public(user), nil
}

func (s *Service) SetTwoFactor(ctx context.Context, id uuid.UUID, enabled bool) (domain.PublicUser, error) {
	user, err := s.repo.SetTwoFactor(ctx, id, enabled)
	if err != nil {
		return domain.PublicUser{}, err
	}
	return domain.Public(user), nil
}

func (s *Service) UpdatePasswordHash(ctx context.Context, id uuid.UUID, passwordHash string) error {
	if strings.TrimSpace(passwordHash) == "" {
		return apperr.New(http.StatusUnprocessableEntity, apperr.CodeValidationError, "Password hash is required.")
	}
	return s.repo.UpdatePasswordHash(ctx, id, passwordHash)
}

func (s *Service) VerifyPassword(ctx context.Context, id uuid.UUID, plain string) error {
	user, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if user.AuthProvider != domain.ProviderManual || user.PasswordHash == nil {
		return apperr.New(http.StatusForbidden, apperr.CodeInvalidProvider, "Password verification is only available for manual accounts.")
	}
	ok, err := password.Verify(plain, *user.PasswordHash)
	if err != nil || !ok {
		return apperr.New(http.StatusUnauthorized, apperr.CodeInvalidCurrentPass, "Current password is incorrect.")
	}
	return nil
}

func (s *Service) Ping(ctx context.Context) error {
	return s.repo.Ping(ctx)
}

func (s *Service) RecordLoginFailure(ctx context.Context, id uuid.UUID, currentFailures int16) error {
	var lockedUntil *time.Time
	if currentFailures+1 >= s.lockoutFailures {
		value := time.Now().UTC().Add(s.lockoutWindow)
		lockedUntil = &value
	}
	return s.repo.RecordLoginFailure(ctx, id, lockedUntil)
}

func (s *Service) RecordLoginSuccess(ctx context.Context, id uuid.UUID) error {
	return s.repo.RecordLoginSuccess(ctx, id)
}

type GoogleUserRequest struct {
	Email    string `json:"email"`
	FullName string `json:"full_name"`
	Picture  string `json:"picture"`
}

func (s *Service) GetOrCreateGoogleUser(ctx context.Context, req GoogleUserRequest) (domain.CredentialUser, bool, error) {
	email := validate.NormalizeEmail(req.Email)
	if !validate.ValidEmail(email) {
		return domain.CredentialUser{}, false, apperr.New(http.StatusUnprocessableEntity, apperr.CodeValidationError, "Google account email is invalid.")
	}
	existing, err := s.repo.GetByEmail(ctx, email)
	if err == nil {
		if existing.AuthProvider == domain.ProviderManual {
			return domain.CredentialUser{}, false, apperr.New(http.StatusConflict, apperr.CodeEmailRegistered, "Email address is already registered with password login.")
		}
		return domain.Credential(existing), false, nil
	}
	if apperr.From(err).Status != http.StatusNotFound {
		return domain.CredentialUser{}, false, err
	}
	username := googleUsername(email)
	for i := 0; i < 5; i++ {
		candidate := username
		if i > 0 {
			candidate = fmt.Sprintf("%s%d", username, time.Now().UnixNano()%100000)
		}
		exists, err := s.repo.ExistsUsername(ctx, candidate)
		if err != nil {
			return domain.CredentialUser{}, false, err
		}
		if exists {
			continue
		}
		fullName := strings.TrimSpace(req.FullName)
		if fullName == "" {
			fullName = email
		}
		user, err := s.repo.CreateUserWithOutbox(ctx, repository.CreateUserParams{
			FullName:     fullName,
			Username:     candidate,
			Email:        email,
			AuthProvider: domain.ProviderGoogle,
			IsVerified:   true,
		}, "user.created", map[string]any{"email": email, "full_name": fullName})
		if err != nil {
			return domain.CredentialUser{}, false, err
		}
		return domain.Credential(user), true, nil
	}
	return domain.CredentialUser{}, false, apperr.New(http.StatusConflict, apperr.CodeConflict, "Could not create a unique username.")
}

func (s *Service) ListGouvernorats(ctx context.Context) ([]domain.Gouvernorat, error) {
	return s.repo.ListGouvernorats(ctx)
}

func googleUsername(email string) string {
	local := strings.Split(email, "@")[0]
	local = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '_' {
			return r
		}
		return '_'
	}, strings.ToLower(local))
	if len(local) < 3 {
		return "user_" + url.QueryEscape(local)
	}
	if len(local) > 40 {
		return local[:40]
	}
	return local
}
