package service

import (
	"context"
	"encoding/json"
	"time"

	"backend/shared/rabbit"

	"github.com/google/uuid"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/rs/zerolog"
)

type UserCreatedConsumer struct {
	service *Service
	ch      *amqp.Channel
	logger  zerolog.Logger
}

type eventEnvelope struct {
	EventID   string          `json:"event_id"`
	EventType string          `json:"event_type"`
	Timestamp time.Time       `json:"timestamp"`
	Payload   json.RawMessage `json:"payload"`
}

type userCreatedPayload struct {
	UserID   string `json:"user_id"`
	Email    string `json:"email"`
	FullName string `json:"full_name"`
}

func NewUserCreatedConsumer(service *Service, ch *amqp.Channel, logger zerolog.Logger) *UserCreatedConsumer {
	return &UserCreatedConsumer{service: service, ch: ch, logger: logger}
}

func (c *UserCreatedConsumer) Start(ctx context.Context) error {
	if c == nil || c.ch == nil {
		return nil
	}
	if err := rabbit.DeclareExchange(c.ch); err != nil {
		return err
	}
	queue, err := rabbit.DeclareBoundQueue(c.ch, "otp.user.created", "user.created")
	if err != nil {
		return err
	}
	if err := c.ch.Qos(1, 0, false); err != nil {
		return err
	}
	deliveries, err := c.ch.Consume(queue.Name, "", false, false, false, false, nil)
	if err != nil {
		return err
	}
	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case delivery, ok := <-deliveries:
				if !ok {
					return
				}
				c.handle(ctx, delivery)
			}
		}
	}()
	return nil
}

func (c *UserCreatedConsumer) handle(ctx context.Context, delivery amqp.Delivery) {
	var envelope eventEnvelope
	if err := json.Unmarshal(delivery.Body, &envelope); err != nil {
		c.logger.Error().Err(err).Msg("user_created_decode_failed")
		_ = delivery.Nack(false, false)
		return
	}
	var payload userCreatedPayload
	if err := json.Unmarshal(envelope.Payload, &payload); err != nil {
		c.logger.Error().Err(err).Str("event_id", envelope.EventID).Msg("user_created_payload_decode_failed")
		_ = delivery.Nack(false, false)
		return
	}
	userID, err := uuid.Parse(payload.UserID)
	if err != nil {
		c.logger.Error().Err(err).Str("event_id", envelope.EventID).Msg("user_created_invalid_user_id")
		_ = delivery.Nack(false, false)
		return
	}
	if err := c.service.AutoSendEmailVerification(ctx, userID); err != nil {
		c.logger.Warn().Err(err).Str("event_id", envelope.EventID).Msg("email_verify_auto_send_failed")
		_ = delivery.Nack(false, true)
		return
	}
	_ = delivery.Ack(false)
	c.logger.Info().Str("event_id", envelope.EventID).Msg("email_verify_auto_send_queued")
}
