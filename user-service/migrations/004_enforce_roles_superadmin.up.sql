ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users
  ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'superadmin'));

CREATE INDEX IF NOT EXISTS idx_users_active_superadmin
  ON users(id)
  WHERE role = 'superadmin' AND is_banned = false AND deleted_at IS NULL;
