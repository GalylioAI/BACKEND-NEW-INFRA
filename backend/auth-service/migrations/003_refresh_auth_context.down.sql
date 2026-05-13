DROP INDEX IF EXISTS idx_refresh_tokens_user_session_active;
DROP INDEX IF EXISTS idx_refresh_tokens_session_id;

ALTER TABLE refresh_tokens
  DROP COLUMN IF EXISTS auth_methods,
  DROP COLUMN IF EXISTS auth_time,
  DROP COLUMN IF EXISTS session_id;
