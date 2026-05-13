CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  actor_user_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_audit_events_type_created ON audit_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_audit_events_user_created ON audit_events(user_id, created_at DESC);
