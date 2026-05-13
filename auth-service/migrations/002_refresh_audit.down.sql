DROP INDEX IF EXISTS idx_audit_events_user_created;
DROP INDEX IF EXISTS idx_audit_events_type_created;
DROP TABLE IF EXISTS audit_events;

DROP INDEX IF EXISTS idx_refresh_tokens_reused_at;
DROP INDEX IF EXISTS idx_refresh_tokens_expires_at;

ALTER TABLE refresh_tokens
  DROP COLUMN IF EXISTS replaced_by_token_hash,
  DROP COLUMN IF EXISTS reused_at;
