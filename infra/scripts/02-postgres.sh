#!/usr/bin/env bash
# Run as root after 01-system.sh.
set -euo pipefail

echo "=== Installing PostgreSQL 16 ==="
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
  | gpg --dearmor -o /etc/apt/keyrings/postgresql.gpg
echo "deb [signed-by=/etc/apt/keyrings/postgresql.gpg] \
  https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
  | tee /etc/apt/sources.list.d/pgdg.list
apt-get update -y
apt-get install -y postgresql-16 postgresql-client-16
systemctl enable postgresql
systemctl start postgresql

APP_INTERNAL_NETWORK="${APP_INTERNAL_NETWORK:-app_internal}"
APP_DOCKER_SUBNET="${APP_DOCKER_SUBNET:-172.18.0.0/16}"
DOCKER_GW="${APP_DOCKER_GATEWAY:-172.18.0.1}"

if command -v docker >/dev/null 2>&1 && ! docker network inspect "${APP_INTERNAL_NETWORK}" >/dev/null 2>&1; then
  docker network create \
    --driver bridge \
    --subnet "${APP_DOCKER_SUBNET}" \
    --gateway "${DOCKER_GW}" \
    "${APP_INTERNAL_NETWORK}"
fi

echo "=== Tuning postgresql.conf (baseline for a 4GB VPS) ==="
PG_CONF="/etc/postgresql/16/main/postgresql.conf"
cat >> "${PG_CONF}" << EOF

# App deployment networking and performance tuning
listen_addresses = '127.0.0.1,${DOCKER_GW}'
shared_buffers = 512MB
effective_cache_size = 1536MB
maintenance_work_mem = 128MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
max_connections = 200
work_mem = 4MB
log_min_duration_statement = 1000
EOF

echo "=== Configuring pg_hba.conf for PgBouncer and migration containers ==="
PG_HBA="/etc/postgresql/16/main/pg_hba.conf"
cat >> "${PG_HBA}" << 'EOF'

# App containers reach the host through Docker bridge ranges.
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             172.16.0.0/12           scram-sha-256
EOF

systemctl restart postgresql

echo "=== Creating databases and users ==="
echo "Enter each password when prompted. Save them for /etc/app/secrets/.env and 07-pgbouncer.sh."
echo ""

read -rsp "auth_user password:      " AUTH_DB_PASSWORD;      echo
read -rsp "user_user password:      " USER_DB_PASSWORD;      echo
read -rsp "otp_user password:       " OTP_DB_PASSWORD;       echo
read -rsp "favorites_user password: " FAVORITES_DB_PASSWORD; echo
read -rsp "alerts_user password:    " ALERTS_DB_PASSWORD;    echo

sudo -u postgres psql -v ON_ERROR_STOP=1 \
  -v auth_password="${AUTH_DB_PASSWORD}" \
  -v user_password="${USER_DB_PASSWORD}" \
  -v otp_password="${OTP_DB_PASSWORD}" \
  -v favorites_password="${FAVORITES_DB_PASSWORD}" \
  -v alerts_password="${ALERTS_DB_PASSWORD}" << 'SQL'
CREATE USER auth_user      WITH PASSWORD :'auth_password';
CREATE USER user_user      WITH PASSWORD :'user_password';
CREATE USER otp_user       WITH PASSWORD :'otp_password';
CREATE USER favorites_user WITH PASSWORD :'favorites_password';
CREATE USER alerts_user    WITH PASSWORD :'alerts_password';

CREATE DATABASE auth_db      OWNER auth_user;
CREATE DATABASE user_db      OWNER user_user;
CREATE DATABASE otp_db       OWNER otp_user;
CREATE DATABASE favorites_db OWNER favorites_user;
CREATE DATABASE alerts_db    OWNER alerts_user;

REVOKE ALL ON DATABASE auth_db      FROM PUBLIC;
REVOKE ALL ON DATABASE user_db      FROM PUBLIC;
REVOKE ALL ON DATABASE otp_db       FROM PUBLIC;
REVOKE ALL ON DATABASE favorites_db FROM PUBLIC;
REVOKE ALL ON DATABASE alerts_db    FROM PUBLIC;

GRANT ALL PRIVILEGES ON DATABASE auth_db      TO auth_user;
GRANT ALL PRIVILEGES ON DATABASE user_db      TO user_user;
GRANT ALL PRIVILEGES ON DATABASE otp_db       TO otp_user;
GRANT ALL PRIVILEGES ON DATABASE favorites_db TO favorites_user;
GRANT ALL PRIVILEGES ON DATABASE alerts_db    TO alerts_user;
SQL

systemctl restart postgresql

echo ""
echo "=== DONE: 02-postgres.sh ==="
echo "PostgreSQL listens on 127.0.0.1 and ${DOCKER_GW} for app container access."
echo "NEXT: bash 03-redis.sh"
