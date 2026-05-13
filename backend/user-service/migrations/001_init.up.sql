CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE gouvernorats (
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

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(150) NOT NULL,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  password_hash TEXT,
  gouvernorat_id SMALLINT REFERENCES gouvernorats(id),
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
  auth_provider VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (auth_provider IN ('manual', 'google')),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  ban_reason TEXT,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  failed_login_attempts SMALLINT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_users_email_active ON users(email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_users_username_active ON users(username) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_users_phone_active ON users(phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_gouvernorat_id ON users(gouvernorat_id) WHERE deleted_at IS NULL;

CREATE TABLE outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outbox_events_unpublished ON outbox_events(created_at) WHERE published_at IS NULL;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

