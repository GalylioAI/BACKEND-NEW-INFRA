package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"backend/alerts-service/internal/domain"
	"backend/shared/apperr"
	shareddb "backend/shared/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	CreateAlert(ctx context.Context, userID, productID uuid.UUID, alertType string, threshold *float64) (domain.Alert, error)
	GetAlertByID(ctx context.Context, id uuid.UUID) (domain.Alert, error)
	GetAlertByIDAndUser(ctx context.Context, id, userID uuid.UUID) (domain.Alert, error)
	GetDuplicateActiveAlert(ctx context.Context, userID, productID uuid.UUID, alertType string) (domain.Alert, error)
	ListAlertsByUserFiltered(ctx context.Context, userID uuid.UUID, active *bool, alertType *string, limit, offset int) ([]domain.Alert, error)
	CountAlertsByUserFiltered(ctx context.Context, userID uuid.UUID, active *bool, alertType *string) (int64, error)
	UpdateAlert(ctx context.Context, id, userID uuid.UUID, alertType string, threshold *float64) (domain.Alert, error)
	ToggleAlert(ctx context.Context, id, userID uuid.UUID, active bool) (domain.Alert, error)
	SoftDeleteAlert(ctx context.Context, id, userID uuid.UUID) error
	GetActiveAlertsForProduct(ctx context.Context, productID uuid.UUID, alertType string) ([]domain.Alert, error)
	TriggerAlertWithOutbox(ctx context.Context, alertID uuid.UUID, eventType string, payload any) (domain.Alert, error)
	ListAllAlerts(ctx context.Context, limit, offset int) ([]domain.Alert, error)
	CountAllAlerts(ctx context.Context) (int64, error)
	PendingOutbox(ctx context.Context, limit int) ([]domain.OutboxEvent, error)
	RecordOutboxAttempt(ctx context.Context, id uuid.UUID) (int, error)
	MarkOutboxFailed(ctx context.Context, id uuid.UUID) error
	MarkOutboxPublished(ctx context.Context, id uuid.UUID) error
	Ping(ctx context.Context) error
}

type PostgresRepository struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{pool: pool}
}

func (r *PostgresRepository) CreateAlert(ctx context.Context, userID, productID uuid.UUID, alertType string, threshold *float64) (domain.Alert, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	return scanAlert(r.pool.QueryRow(ctx, `
		INSERT INTO alerts (user_id, product_id, type, threshold)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, product_id, type, threshold, is_active, triggered_at, deleted_at, created_at, updated_at`,
		userID, productID, alertType, threshold))
}

func (r *PostgresRepository) GetAlertByID(ctx context.Context, id uuid.UUID) (domain.Alert, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	return scanAlert(r.pool.QueryRow(ctx, selectAlertSQL+` WHERE id = $1 AND deleted_at IS NULL LIMIT 1`, id))
}

func (r *PostgresRepository) GetAlertByIDAndUser(ctx context.Context, id, userID uuid.UUID) (domain.Alert, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	return scanAlert(r.pool.QueryRow(ctx, selectAlertSQL+` WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL LIMIT 1`, id, userID))
}

func (r *PostgresRepository) GetDuplicateActiveAlert(ctx context.Context, userID, productID uuid.UUID, alertType string) (domain.Alert, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	return scanAlert(r.pool.QueryRow(ctx, selectAlertSQL+`
		WHERE user_id = $1 AND product_id = $2 AND type = $3 AND is_active = true AND deleted_at IS NULL
		LIMIT 1`, userID, productID, alertType))
}

