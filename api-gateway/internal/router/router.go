package router

import (
	"context"
	"net/http"
	"sync"
	"time"

	"backend/api-gateway/internal/config"
	apidocs "backend/api-gateway/internal/docs"
	gwmw "backend/api-gateway/internal/middleware"
	"backend/api-gateway/internal/proxy"
	"backend/shared/httpjson"
	sharedmw "backend/shared/middleware"
	"backend/shared/userctx"

	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog"
)

type Router struct {
	cfg       config.Config
	logger    zerolog.Logger
	rateLimit *gwmw.RateLimiter
	userCheck *gwmw.UserStatusChecker
	redis     *redis.Client
}

func New(cfg config.Config, logger zerolog.Logger, redisClient *redis.Client) http.Handler {
	router := &Router{
		cfg:    cfg,
		logger: logger,
		redis:  redisClient,
		rateLimit: gwmw.NewRateLimiterWithConfig(redisClient, logger, cfg.TrustedProxyCIDRs, gwmw.RateLimitConfig{
			Default: gwmw.RouteLimit(cfg.RateLimitDefaultLimit, cfg.RateLimitDefaultWindow),
			Login:   gwmw.RouteLimit(cfg.RateLimitLoginLimit, cfg.RateLimitLoginWindow),
			OTP:     gwmw.RouteLimit(cfg.RateLimitOTPLimit, cfg.RateLimitOTPWindow),
		}),
		userCheck: gwmw.NewUserStatusChecker(cfg.UserServiceURL, cfg.InternalSecret),
	}
	return router.routes()
}

func (r *Router) routes() http.Handler {
	mux := http.NewServeMux()
	auth := proxy.NewServiceProxy(r.cfg.AuthServiceURL, r.cfg.InternalSecret, r.logger)
	user := proxy.NewServiceProxy(r.cfg.UserServiceURL, r.cfg.InternalSecret, r.logger)
	otp := proxy.NewServiceProxy(r.cfg.OTPServiceURL, r.cfg.InternalSecret, r.logger)
	favorites := proxy.NewServiceProxy(r.cfg.FavoritesServiceURL, r.cfg.InternalSecret, r.logger)
	alerts := proxy.NewServiceProxy(r.cfg.AlertsServiceURL, r.cfg.InternalSecret, r.logger)

	mux.HandleFunc("GET /health", r.health)
	if r.cfg.DocsEnabled {
		apidocs.Register(mux)
	}

	r.public(mux, "POST /auth/login", auth)
	r.public(mux, "POST /auth/google", auth)
	r.public(mux, "POST /auth/refresh", auth)
	r.public(mux, "POST /auth/logout", auth)
	r.public(mux, "POST /users/signup", user)
	r.public(mux, "GET /gouvernorats", user)
	r.public(mux, "POST /otp/email/send", otp)
	r.public(mux, "POST /otp/email/verify", otp)
	r.public(mux, "POST /otp/password-reset/send", otp)
	r.public(mux, "POST /otp/password-reset/verify", otp)
	r.public(mux, "POST /otp/password-reset/apply", otp)
	r.public(mux, "POST /otp/2fa/login/verify", otp)

	r.authenticated(mux, "POST /auth/logout-all", auth)
	r.authenticated(mux, "GET /users/me", user)
	r.authenticated(mux, "PUT /users/me", user)
	r.authenticated(mux, "PUT /users/me/password", user)
	r.authenticated(mux, "POST /users/me/password/set", user)
	r.authenticated(mux, "DELETE /users/me", user)
	r.authenticated(mux, "POST /otp/2fa/enable", otp)
	r.authenticated(mux, "POST /otp/2fa/disable", otp)
	r.authenticated(mux, "POST /otp/2fa/enable/verify", otp)
	r.authenticated(mux, "POST /otp/2fa/disable/verify", otp)

	r.authenticated(mux, "POST /favorites", favorites)
	r.authenticated(mux, "GET /favorites", favorites)
	r.authenticated(mux, "DELETE /favorites/all", favorites)
	r.authenticated(mux, "GET /favorites/{product_id}", favorites)
	r.authenticated(mux, "DELETE /favorites/{product_id}", favorites)

	r.authenticated(mux, "POST /alerts", alerts)
	r.authenticated(mux, "GET /alerts", alerts)
	r.authenticated(mux, "GET /alerts/{id}", alerts)
	r.authenticated(mux, "PUT /alerts/{id}", alerts)
	r.authenticated(mux, "DELETE /alerts/{id}", alerts)
	r.authenticated(mux, "PUT /alerts/{id}/toggle", alerts)

	r.admin(mux, "GET /users", user, "admin", "superadmin")
	r.admin(mux, "GET /users/{id}", user, "admin", "superadmin")
	r.adminMin(mux, "PUT /users/{id}/ban", user, "admin")
	r.admin(mux, "PUT /users/{id}/role", user, "superadmin")
	r.adminMin(mux, "DELETE /users/{id}", user, "admin")
	r.admin(mux, "GET /admin/favorites/popular", favorites, "admin", "superadmin")
	r.admin(mux, "GET /admin/alerts", alerts, "admin", "superadmin")

	return chain(mux,
		sharedmw.Recovery(r.logger),
		gwmw.StripSensitiveHeaders,
		gwmw.RequestID,
		gwmw.SecurityHeaders,
		gwmw.CORS(gwmw.CORSConfig{
			AllowedOrigins:   r.cfg.AllowedOrigins,
			AllowedMethods:   r.cfg.AllowedMethods,
			AllowedHeaders:   r.cfg.AllowedHeaders,
			AllowCredentials: r.cfg.CORSAllowCredentials,
			MaxAge:           r.cfg.CORSMaxAge,
		}),
		gwmw.Timeout(r.cfg.RequestTimeout),
		gwmw.Logger(r.logger),
		gwmw.BodySizeLimit(r.cfg.BodyLimitBytes),
		gwmw.RequireAllowedOrigin(r.cfg.AllowedOrigins, "POST /auth/refresh", "POST /auth/logout", "POST /auth/logout-all"),
	)
}

