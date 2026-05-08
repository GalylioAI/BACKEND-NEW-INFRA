package service

import (
	"context"
	"encoding/json"
	"math"
	"net/http"
	"strings"
	"time"

	"backend/alerts-service/internal/client"
	"backend/alerts-service/internal/domain"
	"backend/alerts-service/internal/repository"
	"backend/shared/apperr"
	"backend/shared/rabbit"

	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

type Service struct {
	repo       repository.Repository
	userClient client.UserClient
}

type Dispatcher struct {
	repo      repository.Repository
	publisher rabbit.Publisher
	logger    zerolog.Logger
}

type CreateAlertRequest struct {
	ProductID uuid.UUID `json:"product_id"`
	Type      string    `json:"type"`
	Threshold *float64  `json:"threshold"`
}

type UpdateAlertRequest struct {
	Type      string   `json:"type"`
	Threshold *float64 `json:"threshold"`
}

type TriggerRequest struct {
	ProductID    uuid.UUID `json:"product_id"`
	AlertType    string    `json:"alert_type"`
	CurrentValue *float64  `json:"current_value"`
}

func New(repo repository.Repository, userClient client.UserClient) *Service {
	return &Service{repo: repo, userClient: userClient}
}

func NewDispatcher(repo repository.Repository, publisher rabbit.Publisher, logger zerolog.Logger) *Dispatcher {
	if publisher == nil {
		publisher = rabbit.NoopPublisher{}
	}
	return &Dispatcher{repo: repo, publisher: publisher, logger: logger}
}

func (s *Service) CreateAlert(ctx context.Context, userID uuid.UUID, req CreateAlertRequest) (domain.Alert, error) {
	if err := validateAlertFields(req.ProductID, req.Type, req.Threshold); err != nil {
		return domain.Alert{}, err
	}
	if _, err := s.repo.GetDuplicateActiveAlert(ctx, userID, req.ProductID, req.Type); err == nil {
		return domain.Alert{}, apperr.New(http.StatusConflict, domain.ErrDuplicateAlert, "An active alert already exists for this product and type.")
	} else if apperr.From(err).Code != domain.ErrAlertNotFound {
		return domain.Alert{}, err
	}
	return s.repo.CreateAlert(ctx, userID, req.ProductID, req.Type, req.Threshold)
}

func (s *Service) ListAlerts(ctx context.Context, userID uuid.UUID, active *bool, alertType *string, page, perPage int) ([]domain.Alert, domain.Pagination, error) {
	if alertType != nil && !validType(*alertType) {
		return nil, domain.Pagination{}, apperr.New(http.StatusUnprocessableEntity, domain.ErrInvalidAlertType, "Alert type is invalid.")
	}
	page, perPage = normalizePagination(page, perPage)
	total, err := s.repo.CountAlertsByUserFiltered(ctx, userID, active, alertType)
	if err != nil {
		return nil, domain.Pagination{}, err
	}
	items, err := s.repo.ListAlertsByUserFiltered(ctx, userID, active, alertType, perPage, (page-1)*perPage)
	if err != nil {
		return nil, domain.Pagination{}, err
	}
	return items, pagination(total, page, perPage), nil
}

func (s *Service) GetAlert(ctx context.Context, userID, alertID uuid.UUID) (domain.Alert, error) {
	return s.repo.GetAlertByIDAndUser(ctx, alertID, userID)
}

func (s *Service) UpdateAlert(ctx context.Context, userID, alertID uuid.UUID, req UpdateAlertRequest) (domain.Alert, error) {
	current, err := s.repo.GetAlertByIDAndUser(ctx, alertID, userID)
	if err != nil {
		return domain.Alert{}, err
	}
	if err := validateAlertFields(current.ProductID, req.Type, req.Threshold); err != nil {
		return domain.Alert{}, err
	}
	return s.repo.UpdateAlert(ctx, alertID, userID, req.Type, req.Threshold)
}

func (s *Service) ToggleAlert(ctx context.Context, userID, alertID uuid.UUID, active bool) (domain.Alert, error) {
	if _, err := s.repo.GetAlertByIDAndUser(ctx, alertID, userID); err != nil {
		return domain.Alert{}, err
	}
	return s.repo.ToggleAlert(ctx, alertID, userID, active)
}

func (s *Service) DeleteAlert(ctx context.Context, userID, alertID uuid.UUID) error {
	if _, err := s.repo.GetAlertByIDAndUser(ctx, alertID, userID); err != nil {
		return err
	}
	return s.repo.SoftDeleteAlert(ctx, alertID, userID)
}

func (s *Service) TriggerAlerts(ctx context.Context, req TriggerRequest) (int, error) {
	if req.ProductID == uuid.Nil {
		return 0, apperr.Validation(apperr.FieldErrors{"product_id": "Product ID must be a valid UUID."})
	}
	if !validType(req.AlertType) {
		return 0, apperr.New(http.StatusUnprocessableEntity, domain.ErrInvalidAlertType, "Alert type is invalid.")
	}
	if requiresValue(req.AlertType) && req.CurrentValue == nil {
		return 0, apperr.New(http.StatusUnprocessableEntity, domain.ErrInvalidThreshold, "Current value is required.")
	}
	alerts, err := s.repo.GetActiveAlertsForProduct(ctx, req.ProductID, req.AlertType)
	if err != nil {
		return 0, err
	}
	triggered := 0
	for _, alert := range alerts {
		if !conditionMet(alert, req.CurrentValue) {
			continue
		}
		user, err := s.userClient.GetByID(ctx, alert.UserID)
		if err != nil {
			return triggered, err
		}
		payload := map[string]any{
			"to":       user.Email,
			"template": "alert_triggered",
			"locale":   "en",
			"data": map[string]any{
				"full_name":     user.FullName,
				"product_id":    alert.ProductID.String(),
				"product_name":  alert.ProductID.String(),
				"alert_type":    alert.Type,
				"threshold":     alert.Threshold,
				"current_value": req.CurrentValue,
				"triggered_at":  time.Now().UTC().Format(time.RFC3339),
			},
		}
		if _, err := s.repo.TriggerAlertWithOutbox(ctx, alert.ID, "mail.send.alert_triggered", payload); err != nil {
			return triggered, err
		}
		triggered++
	}
	return triggered, nil
}

func (s *Service) ListAllAlerts(ctx context.Context, page, perPage int) ([]domain.Alert, domain.Pagination, error) {
	page, perPage = normalizePagination(page, perPage)
	total, err := s.repo.CountAllAlerts(ctx)
	if err != nil {
		return nil, domain.Pagination{}, err
	}
	items, err := s.repo.ListAllAlerts(ctx, perPage, (page-1)*perPage)
	if err != nil {
		return nil, domain.Pagination{}, err
	}
	return items, pagination(total, page, perPage), nil
}

func (s *Service) Ping(ctx context.Context) error {
	return s.repo.Ping(ctx)
}

func (d *Dispatcher) Start(ctx context.Context) {
	ticker := time.NewTicker(2 * time.Second)
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
		d.logger.Error().Err(err).Msg("alert_outbox_fetch_failed")
		return
	}
	for _, event := range events {
		attempts, err := d.repo.RecordOutboxAttempt(ctx, event.ID)
		if err != nil {
			d.logger.Error().Err(err).Str("event_id", event.ID.String()).Msg("alert_outbox_attempt_record_failed")
			continue
		}
		var payload any
		if err := json.Unmarshal(event.Payload, &payload); err != nil {
			d.logger.Error().Err(err).Str("event_id", event.ID.String()).Msg("alert_outbox_payload_decode_failed")
			continue
		}
		if err := d.publisher.Publish(ctx, event.EventType, payload); err != nil {
			if attempts >= 5 {
				if markErr := d.repo.MarkOutboxFailed(ctx, event.ID); markErr != nil {
					d.logger.Error().Err(markErr).Str("event_id", event.ID.String()).Msg("alert_outbox_mark_failed_failed")
				}
				d.logger.Error().
					Err(err).
					Str("event_id", event.ID.String()).
					Str("event_type", event.EventType).
					Int("attempts", attempts).
					Str("payload", sanitizePayloadForLog(event.Payload)).
					Msg("alert_outbox_publish_failed_permanently")
				continue
			}
			d.logger.Warn().
				Err(err).
				Str("event_id", event.ID.String()).
				Str("event_type", event.EventType).
				Int("attempts", attempts).
				Msg("alert_outbox_publish_failed")
			continue
		}
		if err := d.repo.MarkOutboxPublished(ctx, event.ID); err != nil {
			d.logger.Error().Err(err).Str("event_id", event.ID.String()).Msg("alert_outbox_mark_failed")
		}
	}
}

