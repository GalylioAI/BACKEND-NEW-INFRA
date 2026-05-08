package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

const (
	TypePriceDrop   = "price_drop"
	TypePriceAbove  = "price_above"
	TypeBackInStock = "back_in_stock"
	TypeDiscount    = "discount"
)

type Alert struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"-"`
	ProductID   uuid.UUID  `json:"product_id"`
	Type        string     `json:"type"`
	Threshold   *float64   `json:"threshold,omitempty"`
	IsActive    bool       `json:"is_active"`
	TriggeredAt *time.Time `json:"triggered_at,omitempty"`
	DeletedAt   *time.Time `json:"deleted_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type Pagination struct {
	Total      int64 `json:"total"`
	Page       int   `json:"page"`
	PerPage    int   `json:"per_page"`
	TotalPages int   `json:"total_pages"`
	HasNext    bool  `json:"has_next"`
	HasPrev    bool  `json:"has_prev"`
}

type OutboxEvent struct {
	ID              uuid.UUID
	AlertID         uuid.UUID
	EventType       string
	Payload         json.RawMessage
	Published       bool
	PublishAttempts int
	LastAttemptAt   *time.Time
	Failed          bool
	CreatedAt       time.Time
}
