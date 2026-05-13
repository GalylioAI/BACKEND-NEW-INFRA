package service_test

import (
	"context"
	"testing"
	"time"

	"backend/shared/apperr"
	"backend/shared/password"
	"backend/user-service/internal/domain"
	"backend/user-service/internal/repository"
	"backend/user-service/internal/service"

	"github.com/google/uuid"
)

func TestSignupValidatesAndNormalizesUser(t *testing.T) {
	repo := &fakeUserRepo{}
	svc := service.New(repo, &fakeAuthClient{})
	user, err := svc.Signup(context.Background(), service.SignupRequest{
		FullName:      "Jane Doe",
		Username:      "JaneD",
		Email:         "JANE@example.COM",
		Phone:         "12 345 678",
		Password:      "Strong$123",
		GouvernoratID: 1,
	})
	if err != nil {
		t.Fatalf("Signup returned error: %v", err)
	}
	if user.Email != "jane@example.com" {
		t.Fatalf("email not normalized: %s", user.Email)
	}
	if repo.created.Username != "janed" {
		t.Fatalf("username not normalized: %s", repo.created.Username)
	}
	if repo.created.Phone == nil || *repo.created.Phone != "+21612345678" {
		t.Fatalf("phone not normalized: %#v", repo.created.Phone)
	}
	if repo.created.PasswordHash == nil || *repo.created.PasswordHash == "Strong$123" {
		t.Fatal("password was not hashed")
	}
	ok, err := password.Verify("Strong$123", *repo.created.PasswordHash)
	if err != nil || !ok {
		t.Fatalf("stored password hash did not verify: ok=%v err=%v", ok, err)
	}
	if repo.eventType != "user.created" {
		t.Fatalf("expected user.created outbox event, got %s", repo.eventType)
	}
}

func TestSignupReturnsFieldConflict(t *testing.T) {
	repo := &fakeUserRepo{emailExists: true}
	svc := service.New(repo, &fakeAuthClient{})
	_, err := svc.Signup(context.Background(), service.SignupRequest{
		FullName:      "Jane Doe",
		Username:      "janed",
		Email:         "jane@example.com",
		Password:      "Strong$123",
		GouvernoratID: 1,
	})
	app := apperr.From(err)
	if app.Code != apperr.CodeConflict {
		t.Fatalf("expected conflict, got %#v", app)
	}
	if app.Fields["email"] == "" {
		t.Fatal("expected email field conflict")
	}
}

func TestUpdateProfileTreatsFieldsAsOptional(t *testing.T) {
	id := uuid.New()
	phone := "+21612345678"
	newPhone := "12 345 679"
	govID := int16(1)
	repo := &fakeUserRepo{current: domain.User{
		ID:            id,
		FullName:      "Jane Doe",
		Username:      "janed",
		Email:         "jane@example.com",
		Phone:         &phone,
		GouvernoratID: &govID,
		Role:          domain.RoleUser,
		AuthProvider:  domain.ProviderManual,
	}}
	svc := service.New(repo, &fakeAuthClient{})

	_, err := svc.UpdateProfile(context.Background(), id, service.UpdateProfileRequest{Phone: &newPhone})
	if err != nil {
		t.Fatalf("UpdateProfile returned error: %v", err)
	}
	if repo.updated.FullName != nil {
		t.Fatal("full_name should not be overwritten when omitted")
	}
	if repo.updated.Username != nil {
		t.Fatal("username should not be overwritten when omitted")
	}
	if repo.updated.GouvernoratID != nil {
		t.Fatal("gouvernorat_id should not be overwritten when omitted")
	}
	if repo.updated.Phone == nil || *repo.updated.Phone != "+21612345679" {
		t.Fatalf("phone was not normalized: %#v", repo.updated.Phone)
	}
}

