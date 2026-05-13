DROP INDEX IF EXISTS idx_alert_outbox_processed_at;
DROP INDEX IF EXISTS idx_alert_outbox_claimable;

ALTER TABLE alert_outbox
  DROP COLUMN IF EXISTS processed_at,
  DROP COLUMN IF EXISTS claimed_by,
  DROP COLUMN IF EXISTS claimed_at;

DROP INDEX IF EXISTS uq_alerts_active_user_product_type;
