package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"backend/shared/apperr"
	shareddb "backend/shared/db"
	"backend/user-service/internal/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CreateUserParams struct {
	FullName      string
	Username      string
	Email         string
	Phone         *string
	PasswordHash  *string
	GouvernoratID *int16
	AuthProvider  string
	IsVerified    bool
}

type UpdateProfileParams struct {
	ID            uuid.UUID
	FullName      *string
	Username      *string
	Phone         *string
	GouvernoratID *int16
}

type Repository interface {
	CreateUserWithOutbox(ctx context.Context, params CreateUserParams, eventType string, eventPayload any) (domain.User, error)
	GetByID(ctx context.Context, id uuid.UUID) (domain.User, error)
	GetByIdentifier(ctx context.Context, identifier string) (domain.User, error)
	GetByEmail(ctx context.Context, email string) (domain.User, error)
	ExistsEmail(ctx context.Context, email string) (bool, error)
	ExistsUsername(ctx context.Context, username string) (bool, error)
	ExistsPhone(ctx context.Context, phone string) (bool, error)
	UpdateProfile(ctx context.Context, params UpdateProfileParams) (domain.User, error)
	UpdatePasswordWithOutbox(ctx context.Context, id uuid.UUID, passwordHash string, eventPayload any) error
	SoftDelete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, page, perPage int) ([]domain.User, int64, error)
	ChangeRole(ctx context.Context, id uuid.UUID, role string) (domain.User, error)
	SetBan(ctx context.Context, id uuid.UUID, banned bool, reason *string) (domain.User, error)
	RecordLoginFailure(ctx context.Context, id uuid.UUID, lockedUntil *time.Time) error
	RecordLoginSuccess(ctx context.Context, id uuid.UUID) error
	ListGouvernorats(ctx context.Context) ([]domain.Gouvernorat, error)
	MarkVerified(ctx context.Context, id uuid.UUID) (domain.User, error)
	SetTwoFactor(ctx context.Context, id uuid.UUID, enabled bool) (domain.User, error)
	UpdatePasswordHash(ctx context.Context, id uuid.UUID, passwordHash string) error
	Ping(ctx context.Context) error
}

type PostgresRepository struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{pool: pool}
}

func (r *PostgresRepository) CreateUserWithOutbox(ctx context.Context, params CreateUserParams, eventType string, eventPayload any) (domain.User, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return domain.User{}, err
	}
	defer rollback(ctx, tx)

	user, err := scanUser(tx.QueryRow(ctx, `
		INSERT INTO users (full_name, username, email, phone, password_hash, gouvernorat_id, role, auth_provider, is_verified)
		VALUES ($1, $2, $3, $4, $5, $6, 'user', $7, $8)
		RETURNING id, full_name, username, email, phone, password_hash, gouvernorat_id, role, auth_provider,
		          is_verified, is_banned, ban_reason, two_factor_enabled, two_factor_enabled_at, failed_login_attempts, locked_until,
		          last_login_at, deleted_at, created_at, updated_at`,
		params.FullName, params.Username, params.Email, params.Phone, params.PasswordHash, params.GouvernoratID, params.AuthProvider, params.IsVerified,
	))
	if err != nil {
		return domain.User{}, mapPGError(err)
	}
	if eventType != "" {
		if payload, ok := eventPayload.(map[string]any); ok {
			if _, exists := payload["user_id"]; !exists || payload["user_id"] == "" {
				payload["user_id"] = user.ID.String()
			}
		}
		if err := insertOutbox(ctx, tx, eventType, eventPayload); err != nil {
			return domain.User{}, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return domain.User{}, err
	}
	return user, nil
}

func (r *PostgresRepository) GetByID(ctx context.Context, id uuid.UUID) (domain.User, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	return scanUser(r.pool.QueryRow(ctx, selectUserSQL+` WHERE id = $1 AND deleted_at IS NULL`, id))
}

func (r *PostgresRepository) GetByIdentifier(ctx context.Context, identifier string) (domain.User, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	return scanUser(r.pool.QueryRow(ctx, selectUserSQL+` WHERE (email = $1 OR username = $1) AND deleted_at IS NULL`, identifier))
}

func (r *PostgresRepository) GetByEmail(ctx context.Context, email string) (domain.User, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	return scanUser(r.pool.QueryRow(ctx, selectUserSQL+` WHERE email = $1 AND deleted_at IS NULL`, email))
}

func (r *PostgresRepository) ExistsEmail(ctx context.Context, email string) (bool, error) {
	return r.exists(ctx, `SELECT EXISTS (SELECT 1 FROM users WHERE email = $1 AND deleted_at IS NULL)`, email)
}

func (r *PostgresRepository) ExistsUsername(ctx context.Context, username string) (bool, error) {
	return r.exists(ctx, `SELECT EXISTS (SELECT 1 FROM users WHERE username = $1 AND deleted_at IS NULL)`, username)
}

