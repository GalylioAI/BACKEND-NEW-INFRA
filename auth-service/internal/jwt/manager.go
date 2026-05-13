package jwt

import (
	"crypto/rsa"
	"os"
	"time"

	"backend/auth-service/internal/domain"

	jwtlib "github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Manager struct {
	privateKey *rsa.PrivateKey
	publicKey  *rsa.PublicKey
	issuer     string
	audience   string
	accessTTL  time.Duration
}

type Claims struct {
	Type        string   `json:"typ"`
	Role        string   `json:"role"`
	Email       string   `json:"email"`
	AuthTime    int64    `json:"auth_time"`
	AuthMethods []string `json:"amr"`
	SessionID   string   `json:"sid"`
	jwtlib.RegisteredClaims
}

type PendingClaims struct {
	Type        string   `json:"typ"`
	Purpose     string   `json:"purpose"`
	AuthMethods []string `json:"amr"`
	jwtlib.RegisteredClaims
}

type AccessContext struct {
	AuthTime    time.Time
	AuthMethods []string
	SessionID   uuid.UUID
}

func New(privateKeyPath, publicKeyPath, issuer, audience string, accessTTL time.Duration) (*Manager, error) {
	privatePEM, err := os.ReadFile(privateKeyPath)
	if err != nil {
		return nil, err
	}
	publicPEM, err := os.ReadFile(publicKeyPath)
	if err != nil {
		return nil, err
	}
	privateKey, err := jwtlib.ParseRSAPrivateKeyFromPEM(privatePEM)
	if err != nil {
		return nil, err
	}
	publicKey, err := jwtlib.ParseRSAPublicKeyFromPEM(publicPEM)
	if err != nil {
		return nil, err
	}
	return &Manager{privateKey: privateKey, publicKey: publicKey, issuer: issuer, audience: audience, accessTTL: accessTTL}, nil
}

func (m *Manager) IssueAccess(user domain.User, contexts ...AccessContext) (string, time.Time, error) {
	now := time.Now().UTC()
	expiresAt := now.Add(m.accessTTL)
	authContext := defaultAccessContext(now)
	if len(contexts) > 0 {
		authContext = contexts[0].withDefaults(now)
	}
	claims := Claims{
		Type:        "access",
		Role:        user.Role,
		Email:       user.Email,
		AuthTime:    authContext.AuthTime.Unix(),
		AuthMethods: authContext.AuthMethods,
		SessionID:   authContext.SessionID.String(),
		RegisteredClaims: jwtlib.RegisteredClaims{
			Issuer:    m.issuer,
			Subject:   user.ID.String(),
			Audience:  jwtlib.ClaimStrings{m.audience},
			ExpiresAt: jwtlib.NewNumericDate(expiresAt),
			IssuedAt:  jwtlib.NewNumericDate(now),
			ID:        uuid.NewString(),
		},
	}
	token := jwtlib.NewWithClaims(jwtlib.SigningMethodRS256, claims)
	signed, err := token.SignedString(m.privateKey)
	return signed, expiresAt, err
}

func (m *Manager) IssuePendingTwoFactor(userID uuid.UUID, purpose string, ttl time.Duration, authMethods ...[]string) (string, time.Time, string, error) {
	now := time.Now().UTC()
	expiresAt := now.Add(ttl)
	jti := uuid.NewString()
	methods := []string{"password"}
	if len(authMethods) > 0 && len(authMethods[0]) > 0 {
		methods = cleanMethods(authMethods[0])
	}
	claims := PendingClaims{
		Type:        "2fa_pending",
		Purpose:     purpose,
		AuthMethods: methods,
		RegisteredClaims: jwtlib.RegisteredClaims{
			Issuer:    m.issuer,
			Subject:   userID.String(),
			Audience:  jwtlib.ClaimStrings{m.audience},
			ExpiresAt: jwtlib.NewNumericDate(expiresAt),
			IssuedAt:  jwtlib.NewNumericDate(now),
			ID:        jti,
		},
	}
	token := jwtlib.NewWithClaims(jwtlib.SigningMethodRS256, claims)
	signed, err := token.SignedString(m.privateKey)
	return signed, expiresAt, jti, err
}

func defaultAccessContext(now time.Time) AccessContext {
	return AccessContext{
		AuthTime:    now,
		AuthMethods: []string{"password"},
		SessionID:   uuid.New(),
	}
}

func (c AccessContext) withDefaults(now time.Time) AccessContext {
	if c.AuthTime.IsZero() {
		c.AuthTime = now
	}
	c.AuthTime = c.AuthTime.UTC()
	if len(c.AuthMethods) == 0 {
		c.AuthMethods = []string{"password"}
	} else {
		c.AuthMethods = cleanMethods(c.AuthMethods)
	}
	if c.SessionID == uuid.Nil {
		c.SessionID = uuid.New()
	}
	return c
}

func cleanMethods(methods []string) []string {
	out := make([]string, 0, len(methods))
	seen := map[string]struct{}{}
	for _, method := range methods {
		if method == "" {
			continue
		}
		if _, ok := seen[method]; ok {
			continue
		}
		seen[method] = struct{}{}
		out = append(out, method)
	}
	if len(out) == 0 {
		return []string{"password"}
	}
	return out
}

func (m *Manager) Verify(raw string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwtlib.ParseWithClaims(raw, claims, func(token *jwtlib.Token) (any, error) {
		return m.publicKey, nil
	}, jwtlib.WithIssuer(m.issuer), jwtlib.WithAudience(m.audience), jwtlib.WithValidMethods([]string{jwtlib.SigningMethodRS256.Alg()}))
	if err != nil {
		return nil, err
	}
	if !token.Valid || claims.Type != "access" {
		return nil, jwtlib.ErrTokenInvalidClaims
	}
	return claims, nil
}

func (m *Manager) VerifyPendingTwoFactor(raw string) (*PendingClaims, error) {
	claims := &PendingClaims{}
	token, err := jwtlib.ParseWithClaims(raw, claims, func(token *jwtlib.Token) (any, error) {
		return m.publicKey, nil
	}, jwtlib.WithIssuer(m.issuer), jwtlib.WithAudience(m.audience), jwtlib.WithValidMethods([]string{jwtlib.SigningMethodRS256.Alg()}))
	if err != nil {
		return nil, err
	}
	if !token.Valid || claims.Type != "2fa_pending" || claims.Purpose == "" {
		return nil, jwtlib.ErrTokenInvalidClaims
	}
	return claims, nil
}
