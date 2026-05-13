-- name: CreateOTPCode :one
INSERT INTO otp_codes (user_id, code_hash, type, expires_at)
VALUES ($1, $2, $3, $4)
RETURNING id, user_id, code_hash, type, attempts, max_attempts, used, expires_at, created_at;

-- name: GetActiveOTPCode :one
SELECT id, user_id, code_hash, type, attempts, max_attempts, used, expires_at, created_at
FROM otp_codes
WHERE user_id = $1 AND type = $2 AND used = false AND expires_at > NOW()
ORDER BY created_at DESC
LIMIT 1;

-- name: IncrementOTPAttempts :one
UPDATE otp_codes
SET attempts = attempts + 1
WHERE id = $1
RETURNING id, user_id, code_hash, type, attempts, max_attempts, used, expires_at, created_at;

-- name: MarkOTPUsed :exec
UPDATE otp_codes SET used = true WHERE id = $1;

-- name: InvalidateAllOTPCodes :exec
UPDATE otp_codes SET used = true WHERE user_id = $1 AND type = $2 AND used = false;

-- name: GetOTPRateLimit :one
SELECT id, user_id, type, sent_count, window_start
FROM otp_rate_limits
WHERE user_id = $1 AND type = $2;

-- name: UpsertOTPRateLimit :one
INSERT INTO otp_rate_limits (user_id, type, sent_count, window_start)
VALUES ($1, $2, 1, NOW())
ON CONFLICT (user_id, type) DO UPDATE
SET sent_count = otp_rate_limits.sent_count + 1
RETURNING id, user_id, type, sent_count, window_start;

-- name: ResetOTPRateLimit :exec
UPDATE otp_rate_limits SET sent_count = 1, window_start = NOW()
WHERE user_id = $1 AND type = $2;
