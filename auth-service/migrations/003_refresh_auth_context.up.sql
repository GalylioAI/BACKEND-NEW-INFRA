ALTER TABLE refresh_tokens
  ADD COLUMN IF NOT EXISTS session_id UUID,
  ADD COLUMN IF NOT EXISTS auth_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auth_methods TEXT NOT NULL DEFAULT 'password';

UPDATE refresh_tokens
SET
  session_id = COALESCE(session_id, gen_random_uuid()),
  auth_time = COALESCE(auth_time, created_at),
  auth_methods = COALESCE(NULLIF(auth_methods, ''), 'password');

ALTER TABLE refresh_tokens
  ALTER COLUMN session_id SET NOT NULL,
  ALTER COLUMN auth_time SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_session_id ON refresh_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_session_active
  ON refresh_tokens(user_id, session_id)
  WHERE revoked = false;
