DROP INDEX IF EXISTS idx_outbox_events_processed_at;
DROP INDEX IF EXISTS idx_outbox_events_claimable;

ALTER TABLE outbox_events
  DROP COLUMN IF EXISTS processed_at,
  DROP COLUMN IF EXISTS claimed_by,
  DROP COLUMN IF EXISTS claimed_at;

CREATE INDEX IF NOT EXISTS idx_outbox_events_unpublished
  ON outbox_events(created_at)
  WHERE published_at IS NULL;
