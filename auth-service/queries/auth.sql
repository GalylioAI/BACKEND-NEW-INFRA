-- name: CreateRefreshToken :exec
INSERT INTO refresh_tokens (user_id, token_hash, device_info, ip_address, expires_at)
VALUES ($1, $2, $3, $4, $5);

-- name: RevokeAllRefreshTokens :exec
UPDATE refresh_tokens SET revoked = true WHERE user_id = $1;

-- name: CreateTwoFactorSession :exec
INSERT INTO two_factor_sessions (user_id, token_hash, expires_at)
VALUES ($1, $2, $3);

