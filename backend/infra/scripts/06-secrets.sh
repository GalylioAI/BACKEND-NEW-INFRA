#!/usr/bin/env bash
# Run as root. Creates the production .env scaffold on the VPS.
set -euo pipefail

SECRETS_FILE="/etc/app/secrets/.env"

mkdir -p /etc/app/secrets/keys /etc/app/secrets/runtime

cat > "${SECRETS_FILE}" << 'ENVEOF'
# ============================================================
# FILL IN ALL VALUES - do not leave blanks in production.
# This file is read by docker-compose.prod.yml on every deploy.
# Never commit this file to git.
# ============================================================

APP_ENV=production
IMAGE_TAG=latest

# --- Docker networking ---
# Must match the host services bind address and docker-compose.prod.yml.
APP_INTERNAL_NETWORK=app_internal
APP_DOCKER_SUBNET=172.18.0.0/16
APP_DOCKER_GATEWAY=172.18.0.1

# Public traffic must enter through Nginx. Keep app ports on localhost.
FRONTEND_BIND_IP=127.0.0.1
GATEWAY_BIND_IP=127.0.0.1
TRUSTED_PROXY_CIDRS=127.0.0.1/32,::1/128
DOCS_ENABLED=true

# --- Domain and cookies ---
FRONTEND_DOMAIN=1111.tn
BACKEND_DOMAIN=backend.1111.tn
DOMAIN=backend.1111.tn
BASE_API_URL=https://backend.1111.tn
FRONTEND_URL=https://1111.tn
NEXT_PUBLIC_API_BASE_URL=https://backend.1111.tn
NEXT_PUBLIC_APP_URL=https://1111.tn
COOKIE_DOMAIN=backend.1111.tn
COOKIE_SECURE=true
REFRESH_COOKIE_NAME=refresh_token
REFRESH_COOKIE_DOMAIN=backend.1111.tn
REFRESH_COOKIE_PATH=/auth
REFRESH_COOKIE_SAMESITE=Lax
REFRESH_COOKIE_SECURE=true
REFRESH_COOKIE_HTTPONLY=true
CORS_ALLOWED_ORIGINS=https://1111.tn
CORS_ALLOW_CREDENTIALS=true

# --- JWT ---
JWT_ISSUER=your-app-name
JWT_AUDIENCE=your-app-client
JWT_ACCESS_EXPIRY=15m
JWT_2FA_PENDING_EXPIRY=5m
REFRESH_TOKEN_EXPIRY=720h
RECENT_AUTH_WINDOW=10m
OTP_RESEND_COOLDOWN=1m

# --- Internal secret ---
# Generate: openssl rand -hex 32
INTERNAL_SECRET=

# --- Redis on host ---
REDIS_PASSWORD=
REDIS_URL_GATEWAY=redis://:REPLACE_WITH_REDIS_PASSWORD@host.docker.internal:6379/0
REDIS_URL_MAIL=redis://:REPLACE_WITH_REDIS_PASSWORD@host.docker.internal:6379/1

# --- RabbitMQ on host ---
RABBITMQ_USER=
RABBITMQ_PASSWORD=
RABBITMQ_URL=amqp://RABBITMQ_USER:RABBITMQ_PASSWORD@host.docker.internal:5672/

# --- Database passwords ---
AUTH_DB_PASSWORD=
USER_DB_PASSWORD=
OTP_DB_PASSWORD=
FAVORITES_DB_PASSWORD=
ALERTS_DB_PASSWORD=

# --- Migration URLs, direct to host PostgreSQL ---
AUTH_DB_MIGRATION_URL=postgres://auth_user:REPLACE_PASSWORD@host.docker.internal:5432/auth_db?sslmode=disable
USER_DB_MIGRATION_URL=postgres://user_user:REPLACE_PASSWORD@host.docker.internal:5432/user_db?sslmode=disable
OTP_DB_MIGRATION_URL=postgres://otp_user:REPLACE_PASSWORD@host.docker.internal:5432/otp_db?sslmode=disable
FAVORITES_DB_MIGRATION_URL=postgres://favorites_user:REPLACE_PASSWORD@host.docker.internal:5432/favorites_db?sslmode=disable
ALERTS_DB_MIGRATION_URL=postgres://alerts_user:REPLACE_PASSWORD@host.docker.internal:5432/alerts_db?sslmode=disable

# --- Google OAuth ---
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# --- Mail ---
MAIL_PROVIDER=smtp
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SENDGRID_API_KEY=
MAIL_FROM=noreply@1111.tn
APP_NAME=1111
ENVEOF

chown root:ubuntu "${SECRETS_FILE}"
chmod 640 "${SECRETS_FILE}"
chown -R root:ubuntu /etc/app/secrets
chmod 750 /etc/app/secrets /etc/app/secrets/keys
# The ubuntu user refreshes generated Docker secret files on every release.
chown ubuntu:ubuntu /etc/app/secrets/runtime
chmod 770 /etc/app/secrets/runtime
echo "Created ${SECRETS_FILE}"
echo ""
echo "=== DONE: 06-secrets.sh ==="
echo ""
echo "NEXT STEPS:"
echo "1. Fill in all values in ${SECRETS_FILE}."
echo "2. Copy RS256 keys from your local machine:"
echo "   scp secrets/jwt_private.pem ubuntu@YOUR_VPS_IP:/tmp/private.pem"
echo "   scp secrets/jwt_public.pem  ubuntu@YOUR_VPS_IP:/tmp/public.pem"
echo "   ssh ubuntu@YOUR_VPS_IP 'sudo mv /tmp/private.pem /etc/app/secrets/keys/private.pem && sudo mv /tmp/public.pem /etc/app/secrets/keys/public.pem && sudo chown root:ubuntu /etc/app/secrets/keys/*.pem && sudo chmod 640 /etc/app/secrets/keys/*.pem'"
echo "3. bash 07-pgbouncer.sh"
echo "4. sudo -u ubuntu bash /opt/1111/infra/scripts/08-materialize-secrets.sh before first manual compose run"
