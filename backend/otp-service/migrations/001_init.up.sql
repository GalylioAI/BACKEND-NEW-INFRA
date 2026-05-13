CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code_hash TEXT NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('email_verify', '2fa', 'password_reset')),
  attempts SMALLINT NOT NULL DEFAULT 0,
  max_attempts SMALLINT NOT NULL DEFAULT 3,
  used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE otp_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(30) NOT NULL,
  sent_count SMALLINT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_type UNIQUE (user_id, type)
);

CREATE INDEX idx_otp_user_type_active
  ON otp_codes(user_id, type)
  WHERE used = false;

CREATE INDEX idx_reset_tokens_hash
  ON password_reset_tokens(token_hash)
  WHERE used = false;
