package repository

import (
	"context"
	"encoding/json"
	"time"

	shareddb "backend/shared/db"

	"github.com/google/uuid"
)

type OutboxEvent struct {
	ID        uuid.UUID
	EventType string
	Payload   json.RawMessage
	CreatedAt time.Time
}

func (r *PostgresRepository) PendingOutbox(ctx context.Context, limit int) ([]OutboxEvent, error) {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	rows, err := r.pool.Query(ctx, `
		WITH claim AS (
			SELECT id
			FROM outbox_events
			WHERE published_at IS NULL
			  AND (claimed_at IS NULL OR claimed_at < NOW() - INTERVAL '5 minutes')
			ORDER BY created_at
			LIMIT $1
			FOR UPDATE SKIP LOCKED
		)
		UPDATE outbox_events o
		SET claimed_at = NOW(), claimed_by = 'user-service'
		FROM claim
		WHERE o.id = claim.id
		RETURNING o.id, o.event_type, o.payload, o.created_at`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	events := []OutboxEvent{}
	for rows.Next() {
		var event OutboxEvent
		if err := rows.Scan(&event.ID, &event.EventType, &event.Payload, &event.CreatedAt); err != nil {
			return nil, err
		}
		events = append(events, event)
	}
	return events, rows.Err()
}

func (r *PostgresRepository) MarkOutboxPublished(ctx context.Context, id uuid.UUID) error {
	ctx, cancel := shareddb.Timeout(ctx)
	defer cancel()
	_, err := r.pool.Exec(ctx, `UPDATE outbox_events SET published_at = NOW(), processed_at = NOW(), claimed_at = NULL, claimed_by = NULL WHERE id = $1`, id)
	return err
}