func TestChangeRoleRequiresSuperadminAndProtectsLastSuperadmin(t *testing.T) {
	targetID := uuid.New()
	adminActor := actor(uuid.New(), domain.RoleAdmin)
	superActor := actor(uuid.New(), domain.RoleSuperAdmin)
	repo := &fakeUserRepo{current: domain.User{ID: targetID, Role: domain.RoleUser}, superadminCount: 2}
	svc := service.New(repo, &fakeAuthClient{})

	if _, err := svc.ChangeRole(context.Background(), adminActor, targetID, domain.RoleAdmin); apperr.From(err).Status != 403 {
		t.Fatalf("expected admin role change to be forbidden, got %v", err)
	}
	if _, err := svc.ChangeRole(context.Background(), superActor, targetID, domain.RoleSuperAdmin); err != nil {
		t.Fatalf("expected superadmin role change to pass: %v", err)
	}
	if repo.changedRole != domain.RoleSuperAdmin {
		t.Fatalf("expected role to change to superadmin, got %q", repo.changedRole)
	}

	repo.current = domain.User{ID: superActor.ID, Role: domain.RoleSuperAdmin}
	repo.superadminCount = 1
	if _, err := svc.ChangeRole(context.Background(), superActor, superActor.ID, domain.RoleAdmin); apperr.From(err).Status != 403 {
		t.Fatalf("expected last superadmin demotion to be forbidden, got %v", err)
	}
}

func TestTargetAwareBanAndDeleteRequireSuperadminForAdminTargets(t *testing.T) {
	targetID := uuid.New()
	adminActor := actor(uuid.New(), domain.RoleAdmin)
	superActor := actor(uuid.New(), domain.RoleSuperAdmin)
	repo := &fakeUserRepo{current: domain.User{ID: targetID, Role: domain.RoleAdmin}, superadminCount: 2}
	svc := service.New(repo, &fakeAuthClient{})

	if _, err := svc.SetBan(context.Background(), adminActor, targetID, true, nil); apperr.From(err).Status != 403 {
		t.Fatalf("expected admin banning admin to be forbidden, got %v", err)
	}
	if _, err := svc.SetBan(context.Background(), superActor, targetID, true, nil); err != nil {
		t.Fatalf("expected superadmin banning admin to pass: %v", err)
	}

	if err := svc.SoftDeleteManagedUser(context.Background(), adminActor, targetID); apperr.From(err).Status != 403 {
		t.Fatalf("expected admin deleting admin to be forbidden, got %v", err)
	}
	if err := svc.SoftDeleteManagedUser(context.Background(), superActor, targetID); err != nil {
		t.Fatalf("expected superadmin deleting admin to pass: %v", err)
	}
}

func TestSetPasswordRequiresRecentTwoFactorProofWhenTwoFactorEnabled(t *testing.T) {
	userID := uuid.New()
	repo := &fakeUserRepo{current: domain.User{
		ID:               userID,
		Email:            "google@example.com",
		AuthProvider:     domain.ProviderGoogle,
		PasswordHash:     nil,
		TwoFactorEnabled: true,
	}}
	svc := service.New(repo, &fakeAuthClient{}, service.Options{RecentAuthWindow: 10 * time.Minute})

	err := svc.SetPassword(context.Background(), service.AuthContext{
		UserID:      userID,
		AuthTime:    time.Now().Add(-time.Minute),
		AuthMethods: []string{service.AuthMethodGoogle},
		SessionID:   uuid.New(),
	}, service.SetPasswordRequest{
		NewPassword:        "Strong$123",
		NewPasswordConfirm: "Strong$123",
	})

	app := apperr.From(err)
	if app.Status != 403 || app.Code != apperr.CodeRecentAuthRequired {
		t.Fatalf("expected recent 2FA proof error, got %#v", app)
	}
	if repo.updatedPasswordHash != "" {
		t.Fatal("password hash must not be stored without recent 2FA proof")
	}
}

