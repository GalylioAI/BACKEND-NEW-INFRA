-- name: AddFavorite :one
INSERT INTO favorites (user_id, product_id)
VALUES ($1, $2)
RETURNING *;

-- name: RemoveFavorite :exec
DELETE FROM favorites
WHERE user_id = $1 AND product_id = $2;

-- name: GetFavoriteByUserAndProduct :one
SELECT * FROM favorites
WHERE user_id = $1 AND product_id = $2
LIMIT 1;

-- name: ListFavoritesByUser :many
SELECT * FROM favorites
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountFavoritesByUser :one
SELECT COUNT(*) FROM favorites
WHERE user_id = $1;

-- name: ClearFavoritesByUser :exec
DELETE FROM favorites
WHERE user_id = $1;

-- name: CountFavoritesByProduct :many
SELECT product_id, COUNT(*) AS favorite_count
FROM favorites
GROUP BY product_id
ORDER BY favorite_count DESC
LIMIT $1;

-- name: DeleteFavoritesByProduct :exec
DELETE FROM favorites
WHERE product_id = $1;
