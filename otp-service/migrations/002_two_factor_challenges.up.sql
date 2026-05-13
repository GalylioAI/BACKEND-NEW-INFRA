ALTER TABLE otp_codes DROP CONSTRAINT IF EXISTS otp_codes_type_check;
UPDATE otp_codes
SET used = true, type = '2fa_login'
WHERE type = '2fa';

ALTER TABLE otp_codes
  ADD CONSTRAINT otp_codes_type_check
  CHECK (type IN ('email_verify', 'password_reset', '2fa_login', '2fa_enable', '2fa_disable'));

CREATE TABLE IF NOT EXISTS two_factor_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  jti TEXT NOT NULL UNIQUE,
  purpose VARCHAR(30) NOT NULL CHECK (purpose IN ('2fa_login', '2fa_enable', '2fa_disable')),
  otp_hash TEXT NOT NULL,
  attempts SMALLINT NOT NULL DEFAULT 0,
  max_attempts SMALLINT NOT NULL DEFAULT 3,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_two_factor_challenges_active_jti
  ON two_factor_challenges(user_id, jti, purpose)
  WHERE consumed_at IS NULL AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_two_factor_challenges_active_user
  ON two_factor_challenges(user_id, purpose, created_at DESC)
  WHERE consumed_at IS NULL AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