func TestSetPasswordStoresHashAuditsAndRevokesOtherSessions(t *testing.T) {
	userID := uuid.New()
	sessionID := uuid.New()
	auth := &fakeAuthClient{}
	repo := &fakeUserRepo{current: domain.User{
		ID:               userID,
		Email:            "google@example.com",
		AuthProvider:     domain.ProviderGoogle,
		PasswordHash:     nil,
		TwoFactorEnabled: true,
	}}
	svc := service.New(repo, auth, service.Options{RecentAuthWindow: 10 * time.Minute})

	err := svc.SetPassword(context.Background(), service.AuthContext{
		UserID:      userID,
		AuthTime:    time.Now().Add(-time.Minute),
		AuthMethods: []string{service.AuthMethodGoogle, service.AuthMethodOTP},
		SessionID:   sessionID,
	}, service.SetPasswordRequest{
		NewPassword:        "Strong$123",
		NewPasswordConfirm: "Strong$123",
	})
	if err != nil {
		t.Fatalf("SetPassword returned error: %v", err)
	}
	if repo.updatedPasswordHash == "" || repo.updatedPasswordHash == "Strong$123" {
		t.Fatal("expected password to be stored as a hash")
	}
	if ok, err := password.Verify("Strong$123", repo.updatedPasswordHash); err != nil || !ok {
		t.Fatalf("stored hash did not verify: ok=%v err=%v", ok, err)
	}
	if repo.auditEvent != "password_set" {
		t.Fatalf("expected password_set audit event, got %q", repo.auditEvent)
	}
	if auth.revokedOtherUserID != userID || auth.revokedOtherSessionID != sessionID {
		t.Fatalf("expected other sessions revoked for current session, got user=%s session=%s", auth.revokedOtherUserID, auth.revokedOtherSessionID)
	}
}

func TestSetPasswordRejectsUsersWhoAlreadyHaveLocalPassword(t *testing.T) {
	userID := uuid.New()
	hash, err := password.HashWithParams("Strong$123", password.Params{Memory: 1024, Iterations: 1, Parallelism: 1, SaltLength: 16, KeyLength: 32})
	if err != nil {
		t.Fatalf("hash password: %v", err)
	}
	repo := &fakeUserRepo{current: domain.User{
		ID:           userID,
		Email:        "linked@example.com",
		AuthProvider: domain.ProviderGoogle,
		PasswordHash: &hash,
	}}
	svc := service.New(repo, &fakeAuthClient{})

	err = svc.SetPassword(context.Background(), service.AuthContext{
		UserID:      userID,
		AuthTime:    time.Now(),
		AuthMethods: []string{service.AuthMethodGoogle},
		SessionID:   uuid.New(),
	}, service.SetPasswordRequest{
		NewPassword:        "Another$123",
		NewPasswordConfirm: "Another$123",
	})

	app := apperr.From(err)
	if app.Status != 409 {
		t.Fatalf("expected conflict for existing password, got %#v", app)
	}
}

func TestVerifyPasswordAllowsGoogleAccountWithLocalPassword(t *testing.T) {
	hash, err := password.HashWithParams("Strong$123", password.Params{Memory: 1024, Iterations: 1, Parallelism: 1, SaltLength: 16, KeyLength: 32})
	if err != nil {
		t.Fatalf("hash password: %v", err)
	}
	repo := &fakeUserRepo{current: domain.User{
		ID:           uuid.New(),
		AuthProvider: domain.ProviderGoogle,
		PasswordHash: &hash,
	}}
	svc := service.New(repo, &fakeAuthClient{})

	if err := svc.VerifyPassword(context.Background(), repo.current.ID, "Strong$123"); err != nil {
		t.Fatalf("VerifyPassword should allow linked Google users with a local password: %v", err)
	}
}

func actor(id uuid.UUID, role string) service.Actor {
	return service.Actor{ID: id, Role: role}
}

type fakeAuthClient struct {
	revokedAllUserID      uuid.UUID
	revokedOtherUserID    uuid.UUID
	revokedOtherSessionID uuid.UUID
}

func (f *fakeAuthClient) RevokeAllRefreshTokens(_ context.Context, userID uuid.UUID) error {
	f.revokedAllUserID = userID
	return nil
}

func (f *fakeAuthClient) RevokeOtherRefreshTokens(_ context.Context, userID, sessionID uuid.UUID) error {
	f.revokedOtherUserID = userID
	f.revokedOtherSessionID = sessionID
	return nil
}

type fakeUserRepo struct {
	emailExists         bool
	usernameExists      bool
	phoneExists         bool
	created             repository.CreateUserParams
	updated             repository.UpdateProfileParams
	current             domain.User
	eventType           string
	auditEvent          string
	changedRole         string
	updatedPasswordHash string
	superadminCount     int
}

