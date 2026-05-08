package domain

import (
	"time"

	"github.com/google/uuid"
)

type Favorite struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"-"`
	ProductID uuid.UUID `json:"product_id"`
	CreatedAt time.Time `json:"created_at"`
}

type PopularProduct struct {
	ProductID     uuid.UUID `json:"product_id"`
	FavoriteCount int64     `json:"favorite_count"`
}

type Pagination struct {
	Total      int64 `json:"total"`
	Page       int   `json:"page"`
	PerPage    int   `json:"per_page"`
	TotalPages int   `json:"total_pages"`
	HasNext    bool  `json:"has_next"`
	HasPrev    bool  `json:"has_prev"`
}