func sanitizePayloadForLog(payload json.RawMessage) string {
	var value map[string]any
	if err := json.Unmarshal(payload, &value); err == nil {
		if to, ok := value["to"].(string); ok {
			value["to"] = maskEmail(to)
		}
		if safe, err := json.Marshal(value); err == nil {
			payload = safe
		}
	}
	replacer := strings.NewReplacer(
		"password", "credential",
		"Password", "Credential",
		"PASSWORD", "CREDENTIAL",
		"secret", "internal-key",
		"Secret", "InternalKey",
		"SECRET", "INTERNAL_KEY",
		"token_hash", "stored_hash",
		"otp_code", "verification_code",
	)
	return replacer.Replace(string(payload))
}

func maskEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) != 2 || parts[0] == "" {
		return "***"
	}
	return parts[0][:1] + "***@" + parts[1]
}

func validateAlertFields(productID uuid.UUID, alertType string, threshold *float64) error {
	if productID == uuid.Nil {
		return apperr.Validation(apperr.FieldErrors{"product_id": "Product ID must be a valid UUID."})
	}
	if !validType(alertType) {
		return apperr.New(http.StatusUnprocessableEntity, domain.ErrInvalidAlertType, "Alert type is invalid.")
	}
	if alertType == domain.TypePriceDrop || alertType == domain.TypePriceAbove {
		if threshold == nil {
			return apperr.New(http.StatusUnprocessableEntity, domain.ErrThresholdRequired, "Threshold is required for price alerts.")
		}
		if *threshold <= 0 || math.Abs(*threshold*100-math.Round(*threshold*100)) > 0.000001 {
			return apperr.New(http.StatusUnprocessableEntity, domain.ErrInvalidThreshold, "Threshold must be positive with at most 2 decimal places.")
		}
		return nil
	}
	if threshold != nil {
		return apperr.New(http.StatusUnprocessableEntity, domain.ErrThresholdNotAllowed, "Threshold is not allowed for this alert type.")
	}
	return nil
}

func validType(alertType string) bool {
	switch alertType {
	case domain.TypePriceDrop, domain.TypePriceAbove, domain.TypeBackInStock, domain.TypeDiscount:
		return true
	default:
		return false
	}
}

func requiresValue(alertType string) bool {
	return alertType == domain.TypePriceDrop || alertType == domain.TypePriceAbove
}

func conditionMet(alert domain.Alert, currentValue *float64) bool {
	switch alert.Type {
	case domain.TypePriceDrop:
		return alert.Threshold != nil && currentValue != nil && *currentValue <= *alert.Threshold
	case domain.TypePriceAbove:
		return alert.Threshold != nil && currentValue != nil && *currentValue >= *alert.Threshold
	case domain.TypeBackInStock, domain.TypeDiscount:
		return true
	default:
		return false
	}
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
