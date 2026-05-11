CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS gouvernorats (
  id SMALLINT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO gouvernorats (id, name) VALUES
  (1, 'Tunis'),
  (2, 'Ariana'),
  (3, 'Ben Arous'),
  (4, 'Manouba'),
  (5, 'Nabeul'),
  (6, 'Zaghouan'),
  (7, 'Bizerte'),
  (8, 'Beja'),
  (9, 'Jendouba'),
  (10, 'Kef'),
  (11, 'Siliana'),
  (12, 'Sousse'),
  (13, 'Monastir'),
  (14, 'Mahdia'),
  (15, 'Sfax'),
  (16, 'Kairouan'),
  (17, 'Kasserine'),
  (18, 'Sidi Bouzid'),
  (19, 'Gabes'),
  (20, 'Medenine'),
  (21, 'Tataouine'),
  (22, 'Gafsa'),
  (23, 'Tozeur'),
  (24, 'Kebili')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS gouvernorat_id SMALLINT REFERENCES gouvernorats(id),
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason TEXT,
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS two_factor_enabled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_login_attempts SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_active
  ON users(email)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username_active
  ON users(username)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_phone_active
  ON users(phone)
  WHERE phone IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_role
  ON users(role)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_gouvernorat_id
  ON users(gouvernorat_id)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbox_events_unpublished
  ON outbox_events(created_at)
  WHERE published_at IS NULL;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_users_updated_at'
  ) THEN
    CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;
