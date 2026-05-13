package service

import (
	"context"
	"encoding/json"
	"time"

	"backend/shared/rabbit"
	"backend/user-service/internal/repository"

	"github.com/rs/zerolog"
)

type OutboxRepository interface {
	PendingOutbox(ctx context.Context, limit int) ([]repository.OutboxEvent, error)
	MarkOutboxPublished(ctx context.Context, id [16]byte) error
}

type Dispatcher struct {
	repo      *repository.PostgresRepository
	publisher rabbit.Publisher
	logger    zerolog.Logger
}

func NewDispatcher(repo *repository.PostgresRepository, publisher rabbit.Publisher, logger zerolog.Logger) *Dispatcher {
	return &Dispatcher{repo: repo, publisher: publisher, logger: logger}
}

func (d *Dispatcher) Start(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			d.flush(ctx)
		}
	}
}

func (d *Dispatcher) flush(ctx context.Context) {
	events, err := d.repo.PendingOutbox(ctx, 50)
	if err != nil {
		d.logger.Error().Err(err).Msg("outbox_fetch_failed")
		return
	}
	for _, event := range events {
		var payload any
		if err := json.Unmarshal(event.Payload, &payload); err != nil {
			d.logger.Error().Err(err).Str("event_id", event.ID.String()).Msg("outbox_payload_decode_failed")
			continue
		}
		if err := d.publisher.Publish(ctx, event.EventType, payload); err != nil {
			d.logger.Warn().Err(err).Str("event_id", event.ID.String()).Str("event_type", event.EventType).Msg("outbox_publish_failed")
			continue
		}
		if err := d.repo.MarkOutboxPublished(ctx, event.ID); err != nil {
			d.logger.Error().Err(err).Str("event_id", event.ID.String()).Msg("outbox_mark_failed")
		}
	}
}
