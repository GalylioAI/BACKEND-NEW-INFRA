package middleware

import (
	"context"
	"fmt"
	"math"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog"
)

const slidingWindowLua = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)

if count < limit then
  redis.call('ZADD', key, now, now .. '-' .. math.random())
  redis.call('EXPIRE', key, math.ceil(window / 1000))
  return 0
end

return redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')[2]
`

type RateLimiter struct {
	client          *redis.Client
	logger          zerolog.Logger
	script          *redis.Script
	trustedProxyNet []*net.IPNet
	limits          RateLimitConfig
}

type routeLimit struct {
	Limit  int
	Window time.Duration
}

func RouteLimit(limit int, window time.Duration) routeLimit {
	return routeLimit{Limit: limit, Window: window}
}

type RateLimitConfig struct {
	Default routeLimit
	Login   routeLimit
	OTP     routeLimit
}

func DefaultRateLimitConfig() RateLimitConfig {
	return RateLimitConfig{
		Default: routeLimit{Limit: 60, Window: time.Minute},
		Login:   routeLimit{Limit: 5, Window: time.Minute},
		OTP:     routeLimit{Limit: 3, Window: time.Minute},
	}
}

func NewRateLimiter(client *redis.Client, logger zerolog.Logger, trustedProxyCIDRs []string) *RateLimiter {
	return NewRateLimiterWithConfig(client, logger, trustedProxyCIDRs, DefaultRateLimitConfig())
}

func NewRateLimiterWithConfig(client *redis.Client, logger zerolog.Logger, trustedProxyCIDRs []string, limits RateLimitConfig) *RateLimiter {
	defaults := DefaultRateLimitConfig()
	if limits.Default.Limit <= 0 || limits.Default.Window <= 0 {
		limits.Default = defaults.Default
	}
	if limits.Login.Limit <= 0 || limits.Login.Window <= 0 {
		limits.Login = defaults.Login
	}
	if limits.OTP.Limit <= 0 || limits.OTP.Window <= 0 {
		limits.OTP = defaults.OTP
	}
	return &RateLimiter{
		client:          client,
		logger:          logger,
		script:          redis.NewScript(slidingWindowLua),
		trustedProxyNet: parseTrustedProxyCIDRs(trustedProxyCIDRs),
		limits:          limits,
	}
}

func (r *RateLimiter) Middleware(routeKey string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			if r == nil || r.client == nil {
				next.ServeHTTP(w, req)
				return
			}
			limit := r.limitForRoute(routeKey)
			allowed, retryAfter, err := r.allow(req.Context(), routeKey, r.clientIP(req), limit)
			if err != nil {
				r.logger.Warn().
					Str("request_id", req.Header.Get("X-Request-Id")).
					Str("route", routeKey).
					Err(err).
					Msg("redis rate limiter unavailable; allowing request")
				next.ServeHTTP(w, req)
				return
			}
			if !allowed {
				w.Header().Set("Retry-After", strconv.Itoa(retryAfter))
				writeRateLimit(w, req, retryAfter)
				return
			}
			next.ServeHTTP(w, req)
		})
	}
}

func (r *RateLimiter) allow(ctx context.Context, routeKey, ip string, limit routeLimit) (bool, int, error) {
	now := time.Now().UTC()
	nowMS := now.UnixMilli()
	windowMS := int64(limit.Window / time.Millisecond)
	key := fmt.Sprintf("ratelimit:%s:%s", routeKey, ip)

	redisCtx, cancel := context.WithTimeout(ctx, 500*time.Millisecond)
	defer cancel()
	result, err := r.script.Run(redisCtx, r.client, []string{key}, nowMS, windowMS, limit.Limit).Result()
	if err != nil {
		return true, 0, err
	}
	earliest, err := parseRedisNumber(result)
	if err != nil {
		return true, 0, err
	}
	if earliest == 0 {
		return true, 0, nil
	}
	retryAfter := int(math.Ceil(float64(earliest+windowMS-nowMS) / 1000))
	if retryAfter < 1 {
		retryAfter = 1
	}
	return false, retryAfter, nil
}

func parseRedisNumber(value any) (int64, error) {
	switch v := value.(type) {
	case int64:
		return v, nil
	case int:
		return int64(v), nil
	case float64:
		return int64(v), nil
	case string:
		if v == "" {
			return 0, nil
		}
		return strconv.ParseInt(v, 10, 64)
	case []byte:
		if len(v) == 0 {
			return 0, nil
		}
		return strconv.ParseInt(string(v), 10, 64)
	default:
		return 0, fmt.Errorf("unexpected redis result type %T", value)
	}
}

func limitForRoute(routeKey string) routeLimit {
	return DefaultRateLimitConfig().limitForRoute(routeKey)
}

func (r *RateLimiter) limitForRoute(routeKey string) routeLimit {
	if r == nil {
		return limitForRoute(routeKey)
	}
	return r.limits.limitForRoute(routeKey)
}

func (c RateLimitConfig) limitForRoute(routeKey string) routeLimit {
	switch routeKey {
	case "POST /auth/login", "POST /auth/google":
		return c.Login
	case "POST /users/signup",
		"POST /otp/email/send",
		"POST /otp/email/verify",
		"POST /otp/2fa/enable",
		"POST /otp/2fa/disable",
		"POST /otp/2fa/login/verify",
		"POST /otp/2fa/enable/verify",
		"POST /otp/2fa/disable/verify",
		"POST /otp/password-reset/send",
		"POST /otp/password-reset/verify",
		"POST /otp/password-reset/apply":
		return c.OTP
	default:
		return c.Default
	}
}

func (r *RateLimiter) clientIP(req *http.Request) string {
	host, _, err := net.SplitHostPort(req.RemoteAddr)
	if err != nil {
		host = req.RemoteAddr
	}
	if r.trustedProxyIP(host) {
		forwarded := req.Header.Get("X-Forwarded-For")
		if forwarded != "" {
			first := strings.TrimSpace(strings.Split(forwarded, ",")[0])
			forwardedHost, _, err := net.SplitHostPort(first)
			if err == nil {
				return forwardedHost
			}
			return first
		}
	}
	return host
}

func (r *RateLimiter) trustedProxyIP(host string) bool {
	ip := net.ParseIP(host)
	if ip == nil {
		return false
	}
	for _, network := range r.trustedProxyNet {
		if network.Contains(ip) {
			return true
		}
	}
	return false
}

func parseTrustedProxyCIDRs(values []string) []*net.IPNet {
	if len(values) == 0 {
		values = []string{"127.0.0.1/32", "::1/128"}
	}
	networks := make([]*net.IPNet, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value == "" {
			continue
		}
		if ip := net.ParseIP(value); ip != nil {
			bits := 32
			if ip.To4() == nil {
				bits = 128
			}
			networks = append(networks, &net.IPNet{IP: ip, Mask: net.CIDRMask(bits, bits)})
			continue
		}
		if _, network, err := net.ParseCIDR(value); err == nil {
			networks = append(networks, network)
		}
	}
	if len(networks) == 0 {
		return parseTrustedProxyCIDRs(nil)
	}
	return networks
}