func (r *PostgresRepository) ExistsPhone(ctx context.Context, phone string) (bool, error) {
	return r.exists(ctx, `SELECT EXISTS (SELECT 1 FROM users WHERE phone = $1 AND deleted_at IS NULL)`, phone)
}

func (r *PostgresRepository) UpdateProfile(ctx context.Context, params UpdateProfileParams) (domain.User, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	user, err := scanUser(r.pool.QueryRow(ctx, `
		UPDATE users
		SET full_name = COALESCE($2, full_name),
		    username = COALESCE($3, username),
		    phone = COALESCE($4, phone),
		    gouvernorat_id = COALESCE($5, gouvernorat_id),
		    updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
		RETURNING id, full_name, username, email, phone, password_hash, gouvernorat_id, role, auth_provider,
		          is_verified, is_banned, ban_reason, two_factor_enabled, two_factor_enabled_at, failed_login_attempts, locked_until,
		          last_login_at, deleted_at, created_at, updated_at`,
		params.ID, params.FullName, params.Username, params.Phone, params.GouvernoratID,
	))
	if err != nil {
		return domain.User{}, mapPGError(err)
	}
	return user, nil
}

func (r *PostgresRepository) UpdatePasswordWithOutbox(ctx context.Context, id uuid.UUID, passwordHash string, eventPayload any) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer rollback(ctx, tx)
	result, err := tx.Exec(ctx, `UPDATE users SET password_hash = $2 WHERE id = $1 AND deleted_at IS NULL`, id, passwordHash)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return apperr.New(http.StatusNotFound, apperr.CodeNotFound, "User was not found.")
	}
	if err := insertOutbox(ctx, tx, "user.password_changed", eventPayload); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *PostgresRepository) SoftDelete(ctx context.Context, id uuid.UUID) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	result, err := r.pool.Exec(ctx, `UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return apperr.New(http.StatusNotFound, apperr.CodeNotFound, "User was not found.")
	}
	return nil
}

func (r *PostgresRepository) List(ctx context.Context, page, perPage int) ([]domain.User, int64, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE deleted_at IS NULL`).Scan(&total); err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * perPage
	rows, err := r.pool.Query(ctx, selectUserSQL+` WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`, perPage, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	users := []domain.User{}
	for rows.Next() {
		user, err := scanUser(rows)
		if err != nil {
			return nil, 0, err
		}
		users = append(users, user)
	}
	return users, total, rows.Err()
}

func (r *PostgresRepository) ChangeRole(ctx context.Context, id uuid.UUID, role string) (domain.User, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	return scanUser(r.pool.QueryRow(ctx, `
		UPDATE users SET role = $2
		WHERE id = $1 AND deleted_at IS NULL
		RETURNING id, full_name, username, email, phone, password_hash, gouvernorat_id, role, auth_provider,
		          is_verified, is_banned, ban_reason, two_factor_enabled, two_factor_enabled_at, failed_login_attempts, locked_until,
		          last_login_at, deleted_at, created_at, updated_at`, id, role))
}

func (r *PostgresRepository) SetBan(ctx context.Context, id uuid.UUID, banned bool, reason *string) (domain.User, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	return scanUser(r.pool.QueryRow(ctx, `
		UPDATE users SET is_banned = $2, ban_reason = $3
		WHERE id = $1 AND deleted_at IS NULL
		RETURNING id, full_name, username, email, phone, password_hash, gouvernorat_id, role, auth_provider,
		          is_verified, is_banned, ban_reason, two_factor_enabled, two_factor_enabled_at, failed_login_attempts, locked_until,
		          last_login_at, deleted_at, created_at, updated_at`, id, banned, reason))
}

func (r *PostgresRepository) RecordLoginFailure(ctx context.Context, id uuid.UUID, lockedUntil *time.Time) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	_, err := r.pool.Exec(ctx, `
		UPDATE users
		SET failed_login_attempts = failed_login_attempts + 1, locked_until = COALESCE($2, locked_until)
		WHERE id = $1 AND deleted_at IS NULL`, id, lockedUntil)
	return err
}

func (r *PostgresRepository) RecordLoginSuccess(ctx context.Context, id uuid.UUID) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	_, err := r.pool.Exec(ctx, `
		UPDATE users
		SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL`, id)
	return err
}

