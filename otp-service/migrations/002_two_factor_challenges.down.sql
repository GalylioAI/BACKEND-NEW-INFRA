DROP INDEX IF EXISTS idx_password_reset_tokens_expires_at;
DROP INDEX IF EXISTS idx_otp_codes_expires_at;
DROP INDEX IF EXISTS idx_two_factor_challenges_active_user;
DROP INDEX IF EXISTS idx_two_factor_challenges_active_jti;
DROP TABLE IF EXISTS two_factor_challenges;

ALTER TABLE otp_codes DROP CONSTRAINT IF EXISTS otp_codes_type_check;
ALTER TABLE otp_codes
  ADD CONSTRAINT otp_codes_type_check
  CHECK (type IN ('email_verify', '2fa', 'password_reset'));
