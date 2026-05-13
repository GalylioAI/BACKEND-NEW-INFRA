-- name: CreateAlert :one
INSERT INTO alerts (user_id, product_id, type, threshold)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetAlertByID :one
SELECT * FROM alerts
WHERE id = $1 AND deleted_at IS NULL
LIMIT 1;

-- name: GetAlertByIDAndUser :one
SELECT * FROM alerts
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
LIMIT 1;

-- name: ListAlertsByUser :many
SELECT * FROM alerts
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountAlertsByUser :one
SELECT COUNT(*) FROM alerts
WHERE user_id = $1 AND deleted_at IS NULL;

-- name: ListAlertsByUserFiltered :many
SELECT * FROM alerts
WHERE user_id = $1
  AND deleted_at IS NULL
  AND ($3::boolean IS NULL OR is_active = $3)
  AND ($4::varchar IS NULL OR type = $4)
ORDER BY created_at DESC
LIMIT $2 OFFSET $5;

-- name: UpdateAlert :one
UPDATE alerts
SET type = $2, threshold = $3, updated_at = NOW()
WHERE id = $1 AND user_id = $4 AND deleted_at IS NULL
RETURNING *;

-- name: ToggleAlert :one
UPDATE alerts
SET is_active = $2, triggered_at = CASE WHEN $2 THEN NULL ELSE triggered_at END, updated_at = NOW()
WHERE id = $1 AND user_id = $3 AND deleted_at IS NULL
RETURNING *;

-- name: SoftDeleteAlert :exec
UPDATE alerts
SET deleted_at = NOW(), updated_at = NOW()
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL;

-- name: GetActiveAlertsForProduct :many
SELECT * FROM alerts
WHERE product_id = $1
  AND type = $2
  AND is_active = true
  AND deleted_at IS NULL;

-- name: TriggerAlert :one
UPDATE alerts
SET is_active = false, triggered_at = NOW(), updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: ListAllAlerts :many
SELECT * FROM alerts
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountAllAlerts :one
SELECT COUNT(*) FROM alerts
WHERE deleted_at IS NULL;