func (r *PostgresRepository) ListGouvernorats(ctx context.Context) ([]domain.Gouvernorat, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	rows, err := r.pool.Query(ctx, `SELECT id, name FROM gouvernorats ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []domain.Gouvernorat{}
	for rows.Next() {
		var item domain.Gouvernorat
		if err := rows.Scan(&item.ID, &item.Name); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *PostgresRepository) MarkVerified(ctx context.Context, id uuid.UUID) (domain.User, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	return scanUser(r.pool.QueryRow(ctx, `
		UPDATE users SET is_verified = true
		WHERE id = $1 AND deleted_at IS NULL
		RETURNING id, full_name, username, email, phone, password_hash, gouvernorat_id, role, auth_provider,
		          is_verified, is_banned, ban_reason, two_factor_enabled, two_factor_enabled_at, failed_login_attempts, locked_until,
		          last_login_at, deleted_at, created_at, updated_at`, id))
}

func (r *PostgresRepository) SetTwoFactor(ctx context.Context, id uuid.UUID, enabled bool) (domain.User, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	return scanUser(r.pool.QueryRow(ctx, `
		UPDATE users
		SET two_factor_enabled = $2,
		    two_factor_enabled_at = CASE WHEN $2 THEN NOW() ELSE NULL END
		WHERE id = $1 AND deleted_at IS NULL
		RETURNING id, full_name, username, email, phone, password_hash, gouvernorat_id, role, auth_provider,
		          is_verified, is_banned, ban_reason, two_factor_enabled, two_factor_enabled_at, failed_login_attempts, locked_until,
		          last_login_at, deleted_at, created_at, updated_at`, id, enabled))
}

func (r *PostgresRepository) UpdatePasswordHash(ctx context.Context, id uuid.UUID, passwordHash string) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	result, err := r.pool.Exec(ctx, `
		UPDATE users SET password_hash = $2
		WHERE id = $1 AND deleted_at IS NULL`, id, passwordHash)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return apperr.New(http.StatusNotFound, apperr.CodeNotFound, "User was not found.")
	}
	return nil
}

func (r *PostgresRepository) Ping(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	return r.pool.Ping(ctx)
}

func (r *PostgresRepository) exists(ctx context.Context, sql string, arg any) (bool, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	var exists bool
	err := r.pool.QueryRow(ctx, sql, arg).Scan(&exists)
	return exists, err
}

const selectUserSQL = `
SELECT id, full_name, username, email, phone, password_hash, gouvernorat_id, role, auth_provider,
       is_verified, is_banned, ban_reason, two_factor_enabled, two_factor_enabled_at, failed_login_attempts, locked_until,
       last_login_at, deleted_at, created_at, updated_at
FROM users`

type scanner interface {
	Scan(dest ...any) error
}

func scanUser(row scanner) (domain.User, error) {
	var user domain.User
	var phone, passwordHash, banReason sql.NullString
	var gouvernoratID sql.NullInt16
	var twoFactorEnabledAt, lockedUntil, lastLoginAt, deletedAt sql.NullTime
	err := row.Scan(
		&user.ID, &user.FullName, &user.Username, &user.Email, &phone, &passwordHash, &gouvernoratID,
		&user.Role, &user.AuthProvider, &user.IsVerified, &user.IsBanned, &banReason, &user.TwoFactorEnabled,
		&twoFactorEnabledAt, &user.FailedLoginAttempts, &lockedUntil, &lastLoginAt, &deletedAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.User{}, apperr.New(http.StatusNotFound, apperr.CodeNotFound, "User was not found.")
		}
		return domain.User{}, err
	}
	if phone.Valid {
		user.Phone = &phone.String
	}
	if passwordHash.Valid {
		user.PasswordHash = &passwordHash.String
	}
	if banReason.Valid {
		user.BanReason = &banReason.String
	}
	if gouvernoratID.Valid {
		user.GouvernoratID = &gouvernoratID.Int16
	}
	if twoFactorEnabledAt.Valid {
		user.TwoFactorEnabledAt = &twoFactorEnabledAt.Time
	}
	if lockedUntil.Valid {
		user.LockedUntil = &lockedUntil.Time
	}
	if lastLoginAt.Valid {
		user.LastLoginAt = &lastLoginAt.Time
	}
	if deletedAt.Valid {
		user.DeletedAt = &deletedAt.Time
	}
	return user, nil
}

func insertOutbox(ctx context.Context, tx pgx.Tx, eventType string, payload any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `INSERT INTO outbox_events (event_type, payload) VALUES ($1, $2)`, eventType, string(body))
	return err
}

func rollback(ctx context.Context, tx pgx.Tx) {
	_ = tx.Rollback(ctx)
}

func mapPGError(err error) error {
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) {
		return err
	}
	if pgErr.Code == "23505" {
		return apperr.New(http.StatusConflict, apperr.CodeConflict, "A unique field is already in use.")
	}
	if pgErr.Code == "23503" {
		return apperr.New(http.StatusUnprocessableEntity, apperr.CodeValidationError, "A referenced value does not exist.")
	}
	return fmt.Errorf("postgres error %s: %w", pgErr.Code, err)
}
