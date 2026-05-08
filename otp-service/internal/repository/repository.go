package repository

import (
	"context"
	"errors"
	"net/http"
	"time"

	"backend/otp-service/internal/domain"
	"backend/shared/apperr"
	shareddb "backend/shared/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	InvalidateOTPCodes(ctx context.Context, userID uuid.UUID, otpType string) error
	CreateOTPCode(ctx context.Context, userID uuid.UUID, codeHash, otpType string, expiresAt time.Time) (domain.OTPCode, error)
	GetActiveOTPCode(ctx context.Context, userID uuid.UUID, otpType string) (domain.OTPCode, error)
	IncrementOTPAttempts(ctx context.Context, id uuid.UUID) (domain.OTPCode, error)
	MarkOTPUsed(ctx context.Context, id uuid.UUID) error
	CheckAndIncrementRateLimit(ctx context.Context, userID uuid.UUID, otpType string) (int, error)
	CreatePasswordResetToken(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) (domain.PasswordResetToken, error)
	GetPasswordResetToken(ctx context.Context, tokenHash string) (domain.PasswordResetToken, error)
	MarkResetTokenUsed(ctx context.Context, id uuid.UUID) error
	InvalidateResetTokens(ctx context.Context, userID uuid.UUID) error
	Ping(ctx context.Context) error
}

type PostgresRepository struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{pool: pool}
}

func (r *PostgresRepository) InvalidateOTPCodes(ctx context.Context, userID uuid.UUID, otpType string) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	_, err := r.pool.Exec(ctx, `UPDATE otp_codes SET used = true WHERE user_id = $1 AND type = $2 AND used = false`, userID, otpType)
	return err
}

func (r *PostgresRepository) CreateOTPCode(ctx context.Context, userID uuid.UUID, codeHash, otpType string, expiresAt time.Time) (domain.OTPCode, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	return scanOTP(r.pool.QueryRow(ctx, `
		INSERT INTO otp_codes (user_id, code_hash, type, expires_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, code_hash, type, attempts, max_attempts, used, expires_at, created_at`,
		userID, codeHash, otpType, expiresAt))
}

func (r *PostgresRepository) GetActiveOTPCode(ctx context.Context, userID uuid.UUID, otpType string) (domain.OTPCode, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	return scanOTP(r.pool.QueryRow(ctx, `
		SELECT id, user_id, code_hash, type, attempts, max_attempts, used, expires_at, created_at
		FROM otp_codes
		WHERE user_id = $1 AND type = $2 AND used = false AND expires_at > NOW()
		ORDER BY created_at DESC
		LIMIT 1`, userID, otpType))
}

func (r *PostgresRepository) IncrementOTPAttempts(ctx context.Context, id uuid.UUID) (domain.OTPCode, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	return scanOTP(r.pool.QueryRow(ctx, `
		UPDATE otp_codes
		SET attempts = attempts + 1
		WHERE id = $1
		RETURNING id, user_id, code_hash, type, attempts, max_attempts, used, expires_at, created_at`, id))
}

func (r *PostgresRepository) MarkOTPUsed(ctx context.Context, id uuid.UUID) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	_, err := r.pool.Exec(ctx, `UPDATE otp_codes SET used = true WHERE id = $1`, id)
	return err
}

func (r *PostgresRepository) CheckAndIncrementRateLimit(ctx context.Context, userID uuid.UUID, otpType string) (int, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	var sentCount int16
	var windowStart time.Time
	err = tx.QueryRow(ctx, `
		SELECT sent_count, window_start
		FROM otp_rate_limits
		WHERE user_id = $1 AND type = $2
		FOR UPDATE`, userID, otpType).Scan(&sentCount, &windowStart)
	if errors.Is(err, pgx.ErrNoRows) {
		_, err = tx.Exec(ctx, `INSERT INTO otp_rate_limits (user_id, type) VALUES ($1, $2)`, userID, otpType)
		if err != nil {
			return 0, err
		}
		return 0, tx.Commit(ctx)
	}
	if err != nil {
		return 0, err
	}

	now := time.Now().UTC()
	if now.Sub(windowStart) >= time.Hour {
		_, err = tx.Exec(ctx, `UPDATE otp_rate_limits SET sent_count = 1, window_start = NOW() WHERE user_id = $1 AND type = $2`, userID, otpType)
		if err != nil {
			return 0, err
		}
		return 0, tx.Commit(ctx)
	}
	if sentCount >= 5 {
		retryAfter := int(time.Hour.Seconds() - now.Sub(windowStart).Seconds())
		if retryAfter < 1 {
			retryAfter = 1
		}
		return retryAfter, nil
	}
	_, err = tx.Exec(ctx, `UPDATE otp_rate_limits SET sent_count = sent_count + 1 WHERE user_id = $1 AND type = $2`, userID, otpType)
	if err != nil {
		return 0, err
	}
	return 0, tx.Commit(ctx)
}

func (r *PostgresRepository) CreatePasswordResetToken(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) (domain.PasswordResetToken, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	return scanReset(r.pool.QueryRow(ctx, `
		INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)
		RETURNING id, user_id, token_hash, used, expires_at, created_at`, userID, tokenHash, expiresAt))
}

func (r *PostgresRepository) GetPasswordResetToken(ctx context.Context, tokenHash string) (domain.PasswordResetToken, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	return scanReset(r.pool.QueryRow(ctx, `
		SELECT id, user_id, token_hash, used, expires_at, created_at
		FROM password_reset_tokens
		WHERE token_hash = $1 AND used = false AND expires_at > NOW()`, tokenHash))
}

func (r *PostgresRepository) MarkResetTokenUsed(ctx context.Context, id uuid.UUID) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	_, err := r.pool.Exec(ctx, `UPDATE password_reset_tokens SET used = true WHERE id = $1`, id)
	return err
}

func (r *PostgresRepository) InvalidateResetTokens(ctx context.Context, userID uuid.UUID) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	_, err := r.pool.Exec(ctx, `UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false`, userID)
	return err
}

func (r *PostgresRepository) Ping(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	return r.pool.Ping(ctx)
}

type scanner interface {
	Scan(dest ...any) error
}

func scanOTP(row scanner) (domain.OTPCode, error) {
	var code domain.OTPCode
	err := row.Scan(&code.ID, &code.UserID, &code.CodeHash, &code.Type, &code.Attempts, &code.MaxAttempts, &code.Used, &code.ExpiresAt, &code.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.OTPCode{}, apperr.New(http.StatusNotFound, apperr.CodeOTPNotFound, "Verification code was not found or has expired.")
		}
		return domain.OTPCode{}, err
	}
	return code, nil
}

func scanReset(row scanner) (domain.PasswordResetToken, error) {
	var reset domain.PasswordResetToken
	err := row.Scan(&reset.ID, &reset.UserID, &reset.TokenHash, &reset.Used, &reset.ExpiresAt, &reset.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.PasswordResetToken{}, apperr.New(http.StatusUnauthorized, apperr.CodeInvalidResetToken, "Reset token is invalid or expired.")
		}
		return domain.PasswordResetToken{}, err
	}
	return reset, nil
}
