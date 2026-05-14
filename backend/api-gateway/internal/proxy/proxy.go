package proxy

import (
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"backend/shared/apperr"
	"backend/shared/httpjson"
	"backend/shared/middleware"

	"github.com/rs/zerolog"
)

func NewServiceProxy(targetURL, internalSecret string, logger zerolog.Logger) http.Handler {
	target, err := url.Parse(targetURL)
	if err != nil {
		panic(err)
	}
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.Transport = &http.Transport{
		DialContext: (&net.Dialer{
			Timeout:   3 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		TLSHandshakeTimeout:   5 * time.Second,
		ResponseHeaderTimeout: 10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
		MaxIdleConns:          100,
		MaxIdleConnsPerHost:   10,
		IdleConnTimeout:       90 * time.Second,
	}
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		authorization := req.Header.Get("Authorization")
		originalDirector(req)
		req.Host = target.Host
		if req.Method == http.MethodPost && req.URL.Path == "/otp/2fa/login/verify" {
			if token := bearerToken(authorization); token != "" {
				req.Header.Set("X-2FA-Pending-Token", token)
			}
		}
		req.Header.Del("Authorization")
		req.Header.Del("Origin")
		req.Header.Set(middleware.HeaderInternalSecret, internalSecret)
		req.Header.Set("X-Forwarded-For", forwardedFor(req))
		req.Header.Set("X-Forwarded-Proto", "http")
	}
	proxy.ModifyResponse = func(resp *http.Response) error {
		stripGatewayOwnedHeaders(resp.Header)
		return nil
	}
	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		if strings.Contains(err.Error(), "request body too large") {
			httpjson.WriteError(w, r, apperr.New(http.StatusRequestEntityTooLarge, "PAYLOAD_TOO_LARGE", "Request body is too large."))
			return
		}
		logger.Error().
			Str("request_id", r.Header.Get("X-Request-Id")).
			Str("target", target.Host).
			Err(err).
			Msg("upstream_error")
		httpjson.WriteError(w, r, apperr.New(http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "The requested service is temporarily unavailable."))
	}
	return proxy
}

func stripGatewayOwnedHeaders(header http.Header) {
	for _, name := range []string{
		"Access-Control-Allow-Origin",
		"Access-Control-Allow-Credentials",
		"Access-Control-Allow-Headers",
		"Access-Control-Allow-Methods",
		"Access-Control-Expose-Headers",
		"Access-Control-Max-Age",
		"X-Frame-Options",
		"X-Content-Type-Options",
		"Strict-Transport-Security",
	} {
		header.Del(name)
	}
}

func bearerToken(header string) string {
	if len(header) < len("Bearer ") || !strings.EqualFold(header[:len("Bearer ")], "Bearer ") {
		return ""
	}
	return strings.TrimSpace(header[len("Bearer "):])
}

func forwardedFor(req *http.Request) string {
	host, _, err := net.SplitHostPort(req.RemoteAddr)
	if err != nil {
		host = req.RemoteAddr
	}
	existing := req.Header.Get("X-Forwarded-For")
	if strings.TrimSpace(existing) == "" {
		return host
	}
	return existing + ", " + host
}
