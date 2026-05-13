-- name: CreatePasswordResetToken :one
INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
VALUES ($1, $2, $3)
RETURNING id, user_id, token_hash, used, expires_at, created_at;

-- name: GetPasswordResetToken :one
SELECT id, user_id, token_hash, used, expires_at, created_at
FROM password_reset_tokens
WHERE token_hash = $1 AND used = false AND expires_at > NOW();

-- name: MarkResetTokenUsed :exec
UPDATE password_reset_tokens SET used = true WHERE id = $1;

-- name: InvalidateAllResetTokens :exec
UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false;
