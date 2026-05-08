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
	Role  string `json:"role"`
	Email string `json:"email"`
	jwtlib.RegisteredClaims
}

type PendingClaims struct {
	Type    string `json:"typ"`
	Context string `json:"context"`
	jwtlib.RegisteredClaims
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

func (m *Manager) IssueAccess(user domain.User) (string, time.Time, error) {
	now := time.Now().UTC()
	expiresAt := now.Add(m.accessTTL)
	claims := Claims{
		Role:  user.Role,
		Email: user.Email,
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

func (m *Manager) IssuePendingTwoFactor(userID uuid.UUID, contextValue string, ttl time.Duration) (string, time.Time, error) {
	now := time.Now().UTC()
	expiresAt := now.Add(ttl)
	claims := PendingClaims{
		Type:    "2fa_pending",
		Context: contextValue,
		RegisteredClaims: jwtlib.RegisteredClaims{
			Issuer:    m.issuer,
			Subject:   userID.String(),
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

func (m *Manager) Verify(raw string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwtlib.ParseWithClaims(raw, claims, func(token *jwtlib.Token) (any, error) {
		return m.publicKey, nil
	}, jwtlib.WithIssuer(m.issuer), jwtlib.WithAudience(m.audience), jwtlib.WithValidMethods([]string{jwtlib.SigningMethodRS256.Alg()}))
	if err != nil {
		return nil, err
	}
	if !token.Valid {
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
	if !token.Valid || claims.Type != "2fa_pending" {
		return nil, jwtlib.ErrTokenInvalidClaims
	}
	return claims, nil
}
