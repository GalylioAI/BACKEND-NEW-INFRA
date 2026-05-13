#!/usr/bin/env bash
# Render Docker secret files from /etc/app/secrets/.env.
# Run on every deploy before docker compose reads docker-compose.prod.yml.
set -euo pipefail

ENV_FILE="${ENV_FILE:-/etc/app/secrets/.env}"
OUT_DIR="${OUT_DIR:-/etc/app/secrets/runtime}"

[ -f "${ENV_FILE}" ] || { echo "Missing ${ENV_FILE}"; exit 1; }

umask 027
mkdir -p "${OUT_DIR}"

if [ "$(id -u)" -eq 0 ]; then
  chown ubuntu:ubuntu "${OUT_DIR}" 2>/dev/null || true
  chmod 770 "${OUT_DIR}"
elif [ ! -w "${OUT_DIR}" ]; then
  echo "Runtime secret directory is not writable: ${OUT_DIR}" >&2
  echo "Run once on the VPS:" >&2
  echo "  sudo chown ubuntu:ubuntu ${OUT_DIR} && sudo chmod 770 ${OUT_DIR}" >&2
  exit 1
fi

python3 - "${ENV_FILE}" "${OUT_DIR}" << 'PY'
from pathlib import Path
import os
import sys

env_file = Path(sys.argv[1])
out_dir = Path(sys.argv[2])

mapping = {
    "INTERNAL_SECRET": "internal_secret",
    "REDIS_URL_GATEWAY": "redis_url_gateway",
    "REDIS_URL_MAIL": "redis_url_mail",
    "RABBITMQ_URL": "rabbitmq_url",
    "AUTH_DB_PASSWORD": "auth_db_password",
    "USER_DB_PASSWORD": "user_db_password",
    "OTP_DB_PASSWORD": "otp_db_password",
    "FAVORITES_DB_PASSWORD": "favorites_db_password",
    "ALERTS_DB_PASSWORD": "alerts_db_password",
    "AUTH_DB_MIGRATION_URL": "auth_db_migration_url",
    "USER_DB_MIGRATION_URL": "user_db_migration_url",
    "OTP_DB_MIGRATION_URL": "otp_db_migration_url",
    "FAVORITES_DB_MIGRATION_URL": "favorites_db_migration_url",
    "ALERTS_DB_MIGRATION_URL": "alerts_db_migration_url",
    "GOOGLE_CLIENT_SECRET": "google_client_secret",
    "SMTP_PASS": "smtp_pass",
    "SENDGRID_API_KEY": "sendgrid_api_key",
}

required = {
    "INTERNAL_SECRET",
    "REDIS_URL_GATEWAY",
    "REDIS_URL_MAIL",
    "RABBITMQ_URL",
    "AUTH_DB_PASSWORD",
    "USER_DB_PASSWORD",
    "OTP_DB_PASSWORD",
    "FAVORITES_DB_PASSWORD",
    "ALERTS_DB_PASSWORD",
    "AUTH_DB_MIGRATION_URL",
    "USER_DB_MIGRATION_URL",
    "OTP_DB_MIGRATION_URL",
    "FAVORITES_DB_MIGRATION_URL",
    "ALERTS_DB_MIGRATION_URL",
}

values: dict[str, str] = {}
for raw_line in env_file.read_text(encoding="utf-8").splitlines():
    line = raw_line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, value = line.split("=", 1)
    key = key.strip()
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        value = value[1:-1]
    values[key] = value

missing = sorted(key for key in required if not values.get(key))
if missing:
    raise SystemExit("Missing required secret values: " + ", ".join(missing))

placeholder_markers = ("REPLACE_", "RABBITMQ_USER", "RABBITMQ_PASSWORD")
placeholders = sorted(
    key for key in required
    if any(marker in values.get(key, "") for marker in placeholder_markers)
)
if placeholders:
    raise SystemExit("Replace placeholder values before deploy: " + ", ".join(placeholders))

out_dir.mkdir(parents=True, exist_ok=True)
for key, filename in mapping.items():
    path = out_dir / filename
    path.write_text(values.get(key, ""), encoding="utf-8")
    os.chmod(path, 0o640)
PY

if [ "$(id -u)" -eq 0 ]; then
  chown -R ubuntu:ubuntu "${OUT_DIR}" 2>/dev/null || true
fi
chmod 770 "${OUT_DIR}"
find "${OUT_DIR}" -type f -exec chmod 640 {} \;

echo "Docker secret files refreshed in ${OUT_DIR}"
