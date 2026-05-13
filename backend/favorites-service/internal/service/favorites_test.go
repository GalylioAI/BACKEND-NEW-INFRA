package service_test

import (
	"context"
	"testing"

	"backend/favorites-service/internal/domain"
	"backend/favorites-service/internal/service"
	"backend/shared/apperr"

	"github.com/google/uuid"
)

func TestAddFavoriteRejectsDuplicate(t *testing.T) {
	repo := &fakeRepo{existing: true}
	svc := service.New(repo)
	_, err := svc.AddFavorite(context.Background(), uuid.New(), uuid.New())
	app := apperr.From(err)
	if app.Code != domain.ErrAlreadyFavorited {
		t.Fatalf("expected duplicate error, got %#v", app)
	}
}

func TestListFavoritesCapsPerPage(t *testing.T) {
	repo := &fakeRepo{}
	svc := service.New(repo)
	_, pagination, err := svc.ListFavorites(context.Background(), uuid.New(), 1, 500)
	if err != nil {
		t.Fatalf("ListFavorites returned error: %v", err)
	}
	if repo.limit != 100 || pagination.PerPage != 100 {
		t.Fatalf("expected per_page cap of 100, got repo=%d pagination=%d", repo.limit, pagination.PerPage)
	}
}

type fakeRepo struct {
	existing bool
	limit    int
}

func (f *fakeRepo) AddFavorite(context.Context, uuid.UUID, uuid.UUID) (domain.Favorite, error) {
	return domain.Favorite{ID: uuid.New()}, nil
}
func (f *fakeRepo) RemoveFavorite(context.Context, uuid.UUID, uuid.UUID) error { return nil }
func (f *fakeRepo) GetFavoriteByUserAndProduct(context.Context, uuid.UUID, uuid.UUID) (domain.Favorite, error) {
	if f.existing {
		return domain.Favorite{ID: uuid.New()}, nil
	}
	return domain.Favorite{}, apperr.New(404, domain.ErrFavoriteNotFound, "not found")
}
func (f *fakeRepo) ListFavoritesByUser(_ context.Context, _ uuid.UUID, limit, _ int) ([]domain.Favorite, error) {
	f.limit = limit
	return nil, nil
}
func (f *fakeRepo) CountFavoritesByUser(context.Context, uuid.UUID) (int64, error) {
	return 0, nil
}
func (f *fakeRepo) ClearFavoritesByUser(context.Context, uuid.UUID) error { return nil }
func (f *fakeRepo) CountFavoritesByProduct(context.Context, int) ([]domain.PopularProduct, error) {
	return nil, nil
}
func (f *fakeRepo) Ping(context.Context) error { return nil }
