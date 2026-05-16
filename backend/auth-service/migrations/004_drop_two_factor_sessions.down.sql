CREATE TABLE IF NOT EXISTS two_factor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_two_factor_sessions_token_hash ON two_factor_sessions(token_hash) WHERE used = false;
CREATE INDEX IF NOT EXISTS idx_two_factor_sessions_user_id ON two_factor_sessions(user_id) WHERE used = false;
