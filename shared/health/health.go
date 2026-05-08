package health

import (
	"context"
	"net/http"
	"sync/atomic"
	"time"

	"backend/shared/httpjson"
)

type Checker func(context.Context) error

type Readiness struct {
	ready atomic.Bool
}

func NewReadiness() *Readiness {
	return &Readiness{}
}

func (r *Readiness) MarkReady() {
	if r != nil {
		r.ready.Store(true)
	}
}

func (r *Readiness) MarkNotReady() {
	if r != nil {
		r.ready.Store(false)
	}
}

func (r *Readiness) IsReady() bool {
	if r == nil {
		return true
	}
	return r.ready.Load()
}

type Body struct {
	Status    string            `json:"status"`
	Checks    map[string]string `json:"checks"`
	Version   string            `json:"version"`
	Timestamp time.Time         `json:"timestamp"`
}

func Handler(version string, checks map[string]Checker) http.HandlerFunc {
	return ReadyHandler(version, nil, checks)
}

func ReadyHandler(version string, readiness *Readiness, checks map[string]Checker) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if readiness != nil && !readiness.IsReady() {
			httpjson.Write(w, r, http.StatusServiceUnavailable, map[string]any{
				"status":    "starting",
				"version":   version,
				"timestamp": time.Now().UTC(),
			})
			return
		}

		status := http.StatusOK
		body := Body{
			Status:    "ok",
			Checks:    map[string]string{},
			Version:   version,
			Timestamp: time.Now().UTC(),
		}
		for name, check := range checks {
			ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
			err := check(ctx)
			cancel()
			if err != nil {
				body.Checks[name] = "error"
				body.Status = "error"
				status = http.StatusServiceUnavailable
				continue
			}
			body.Checks[name] = "ok"
		}
		httpjson.Write(w, r, status, body)
	}
}
