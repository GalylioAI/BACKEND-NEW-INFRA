package service

import (
	"context"
	"errors"
	"net/http"

	"backend/favorites-service/internal/domain"
	"backend/favorites-service/internal/repository"
	"backend/shared/apperr"

	"github.com/google/uuid"
)

type Service struct {
	repo repository.Repository
}

func New(repo repository.Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) AddFavorite(ctx context.Context, userID, productID uuid.UUID) (domain.Favorite, error) {
	if productID == uuid.Nil {
		return domain.Favorite{}, invalidProductID()
	}
	if _, err := s.repo.GetFavoriteByUserAndProduct(ctx, userID, productID); err == nil {
		return domain.Favorite{}, apperr.New(http.StatusConflict, domain.ErrAlreadyFavorited, "Product is already in favorites.")
	} else {
		app := apperr.From(err)
		if app.Code != domain.ErrFavoriteNotFound {
			return domain.Favorite{}, err
		}
	}
	return s.repo.AddFavorite(ctx, userID, productID)
}

func (s *Service) RemoveFavorite(ctx context.Context, userID, productID uuid.UUID) error {
	if productID == uuid.Nil {
		return invalidProductID()
	}
	if _, err := s.repo.GetFavoriteByUserAndProduct(ctx, userID, productID); err != nil {
		return err
	}
	return s.repo.RemoveFavorite(ctx, userID, productID)
}

func (s *Service) IsFavorited(ctx context.Context, userID, productID uuid.UUID) (bool, error) {
	if productID == uuid.Nil {
		return false, invalidProductID()
	}
	_, err := s.repo.GetFavoriteByUserAndProduct(ctx, userID, productID)
	if err == nil {
		return true, nil
	}
	app := apperr.From(err)
	if app.Code == domain.ErrFavoriteNotFound {
		return false, nil
	}
	return false, err
}

func (s *Service) ListFavorites(ctx context.Context, userID uuid.UUID, page, perPage int) ([]domain.Favorite, domain.Pagination, error) {
	page, perPage = normalizePagination(page, perPage)
	total, err := s.repo.CountFavoritesByUser(ctx, userID)
	if err != nil {
		return nil, domain.Pagination{}, err
	}
	offset := (page - 1) * perPage
	items, err := s.repo.ListFavoritesByUser(ctx, userID, perPage, offset)
	if err != nil {
		return nil, domain.Pagination{}, err
	}
	return items, pagination(total, page, perPage), nil
}

func (s *Service) ClearFavorites(ctx context.Context, userID uuid.UUID, confirmation string) error {
	if confirmation != "clear-all-favorites" {
		return apperr.New(http.StatusBadRequest, domain.ErrConfirmationRequired, "Confirmation header is required.")
	}
	return s.repo.ClearFavoritesByUser(ctx, userID)
}

func (s *Service) PopularProducts(ctx context.Context, limit int) ([]domain.PopularProduct, error) {
	if limit < 1 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}
	return s.repo.CountFavoritesByProduct(ctx, limit)
}

func (s *Service) Ping(ctx context.Context) error {
	return s.repo.Ping(ctx)
}

func normalizePagination(page, perPage int) (int, int) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 20
	}
	if perPage > 100 {
		perPage = 100
	}
	return page, perPage
}

func pagination(total int64, page, perPage int) domain.Pagination {
	totalPages := int((total + int64(perPage) - 1) / int64(perPage))
	if totalPages == 0 {
		totalPages = 1
	}
	return domain.Pagination{
		Total:      total,
		Page:       page,
		PerPage:    perPage,
		TotalPages: totalPages,
		HasNext:    page < totalPages,
		HasPrev:    page > 1,
	}
}

func invalidProductID() error {
	return apperr.New(http.StatusBadRequest, domain.ErrInvalidProductID, "Product ID must be a valid UUID.")
}

func IsNotFound(err error) bool {
	var app *apperr.Error
	return errors.As(err, &app) && app.Code == domain.ErrFavoriteNotFound
}
