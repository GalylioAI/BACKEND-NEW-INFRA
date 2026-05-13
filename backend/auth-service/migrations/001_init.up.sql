CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  device_info TEXT,
  ip_address INET,
  revoked BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

CREATE TABLE two_factor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_two_factor_sessions_token_hash ON two_factor_sessions(token_hash) WHERE used = false;
CREATE INDEX idx_two_factor_sessions_user_id ON two_factor_sessions(user_id) WHERE used = false;

