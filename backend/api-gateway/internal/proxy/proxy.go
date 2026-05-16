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

func NewServiceProxy(targetURL, internalSecret string, trustedProxyCIDRs []string, logger zerolog.Logger) http.Handler {
	target, err := url.Parse(targetURL)
	if err != nil {
		panic(err)
	}
	trusted := parseTrustedProxyCIDRs(trustedProxyCIDRs)
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
		req.Header.Set("X-Forwarded-Proto", forwardedProto(req, trusted))
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

func forwardedProto(req *http.Request, trusted []*net.IPNet) string {
	if clientFromTrustedProxy(req, trusted) {
		if proto := strings.ToLower(strings.TrimSpace(req.Header.Get("X-Forwarded-Proto"))); proto == "https" || proto == "http" {
			return proto
		}
	}
	if req.TLS != nil {
		return "https"
	}
	return "http"
}

func clientFromTrustedProxy(req *http.Request, trusted []*net.IPNet) bool {
	host, _, err := net.SplitHostPort(req.RemoteAddr)
	if err != nil {
		host = req.RemoteAddr
	}
	ip := net.ParseIP(host)
	if ip == nil {
		return false
	}
	for _, network := range trusted {
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