func (f *fakeUserRepo) CreateUserWithOutbox(_ context.Context, params repository.CreateUserParams, eventType string, _ any) (domain.User, error) {
	f.created = params
	f.eventType = eventType
	id := uuid.New()
	return domain.User{
		ID:               id,
		FullName:         params.FullName,
		Username:         params.Username,
		Email:            params.Email,
		Phone:            params.Phone,
		PasswordHash:     params.PasswordHash,
		GouvernoratID:    params.GouvernoratID,
		Role:             domain.RoleUser,
		AuthProvider:     params.AuthProvider,
		IsVerified:       params.IsVerified,
		TwoFactorEnabled: false,
	}, nil
}

func (f *fakeUserRepo) GetByID(context.Context, uuid.UUID) (domain.User, error) {
	return f.current, nil
}
func (f *fakeUserRepo) GetByIdentifier(context.Context, string) (domain.User, error) {
	return domain.User{}, nil
}
func (f *fakeUserRepo) GetByEmail(context.Context, string) (domain.User, error) {
	return domain.User{}, nil
}
func (f *fakeUserRepo) ExistsEmail(context.Context, string) (bool, error) { return f.emailExists, nil }
func (f *fakeUserRepo) ExistsUsername(context.Context, string) (bool, error) {
	return f.usernameExists, nil
}
func (f *fakeUserRepo) ExistsPhone(context.Context, string) (bool, error) { return f.phoneExists, nil }
func (f *fakeUserRepo) UpdateProfile(_ context.Context, params repository.UpdateProfileParams) (domain.User, error) {
	f.updated = params
	user := f.current
	if params.FullName != nil {
		user.FullName = *params.FullName
	}
	if params.Username != nil {
		user.Username = *params.Username
	}
	if params.Phone != nil {
		user.Phone = params.Phone
	}
	if params.GouvernoratID != nil {
		user.GouvernoratID = params.GouvernoratID
	}
	return user, nil
}
func (f *fakeUserRepo) UpdatePasswordWithOutbox(context.Context, uuid.UUID, string, any) error {
	return nil
}
func (f *fakeUserRepo) SoftDelete(context.Context, uuid.UUID) error { return nil }
func (f *fakeUserRepo) List(context.Context, int, int) ([]domain.User, int64, error) {
	return nil, 0, nil
}
func (f *fakeUserRepo) ChangeRole(_ context.Context, _ uuid.UUID, role string) (domain.User, error) {
	f.changedRole = role
	user := f.current
	user.Role = role
	return user, nil
}
func (f *fakeUserRepo) SetBan(context.Context, uuid.UUID, bool, *string) (domain.User, error) {
	return f.current, nil
}
func (f *fakeUserRepo) RecordLoginFailure(context.Context, uuid.UUID, *time.Time) error {
	return nil
}
func (f *fakeUserRepo) RecordLoginSuccess(context.Context, uuid.UUID) error { return nil }
func (f *fakeUserRepo) ListGouvernorats(context.Context) ([]domain.Gouvernorat, error) {
	return nil, nil
}
func (f *fakeUserRepo) MarkVerified(context.Context, uuid.UUID) (domain.User, error) {
	return domain.User{}, nil
}
func (f *fakeUserRepo) SetTwoFactor(context.Context, uuid.UUID, bool) (domain.User, error) {
	return domain.User{}, nil
}
func (f *fakeUserRepo) UpdatePasswordHash(_ context.Context, _ uuid.UUID, passwordHash string) error {
	f.updatedPasswordHash = passwordHash
	return nil
}
func (f *fakeUserRepo) CountActiveSuperAdmins(context.Context) (int, error) {
	if f.superadminCount == 0 {
		return 1, nil
	}
	return f.superadminCount, nil
}
func (f *fakeUserRepo) CreateAuditEvent(_ context.Context, eventType string, _ uuid.UUID, _ uuid.UUID, _ any) error {
	f.auditEvent = eventType
	return nil
}
func (f *fakeUserRepo) Ping(context.Context) error { return nil }
