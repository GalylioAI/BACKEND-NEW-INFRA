ALTER TABLE refresh_tokens
  ADD COLUMN IF NOT EXISTS reused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS replaced_by_token_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_reused_at ON refresh_tokens(reused_at) WHERE reused_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  actor_user_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_type_created ON audit_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_user_created ON audit_events(user_id, created_at DESC);
