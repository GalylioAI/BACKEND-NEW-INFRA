package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	sharedmw "backend/shared/middleware"
	"backend/shared/userctx"
)

func TestUserStatusCheckerAllowsVerifiedActiveUser(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get(sharedmw.HeaderInternalSecret); got != "secret" {
			t.Fatalf("expected internal secret, got %q", got)
		}
		if r.URL.Path != "/internal/users/status/user-1" {
			t.Fatalf("unexpected path %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"success":true,"data":{"id":"user-1","email":"fresh@example.com","role":"admin","is_verified":true,"is_banned":false}}`))
	}))
	defer upstream.Close()

	checker := NewUserStatusChecker(upstream.URL, "secret")
	called := false
	next := checker.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		if got := r.Header.Get(userctx.HeaderUserRole); got != "admin" {
			t.Fatalf("expected refreshed role admin, got %q", got)
		}
		if got := r.Header.Get(userctx.HeaderUserEmail); got != "fresh@example.com" {
			t.Fatalf("expected refreshed email, got %q", got)
		}
		w.WriteHeader(http.StatusNoContent)
	}))

	req := httptest.NewRequest(http.MethodGet, "/favorites", nil)
	req.Header.Set(userctx.HeaderUserID, "user-1")
	req.Header.Set(userctx.HeaderUserRole, "user")
	req.Header.Set(userctx.HeaderUserEmail, "stale@example.com")
	req.Header.Set("X-Request-Id", "req-1")
	rec := httptest.NewRecorder()

	next.ServeHTTP(rec, req)
	if !called {
		t.Fatal("expected downstream handler to be called")
	}
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected status 204, got %d", rec.Code)
	}
}

func TestUserStatusCheckerRejectsBannedUnverifiedAndMissingUsers(t *testing.T) {
	tests := []struct {
		name     string
		status   int
		body     string
		expected int
	}{
		{
			name:     "banned",
			status:   http.StatusOK,
			body:     `{"success":true,"data":{"id":"user-1","email":"user@example.com","role":"user","is_verified":true,"is_banned":true}}`,
			expected: http.StatusForbidden,
		},
		{
			name:     "unverified",
			status:   http.StatusOK,
			body:     `{"success":true,"data":{"id":"user-1","email":"user@example.com","role":"user","is_verified":false,"is_banned":false}}`,
			expected: http.StatusForbidden,
		},
		{
			name:     "missing",
			status:   http.StatusNotFound,
			body:     `{"success":false,"error":{"code":"NOT_FOUND","message":"not found"}}`,
			expected: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(tt.status)
				_, _ = w.Write([]byte(tt.body))
			}))
			defer upstream.Close()

			checker := NewUserStatusChecker(upstream.URL, "secret")
			next := checker.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				t.Fatal("downstream handler should not be called")
			}))

			req := httptest.NewRequest(http.MethodGet, "/favorites", nil)
			req.Header.Set(userctx.HeaderUserID, "user-1")
			req.Header.Set("X-Request-Id", "req-1")
			rec := httptest.NewRecorder()

			next.ServeHTTP(rec, req)
			if rec.Code != tt.expected {
				t.Fatalf("expected status %d, got %d: %s", tt.expected, rec.Code, rec.Body.String())
			}
		})
	}
}
