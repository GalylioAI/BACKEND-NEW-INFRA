package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"strings"
	"time"

	"backend/auth-service/internal/domain"
	"backend/shared/apperr"
	shareddb "backend/shared/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	CreateRefreshToken(ctx context.Context, userID uuid.UUID, tokenHash, deviceInfo string, ip net.IP, expiresAt time.Time, authTime time.Time, authMethods []string, sessionID uuid.UUID) error
	RotateRefreshToken(ctx context.Context, oldHash, newHash, deviceInfo string, ip net.IP, expiresAt time.Time) (domain.RefreshRecord, bool, error)
	RevokeRefreshToken(ctx context.Context, tokenHash string) error
	RevokeAllRefreshTokens(ctx context.Context, userID uuid.UUID) error
	RevokeOtherRefreshTokens(ctx context.Context, userID, sessionID uuid.UUID) error
	CreateAuditEvent(ctx context.Context, eventType string, userID uuid.UUID, ip net.IP, userAgent string, metadata any) error
	CreateTwoFactorSession(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) error
	ConsumeTwoFactorSession(ctx context.Context, tokenHash string) (uuid.UUID, error)
	Ping(ctx context.Context) error
}

func (r *PostgresRepository) CreateAuditEvent(ctx context.Context, eventType string, userID uuid.UUID, ip net.IP, userAgent string, metadata any) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	body, err := json.Marshal(metadata)
	if err != nil {
		return err
	}
	var nullableUser any
	if userID != uuid.Nil {
		nullableUser = userID
	}
	_, err = r.pool.Exec(ctx, `
		INSERT INTO audit_events (event_type, user_id, ip_address, user_agent, metadata)
		VALUES ($1, $2, $3, $4, $5)`, eventType, nullableUser, nullIP(ip), nullString(userAgent), string(body))
	return err
}

type PostgresRepository struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{pool: pool}
}

func (r *PostgresRepository) CreateRefreshToken(ctx context.Context, userID uuid.UUID, tokenHash, deviceInfo string, ip net.IP, expiresAt time.Time, authTime time.Time, authMethods []string, sessionID uuid.UUID) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO refresh_tokens (user_id, token_hash, device_info, ip_address, expires_at, auth_time, auth_methods, session_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, userID, tokenHash, nullString(deviceInfo), nullIP(ip), expiresAt, authTime.UTC(), encodeAuthMethods(authMethods), sessionID)
	return err
}

func (r *PostgresRepository) RotateRefreshToken(ctx context.Context, oldHash, newHash, deviceInfo string, ip net.IP, expiresAt time.Time) (domain.RefreshRecord, bool, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return domain.RefreshRecord{}, false, err
	}
	defer tx.Rollback(ctx)

	var record domain.RefreshRecord
	var authMethods string
	err = tx.QueryRow(ctx, `
		SELECT id, user_id, token_hash, revoked, expires_at, auth_time, auth_methods, session_id
		FROM refresh_tokens
		WHERE token_hash = $1
		FOR UPDATE`, oldHash).Scan(&record.ID, &record.UserID, &record.TokenHash, &record.Revoked, &record.ExpiresAt, &record.AuthTime, &authMethods, &record.SessionID)
	record.AuthMethods = decodeAuthMethods(authMethods)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.RefreshRecord{}, false, apperr.New(http.StatusUnauthorized, apperr.CodeInvalidRefreshToken, "Refresh token is invalid.")
		}
		return domain.RefreshRecord{}, false, err
	}
	if record.Revoked {
		if _, err := tx.Exec(ctx, `UPDATE refresh_tokens SET revoked = true WHERE user_id = $1`, record.UserID); err != nil {
			return record, true, err
		}
		_, _ = tx.Exec(ctx, `UPDATE refresh_tokens SET reused_at = NOW() WHERE id = $1 AND reused_at IS NULL`, record.ID)
		if err := tx.Commit(ctx); err != nil {
			return record, true, err
		}
		return record, true, apperr.New(http.StatusUnauthorized, apperr.CodeInvalidRefreshToken, "Refresh token is invalid.")
	}
	if time.Now().UTC().After(record.ExpiresAt) {
		return record, false, apperr.New(http.StatusUnauthorized, apperr.CodeInvalidRefreshToken, "Refresh token is invalid.")
	}
	if _, err := tx.Exec(ctx, `UPDATE refresh_tokens SET revoked = true, replaced_by_token_hash = $2 WHERE id = $1`, record.ID, newHash); err != nil {
		return domain.RefreshRecord{}, false, err
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO refresh_tokens (user_id, token_hash, device_info, ip_address, expires_at, auth_time, auth_methods, session_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, record.UserID, newHash, nullString(deviceInfo), nullIP(ip), expiresAt, record.AuthTime, encodeAuthMethods(record.AuthMethods), record.SessionID); err != nil {
		return domain.RefreshRecord{}, false, err
	}
	if err := tx.Commit(ctx); err != nil {
		return domain.RefreshRecord{}, false, err
	}
	return record, false, nil
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

func (r *PostgresRepository) RevokeOtherRefreshTokens(ctx context.Context, userID, sessionID uuid.UUID) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	_, err := r.pool.Exec(ctx, `UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND session_id <> $2`, userID, sessionID)
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

func encodeAuthMethods(methods []string) string {
	cleaned := make([]string, 0, len(methods))
	seen := map[string]struct{}{}
	for _, method := range methods {
		method = strings.TrimSpace(method)
		if method == "" {
			continue
		}
		if _, ok := seen[method]; ok {
			continue
		}
		seen[method] = struct{}{}
		cleaned = append(cleaned, method)
	}
	if len(cleaned) == 0 {
		return "password"
	}
	return strings.Join(cleaned, ",")
}

func decodeAuthMethods(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return []string{"password"}
	}
	out := []string{}
	for _, method := range strings.Split(raw, ",") {
		method = strings.TrimSpace(method)
		if method != "" {
			out = append(out, method)
		}
	}
	if len(out) == 0 {
		return []string{"password"}
	}
	return out
}

func (r *PostgresRepository) Ping(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	return r.pool.Ping(ctx)
}
