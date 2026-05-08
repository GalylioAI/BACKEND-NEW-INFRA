ALTER TABLE alert_outbox
  ADD COLUMN publish_attempts SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN last_attempt_at TIMESTAMPTZ,
  ADD COLUMN failed BOOLEAN NOT NULL DEFAULT false;

DROP INDEX IF EXISTS idx_alert_outbox_unpublished;
CREATE INDEX idx_alert_outbox_unpublished
  ON alert_outbox(created_at)
  WHERE published = false AND failed = false;
