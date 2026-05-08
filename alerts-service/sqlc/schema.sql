CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('price_drop', 'price_above', 'back_in_stock', 'discount')),
  threshold NUMERIC(12, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  triggered_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE alert_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL,
  event_type VARCHAR(60) NOT NULL,
  payload JSONB NOT NULL,
  published BOOLEAN NOT NULL DEFAULT false,
  publish_attempts SMALLINT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  failed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alert_outbox_unpublished
  ON alert_outbox(created_at)
  WHERE published = false AND failed = false;
