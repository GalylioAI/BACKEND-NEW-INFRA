package service

import (
	"testing"

	"backend/alerts-service/internal/domain"
	"backend/shared/apperr"

	"github.com/google/uuid"
)

func TestValidatePriceAlertRequiresThreshold(t *testing.T) {
	err := validateAlertFields(uuid.New(), domain.TypePriceDrop, nil)
	if apperr.From(err).Code != domain.ErrThresholdRequired {
		t.Fatalf("expected threshold required, got %#v", apperr.From(err))
	}
}

func TestValidateBackInStockRejectsThreshold(t *testing.T) {
	threshold := 10.0
	err := validateAlertFields(uuid.New(), domain.TypeBackInStock, &threshold)
	if apperr.From(err).Code != domain.ErrThresholdNotAllowed {
		t.Fatalf("expected threshold not allowed, got %#v", apperr.From(err))
	}
}

func TestConditionMetForPriceDrop(t *testing.T) {
	threshold := 49.99
	current := 35.0
	if !conditionMet(domain.Alert{Type: domain.TypePriceDrop, Threshold: &threshold}, &current) {
		t.Fatal("expected price_drop to trigger when current value is below threshold")
	}
}
