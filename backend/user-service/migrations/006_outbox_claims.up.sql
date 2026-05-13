ALTER TABLE outbox_events
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claimed_by TEXT,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

DROP INDEX IF EXISTS idx_outbox_events_unpublished;
CREATE INDEX IF NOT EXISTS idx_outbox_events_claimable
  ON outbox_events(created_at)
  WHERE published_at IS NULL AND claimed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_outbox_events_processed_at
  ON outbox_events(processed_at)
  WHERE processed_at IS NOT NULL;
