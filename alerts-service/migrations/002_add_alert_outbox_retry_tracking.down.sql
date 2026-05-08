DROP INDEX IF EXISTS idx_alert_outbox_unpublished;

ALTER TABLE alert_outbox
  DROP COLUMN IF EXISTS publish_attempts,
  DROP COLUMN IF EXISTS last_attempt_at,
  DROP COLUMN IF EXISTS failed;

CREATE INDEX idx_alert_outbox_unpublished
  ON alert_outbox(created_at)
  WHERE published = false;
