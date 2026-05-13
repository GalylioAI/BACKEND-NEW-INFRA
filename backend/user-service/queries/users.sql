-- name: CreateUser :one
INSERT INTO users (full_name, username, email, phone, password_hash, gouvernorat_id, role, auth_provider, is_verified)
VALUES ($1, $2, $3, $4, $5, $6, 'user', $7, $8)
RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL;

-- name: GetUserByIdentifier :one
SELECT * FROM users WHERE (email = $1 OR username = $1) AND deleted_at IS NULL;

-- name: ListGouvernorats :many
SELECT id, name FROM gouvernorats ORDER BY id;

