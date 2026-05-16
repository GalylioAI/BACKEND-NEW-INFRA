-- name: CreateRefreshToken :exec
INSERT INTO refresh_tokens (user_id, token_hash, device_info, ip_address, expires_at, auth_time, auth_methods, session_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- name: RevokeAllRefreshTokens :exec
UPDATE refresh_tokens SET revoked = true WHERE user_id = $1;

-- name: RevokeOtherRefreshTokens :exec
UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND session_id <> $2;
