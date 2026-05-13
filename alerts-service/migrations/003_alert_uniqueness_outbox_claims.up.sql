CREATE UNIQUE INDEX IF NOT EXISTS uq_alerts_active_user_product_type
  ON alerts(user_id, product_id, type)
  WHERE deleted_at IS NULL AND is_active = true;

ALTER TABLE alert_outbox
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claimed_by TEXT,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_alert_outbox_claimable
  ON alert_outbox(created_at)
  WHERE published = false AND failed = false AND claimed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_alert_outbox_processed_at
  ON alert_outbox(processed_at)
  WHERE processed_at IS NOT NULL;
