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
	svc := service.New(repo, fakeAuthClient{})
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
	svc := service.New(repo, fakeAuthClient{})
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
	svc := service.New(repo, fakeAuthClient{})

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

type fakeAuthClient struct{}

func (fakeAuthClient) RevokeAllRefreshTokens(context.Context, uuid.UUID) error { return nil }

type fakeUserRepo struct {
	emailExists    bool
	usernameExists bool
	phoneExists    bool
	created        repository.CreateUserParams
	updated        repository.UpdateProfileParams
	current        domain.User
	eventType      string
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
func (f *fakeUserRepo) ChangeRole(context.Context, uuid.UUID, string) (domain.User, error) {
	return domain.User{}, nil
}
func (f *fakeUserRepo) SetBan(context.Context, uuid.UUID, bool, *string) (domain.User, error) {
	return domain.User{}, nil
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
func (f *fakeUserRepo) UpdatePasswordHash(context.Context, uuid.UUID, string) error {
	return nil
}
func (f *fakeUserRepo) Ping(context.Context) error { return nil }
