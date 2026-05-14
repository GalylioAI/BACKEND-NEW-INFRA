package handler_test

import (
	"testing"

	"backend/user-service/internal/handler"
)

func TestRoutesRegisterWithoutPatternConflicts(t *testing.T) {
	defer func() {
		if recovered := recover(); recovered != nil {
			t.Fatalf("Routes panicked while registering patterns: %v", recovered)
		}
	}()

	_ = handler.New(nil, "secret").Routes()
}
