#!/usr/bin/env bash
# Run as root after 06-secrets.sh.
# Host PgBouncer ports:
#   auth: 6433 | user: 6434 | otp: 6435 | favorites: 6436 | alerts: 6437
set -euo pipefail

echo "=== Installing PgBouncer ==="
apt-get install -y pgbouncer

DOCKER_GW="$(ip -4 addr show docker0 | awk '/inet / {print $2}' | cut -d/ -f1 | head -n1)"
DOCKER_GW="${DOCKER_GW:-172.17.0.1}"

echo "=== Enter DB passwords to build userlist.txt ==="
read -rsp "auth_user password:      " AUTH_DB_PASSWORD;      echo
read -rsp "user_user password:      " USER_DB_PASSWORD;      echo
read -rsp "otp_user password:       " OTP_DB_PASSWORD;       echo
read -rsp "favorites_user password: " FAVORITES_DB_PASSWORD; echo
read -rsp "alerts_user password:    " ALERTS_DB_PASSWORD;    echo

mkdir -p /etc/pgbouncer

escape_userlist_value() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

cat > /etc/pgbouncer/userlist.txt << EOF
"auth_user" "$(escape_userlist_value "${AUTH_DB_PASSWORD}")"
"user_user" "$(escape_userlist_value "${USER_DB_PASSWORD}")"
"otp_user" "$(escape_userlist_value "${OTP_DB_PASSWORD}")"
"favorites_user" "$(escape_userlist_value "${FAVORITES_DB_PASSWORD}")"
"alerts_user" "$(escape_userlist_value "${ALERTS_DB_PASSWORD}")"
EOF

chmod 640 /etc/pgbouncer/userlist.txt
chown postgres:postgres /etc/pgbouncer/userlist.txt

declare -A SERVICES=(
  [auth]=6433
  [user]=6434
  [otp]=6435
  [favorites]=6436
  [alerts]=6437
)

declare -A DBNAMES=(
  [auth]=auth_db
  [user]=user_db
  [otp]=otp_db
  [favorites]=favorites_db
  [alerts]=alerts_db
)

for name in auth user otp favorites alerts; do
  port="${SERVICES[$name]}"
  dbname="${DBNAMES[$name]}"

  cat > "/etc/pgbouncer/pgbouncer-${name}.ini" << EOF
[databases]
${dbname} = host=127.0.0.1 port=5432 dbname=${dbname}

[pgbouncer]
listen_addr = 127.0.0.1,${DOCKER_GW}
listen_port = ${port}
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 200
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
server_idle_timeout = 600
server_lifetime = 3600
log_connections = 0
log_disconnections = 0
log_pooler_errors = 1
ignore_startup_parameters = extra_float_digits
EOF

  cat > "/etc/systemd/system/pgbouncer-${name}.service" << EOF
[Unit]
Description=PgBouncer connection pool for ${name} database
After=postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=postgres
ExecStart=/usr/sbin/pgbouncer /etc/pgbouncer/pgbouncer-${name}.ini
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

  systemctl enable "pgbouncer-${name}"
  systemctl restart "pgbouncer-${name}"
  echo "pgbouncer-${name}: listening on 127.0.0.1 and ${DOCKER_GW}:${port}"
done

echo ""
echo "=== DONE: 07-pgbouncer.sh ==="
echo "All PgBouncer instances are running."
echo ""
echo "FINAL STEP: fill in /etc/app/secrets/.env, copy RS256 keys, then trigger your first deploy from GitHub Actions."
