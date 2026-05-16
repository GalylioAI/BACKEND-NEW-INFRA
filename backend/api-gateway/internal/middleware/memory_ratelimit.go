package middleware

import (
	"fmt"
	"sync"
	"time"
)

type memoryRateLimiter struct {
	mu   sync.Mutex
	hits map[string][]int64
}

func newMemoryRateLimiter() *memoryRateLimiter {
	return &memoryRateLimiter{hits: map[string][]int64{}}
}

func (m *memoryRateLimiter) allow(key string, limit routeLimit, now time.Time) (bool, int) {
	nowMS := now.UnixMilli()
	windowMS := int64(limit.Window / time.Millisecond)
	cutoff := nowMS - windowMS

	m.mu.Lock()
	defer m.mu.Unlock()

	timestamps := m.hits[key]
	filtered := timestamps[:0]
	for _, ts := range timestamps {
		if ts > cutoff {
			filtered = append(filtered, ts)
		}
	}
	if len(filtered) >= limit.Limit {
		retryAfter := int((filtered[0] + windowMS - nowMS + 999) / 1000)
		if retryAfter < 1 {
			retryAfter = 1
		}
		m.hits[key] = filtered
		return false, retryAfter
	}
	filtered = append(filtered, nowMS)
	m.hits[key] = filtered
	return true, 0
}

func memoryRateLimitKey(routeKey, ip string) string {
	return fmt.Sprintf("%s|%s", routeKey, ip)
}