func (r *Router) public(mux *http.ServeMux, pattern string, handler http.Handler) {
	mux.Handle(pattern, r.rateLimit.Middleware(pattern)(handler))
}

func (r *Router) authenticated(mux *http.ServeMux, pattern string, handler http.Handler) {
	mux.Handle(pattern, chain(handler, r.rateLimit.Middleware(pattern), gwmw.JWT(r.cfg.PublicKey, r.cfg.JWTIssuer, r.cfg.JWTAudience), r.userCheck.Middleware))
}

func (r *Router) admin(mux *http.ServeMux, pattern string, handler http.Handler, roles ...string) {
	mux.Handle(pattern, chain(handler, r.rateLimit.Middleware(pattern), gwmw.JWT(r.cfg.PublicKey, r.cfg.JWTIssuer, r.cfg.JWTAudience), r.userCheck.Middleware, gwmw.RequireRole(roles...)))
}

func (r *Router) adminMin(mux *http.ServeMux, pattern string, handler http.Handler, role string) {
	mux.Handle(pattern, chain(handler, r.rateLimit.Middleware(pattern), gwmw.JWT(r.cfg.PublicKey, r.cfg.JWTIssuer, r.cfg.JWTAudience), r.userCheck.Middleware, gwmw.RequireMinRole(userctx.Role(role))))
}

func chain(handler http.Handler, middlewares ...func(http.Handler) http.Handler) http.Handler {
	for i := len(middlewares) - 1; i >= 0; i-- {
		handler = middlewares[i](handler)
	}
	return handler
}

func (r *Router) health(w http.ResponseWriter, req *http.Request) {
	targets := map[string]string{
		"auth-service":      r.cfg.AuthServiceURL,
		"user-service":      r.cfg.UserServiceURL,
		"otp-service":       r.cfg.OTPServiceURL,
		"favorites-service": r.cfg.FavoritesServiceURL,
		"alerts-service":    r.cfg.AlertsServiceURL,
	}
	statuses := map[string]string{}
	var mu sync.Mutex
	var wg sync.WaitGroup
	client := &http.Client{Timeout: 2 * time.Second}
	for name, target := range targets {
		wg.Add(1)
		go func(name, target string) {
			defer wg.Done()
			ctx, cancel := context.WithTimeout(req.Context(), 2*time.Second)
			defer cancel()
			upstreamReq, err := http.NewRequestWithContext(ctx, http.MethodGet, target+"/health", nil)
			status := "ok"
			if err != nil {
				status = "down"
			} else if resp, err := client.Do(upstreamReq); err != nil {
				status = "down"
			} else {
				if resp.StatusCode != http.StatusOK {
					status = "down"
				}
				_ = resp.Body.Close()
			}
			mu.Lock()
			statuses[name] = status
			mu.Unlock()
		}(name, target)
	}
	if r.redis != nil {
		wg.Add(1)
		go func() {
			defer wg.Done()
			ctx, cancel := context.WithTimeout(req.Context(), 2*time.Second)
			defer cancel()
			status := "ok"
			if err := r.redis.Ping(ctx).Err(); err != nil {
				status = "down"
			}
			mu.Lock()
			statuses["redis"] = status
			mu.Unlock()
		}()
	}
	wg.Wait()
	overall := "ok"
	for _, status := range statuses {
		if status != "ok" {
			overall = "degraded"
			break
		}
	}
	httpjson.Write(w, req, http.StatusOK, map[string]any{
		"status":    overall,
		"services":  statuses,
		"timestamp": time.Now().UTC(),
	})
}