func (r *PostgresRepository) ListAlertsByUserFiltered(ctx context.Context, userID uuid.UUID, active *bool, alertType *string, limit, offset int) ([]domain.Alert, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	rows, err := r.pool.Query(ctx, selectAlertSQL+`
		WHERE user_id = $1
		  AND deleted_at IS NULL
		  AND ($2::boolean IS NULL OR is_active = $2)
		  AND ($3::varchar IS NULL OR type = $3)
		ORDER BY created_at DESC
		LIMIT $4 OFFSET $5`, userID, active, alertType, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanAlerts(rows)
}

func (r *PostgresRepository) CountAlertsByUserFiltered(ctx context.Context, userID uuid.UUID, active *bool, alertType *string) (int64, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	var total int64
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM alerts
		WHERE user_id = $1
		  AND deleted_at IS NULL
		  AND ($2::boolean IS NULL OR is_active = $2)
		  AND ($3::varchar IS NULL OR type = $3)`, userID, active, alertType).Scan(&total)
	return total, err
}

func (r *PostgresRepository) UpdateAlert(ctx context.Context, id, userID uuid.UUID, alertType string, threshold *float64) (domain.Alert, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	return scanAlert(r.pool.QueryRow(ctx, `
		UPDATE alerts
		SET type = $2, threshold = $3, updated_at = NOW()
		WHERE id = $1 AND user_id = $4 AND deleted_at IS NULL
		RETURNING id, user_id, product_id, type, threshold, is_active, triggered_at, deleted_at, created_at, updated_at`,
		id, alertType, threshold, userID))
}

func (r *PostgresRepository) ToggleAlert(ctx context.Context, id, userID uuid.UUID, active bool) (domain.Alert, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	return scanAlert(r.pool.QueryRow(ctx, `
		UPDATE alerts
		SET is_active = $2,
		    triggered_at = CASE WHEN $2 THEN NULL ELSE triggered_at END,
		    updated_at = NOW()
		WHERE id = $1 AND user_id = $3 AND deleted_at IS NULL
		RETURNING id, user_id, product_id, type, threshold, is_active, triggered_at, deleted_at, created_at, updated_at`,
		id, active, userID))
}

func (r *PostgresRepository) SoftDeleteAlert(ctx context.Context, id, userID uuid.UUID) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	result, err := r.pool.Exec(ctx, `
		UPDATE alerts
		SET deleted_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`, id, userID)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return alertNotFound()
	}
	return nil
}

func (r *PostgresRepository) GetActiveAlertsForProduct(ctx context.Context, productID uuid.UUID, alertType string) ([]domain.Alert, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	rows, err := r.pool.Query(ctx, selectAlertSQL+`
		WHERE product_id = $1 AND type = $2 AND is_active = true AND deleted_at IS NULL`, productID, alertType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanAlerts(rows)
}

func (r *PostgresRepository) TriggerAlertWithOutbox(ctx context.Context, alertID uuid.UUID, eventType string, payload any) (domain.Alert, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return domain.Alert{}, err
	}
	defer tx.Rollback(ctx)
	alert, err := scanAlert(tx.QueryRow(ctx, `
		UPDATE alerts
		SET is_active = false, triggered_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
		RETURNING id, user_id, product_id, type, threshold, is_active, triggered_at, deleted_at, created_at, updated_at`, alertID))
	if err != nil {
		return domain.Alert{}, err
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return domain.Alert{}, err
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO alert_outbox (alert_id, event_type, payload)
		VALUES ($1, $2, $3)`, alertID, eventType, body); err != nil {
		return domain.Alert{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return domain.Alert{}, err
	}
	return alert, nil
}

func (r *PostgresRepository) ListAllAlerts(ctx context.Context, limit, offset int) ([]domain.Alert, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	rows, err := r.pool.Query(ctx, selectAlertSQL+`
		WHERE deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanAlerts(rows)
}

func (r *PostgresRepository) CountAllAlerts(ctx context.Context) (int64, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	var total int64
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM alerts WHERE deleted_at IS NULL`).Scan(&total)
	return total, err
}

func (r *PostgresRepository) PendingOutbox(ctx context.Context, limit int) ([]domain.OutboxEvent, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	rows, err := r.pool.Query(ctx, `
		SELECT id, alert_id, event_type, payload, published, publish_attempts, last_attempt_at, failed, created_at
		FROM alert_outbox
		WHERE published = false
		  AND failed = false
		  AND created_at < NOW() - INTERVAL '2 seconds'
		ORDER BY created_at
		LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	events := []domain.OutboxEvent{}
	for rows.Next() {
		var event domain.OutboxEvent
		var lastAttemptAt sql.NullTime
		if err := rows.Scan(&event.ID, &event.AlertID, &event.EventType, &event.Payload, &event.Published, &event.PublishAttempts, &lastAttemptAt, &event.Failed, &event.CreatedAt); err != nil {
			return nil, err
		}
		if lastAttemptAt.Valid {
			event.LastAttemptAt = &lastAttemptAt.Time
		}
		events = append(events, event)
	}
	return events, rows.Err()
}

func (r *PostgresRepository) RecordOutboxAttempt(ctx context.Context, id uuid.UUID) (int, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	var attempts int
	err := r.pool.QueryRow(ctx, `
		UPDATE alert_outbox
		SET publish_attempts = publish_attempts + 1,
		    last_attempt_at = NOW()
		WHERE id = $1 AND published = false AND failed = false
		RETURNING publish_attempts`, id).Scan(&attempts)
	return attempts, err
}

func (r *PostgresRepository) MarkOutboxFailed(ctx context.Context, id uuid.UUID) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	_, err := r.pool.Exec(ctx, `UPDATE alert_outbox SET failed = true WHERE id = $1`, id)
	return err
}

func (r *PostgresRepository) MarkOutboxPublished(ctx context.Context, id uuid.UUID) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	_, err := r.pool.Exec(ctx, `UPDATE alert_outbox SET published = true WHERE id = $1`, id)
	return err
}

func (r *PostgresRepository) Ping(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	return r.pool.Ping(ctx)
}

const selectAlertSQL = `
SELECT id, user_id, product_id, type, threshold, is_active, triggered_at, deleted_at, created_at, updated_at
FROM alerts`

type scanner interface {
	Scan(dest ...any) error
}

func scanAlert(row scanner) (domain.Alert, error) {
	var alert domain.Alert
	var threshold sql.NullFloat64
	var triggeredAt, deletedAt sql.NullTime
	err := row.Scan(&alert.ID, &alert.UserID, &alert.ProductID, &alert.Type, &threshold, &alert.IsActive, &triggeredAt, &deletedAt, &alert.CreatedAt, &alert.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Alert{}, alertNotFound()
		}
		return domain.Alert{}, err
	}
	if threshold.Valid {
		value := threshold.Float64
		alert.Threshold = &value
	}
	if triggeredAt.Valid {
		alert.TriggeredAt = &triggeredAt.Time
	}
	if deletedAt.Valid {
		alert.DeletedAt = &deletedAt.Time
	}
	return alert, nil
}

func scanAlerts(rows pgx.Rows) ([]domain.Alert, error) {
	items := []domain.Alert{}
	for rows.Next() {
		alert, err := scanAlert(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, alert)
	}
	return items, rows.Err()
}

func alertNotFound() error {
	return apperr.New(http.StatusNotFound, domain.ErrAlertNotFound, "Alert was not found.")
}
