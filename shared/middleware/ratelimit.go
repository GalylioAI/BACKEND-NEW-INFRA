package middleware

import (
	"net"
	"net/http"
	"sync"
	"time"

	"backend/shared/apperr"
	"backend/shared/httpjson"
)

type RateLimiter struct {
	mu      sync.Mutex
	limits  map[string]*bucket
	max     int
	window  time.Duration
	nowFunc func() time.Time
}

type bucket struct {
	count     int
	resetTime time.Time
}

func NewRateLimiter(max int, window time.Duration) *RateLimiter {
	return &RateLimiter{limits: map[string]*bucket{}, max: max, window: window, nowFunc: time.Now}
}

func (l *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		key := clientIP(r)
		if !l.allow(key) {
			httpjson.WriteError(w, r, apperr.New(http.StatusTooManyRequests, apperr.CodeRateLimited, "Too many requests. Please try again later."))
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (l *RateLimiter) allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := l.nowFunc()
	entry := l.limits[key]
	if entry == nil || now.After(entry.resetTime) {
		l.limits[key] = &bucket{count: 1, resetTime: now.Add(l.window)}
		return true
	}
	if entry.count >= l.max {
		return false
	}
	entry.count++
	return true
}

func clientIP(r *http.Request) string {
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		host, _, _ := net.SplitHostPort(forwarded)
		if host != "" {
			return host
		}
		return forwarded
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
