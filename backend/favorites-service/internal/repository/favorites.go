package repository

import (
	"context"
	"errors"
	"net/http"
	"time"

	"backend/favorites-service/internal/domain"
	"backend/shared/apperr"
	shareddb "backend/shared/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	AddFavorite(ctx context.Context, userID, productID uuid.UUID) (domain.Favorite, error)
	RemoveFavorite(ctx context.Context, userID, productID uuid.UUID) error
	GetFavoriteByUserAndProduct(ctx context.Context, userID, productID uuid.UUID) (domain.Favorite, error)
	ListFavoritesByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Favorite, error)
	CountFavoritesByUser(ctx context.Context, userID uuid.UUID) (int64, error)
	ClearFavoritesByUser(ctx context.Context, userID uuid.UUID) error
	CountFavoritesByProduct(ctx context.Context, limit int) ([]domain.PopularProduct, error)
	Ping(ctx context.Context) error
}

type PostgresRepository struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{pool: pool}
}

func (r *PostgresRepository) AddFavorite(ctx context.Context, userID, productID uuid.UUID) (domain.Favorite, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	favorite, err := scanFavorite(r.pool.QueryRow(ctx, `
		INSERT INTO favorites (user_id, product_id)
		VALUES ($1, $2)
		RETURNING id, user_id, product_id, created_at`, userID, productID))
	if err != nil {
		return domain.Favorite{}, mapPGError(err)
	}
	return favorite, nil
}

func (r *PostgresRepository) RemoveFavorite(ctx context.Context, userID, productID uuid.UUID) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	result, err := r.pool.Exec(ctx, `DELETE FROM favorites WHERE user_id = $1 AND product_id = $2`, userID, productID)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return favoriteNotFound()
	}
	return nil
}

func (r *PostgresRepository) GetFavoriteByUserAndProduct(ctx context.Context, userID, productID uuid.UUID) (domain.Favorite, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	return scanFavorite(r.pool.QueryRow(ctx, `
		SELECT id, user_id, product_id, created_at
		FROM favorites
		WHERE user_id = $1 AND product_id = $2
		LIMIT 1`, userID, productID))
}

func (r *PostgresRepository) ListFavoritesByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Favorite, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	rows, err := r.pool.Query(ctx, `
		SELECT id, user_id, product_id, created_at
		FROM favorites
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []domain.Favorite{}
	for rows.Next() {
		item, err := scanFavorite(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *PostgresRepository) CountFavoritesByUser(ctx context.Context, userID uuid.UUID) (int64, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	var total int64
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM favorites WHERE user_id = $1`, userID).Scan(&total)
	return total, err
}

func (r *PostgresRepository) ClearFavoritesByUser(ctx context.Context, userID uuid.UUID) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	_, err := r.pool.Exec(ctx, `DELETE FROM favorites WHERE user_id = $1`, userID)
	return err
}

func (r *PostgresRepository) CountFavoritesByProduct(ctx context.Context, limit int) ([]domain.PopularProduct, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	rows, err := r.pool.Query(ctx, `
		SELECT product_id, COUNT(*) AS favorite_count
		FROM favorites
		GROUP BY product_id
		ORDER BY favorite_count DESC
		LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []domain.PopularProduct{}
	for rows.Next() {
		var item domain.PopularProduct
		if err := rows.Scan(&item.ProductID, &item.FavoriteCount); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *PostgresRepository) Ping(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	return r.pool.Ping(ctx)
}

type scanner interface {
	Scan(dest ...any) error
}

func scanFavorite(row scanner) (domain.Favorite, error) {
	var favorite domain.Favorite
	err := row.Scan(&favorite.ID, &favorite.UserID, &favorite.ProductID, &favorite.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Favorite{}, favoriteNotFound()
		}
		return domain.Favorite{}, err
	}
	return favorite, nil
}

func mapPGError(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return apperr.New(http.StatusConflict, domain.ErrAlreadyFavorited, "Product is already in favorites.")
	}
	return err
}

func favoriteNotFound() error {
	return apperr.New(http.StatusNotFound, domain.ErrFavoriteNotFound, "Favorite was not found.")
}
