package repository

import (
	"context"
	"database/sql"
	"errors"
	"net"
	"net/http"
	"time"

	"backend/auth-service/internal/domain"
	"backend/shared/apperr"
	shareddb "backend/shared/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	CreateRefreshToken(ctx context.Context, userID uuid.UUID, tokenHash, deviceInfo string, ip net.IP, expiresAt time.Time) error
	RotateRefreshToken(ctx context.Context, oldHash, newHash, deviceInfo string, ip net.IP, expiresAt time.Time) (uuid.UUID, bool, error)
	RevokeRefreshToken(ctx context.Context, tokenHash string) error
	RevokeAllRefreshTokens(ctx context.Context, userID uuid.UUID) error
	CreateTwoFactorSession(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) error
	ConsumeTwoFactorSession(ctx context.Context, tokenHash string) (uuid.UUID, error)
	Ping(ctx context.Context) error
}

type PostgresRepository struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{pool: pool}
}

func (r *PostgresRepository) CreateRefreshToken(ctx context.Context, userID uuid.UUID, tokenHash, deviceInfo string, ip net.IP, expiresAt time.Time) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO refresh_tokens (user_id, token_hash, device_info, ip_address, expires_at)
		VALUES ($1, $2, $3, $4, $5)`, userID, tokenHash, nullString(deviceInfo), nullIP(ip), expiresAt)
	return err
}

func (r *PostgresRepository) RotateRefreshToken(ctx context.Context, oldHash, newHash, deviceInfo string, ip net.IP, expiresAt time.Time) (uuid.UUID, bool, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return uuid.Nil, false, err
	}
	defer tx.Rollback(ctx)

	var record domain.RefreshRecord
	err = tx.QueryRow(ctx, `
		SELECT id, user_id, token_hash, revoked, expires_at
		FROM refresh_tokens
		WHERE token_hash = $1
		FOR UPDATE`, oldHash).Scan(&record.ID, &record.UserID, &record.TokenHash, &record.Revoked, &record.ExpiresAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return uuid.Nil, false, apperr.New(http.StatusUnauthorized, apperr.CodeInvalidRefreshToken, "Refresh token is invalid.")
		}
		return uuid.Nil, false, err
	}
	if record.Revoked {
		if _, err := tx.Exec(ctx, `UPDATE refresh_tokens SET revoked = true WHERE user_id = $1`, record.UserID); err != nil {
			return uuid.Nil, true, err
		}
		if err := tx.Commit(ctx); err != nil {
			return uuid.Nil, true, err
		}
		return record.UserID, true, apperr.New(http.StatusUnauthorized, apperr.CodeInvalidRefreshToken, "Refresh token is invalid.")
	}
	if time.Now().UTC().After(record.ExpiresAt) {
		return record.UserID, false, apperr.New(http.StatusUnauthorized, apperr.CodeInvalidRefreshToken, "Refresh token is invalid.")
	}
	if _, err := tx.Exec(ctx, `UPDATE refresh_tokens SET revoked = true WHERE id = $1`, record.ID); err != nil {
		return uuid.Nil, false, err
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO refresh_tokens (user_id, token_hash, device_info, ip_address, expires_at)
		VALUES ($1, $2, $3, $4, $5)`, record.UserID, newHash, nullString(deviceInfo), nullIP(ip), expiresAt); err != nil {
		return uuid.Nil, false, err
	}
	if err := tx.Commit(ctx); err != nil {
		return uuid.Nil, false, err
	}
	return record.UserID, false, nil
}

func (r *PostgresRepository) RevokeRefreshToken(ctx context.Context, tokenHash string) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	_, err := r.pool.Exec(ctx, `UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1`, tokenHash)
	return err
}

func (r *PostgresRepository) RevokeAllRefreshTokens(ctx context.Context, userID uuid.UUID) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	_, err := r.pool.Exec(ctx, `UPDATE refresh_tokens SET revoked = true WHERE user_id = $1`, userID)
	return err
}

func (r *PostgresRepository) CreateTwoFactorSession(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO two_factor_sessions (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)`, userID, tokenHash, expiresAt)
	return err
}

func (r *PostgresRepository) ConsumeTwoFactorSession(ctx context.Context, tokenHash string) (uuid.UUID, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return uuid.Nil, err
	}
	defer tx.Rollback(ctx)
	var userID uuid.UUID
	var used bool
	var expiresAt time.Time
	err = tx.QueryRow(ctx, `
		SELECT user_id, used, expires_at
		FROM two_factor_sessions
		WHERE token_hash = $1
		FOR UPDATE`, tokenHash).Scan(&userID, &used, &expiresAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return uuid.Nil, apperr.New(http.StatusUnauthorized, apperr.CodeInvalidTwoFASession, "2FA session token is invalid.")
		}
		return uuid.Nil, err
	}
	if used || time.Now().UTC().After(expiresAt) {
		return uuid.Nil, apperr.New(http.StatusUnauthorized, apperr.CodeInvalidTwoFASession, "2FA session token is invalid.")
	}
	if _, err := tx.Exec(ctx, `UPDATE two_factor_sessions SET used = true WHERE token_hash = $1`, tokenHash); err != nil {
		return uuid.Nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return uuid.Nil, err
	}
	return userID, nil
}

func nullString(value string) sql.NullString {
	return sql.NullString{String: value, Valid: value != ""}
}

func nullIP(ip net.IP) any {
	if ip == nil {
		return nil
	}
	return ip.String()
}

func (r *PostgresRepository) Ping(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	return r.pool.Ping(ctx)
}
