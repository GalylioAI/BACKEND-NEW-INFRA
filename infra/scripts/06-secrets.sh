#!/usr/bin/env bash
# Run as root. Creates the production .env scaffold on the VPS.
set -euo pipefail

SECRETS_FILE="/etc/app/secrets/.env"

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

# Deploy uses 127.0.0.1 when Nginx is active.
# If Nginx is not active, deploy overrides this to 0.0.0.0 for direct IP testing.
# For direct IP testing, open the port once on the VPS: sudo ufw allow 8080/tcp
GATEWAY_BIND_IP=127.0.0.1

# --- Domain and cookies ---
DOMAIN=api.yourdomain.com
COOKIE_DOMAIN=.yourdomain.com
COOKIE_SECURE=true
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# --- JWT ---
JWT_ISSUER=your-app-name
JWT_AUDIENCE=your-app-client
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=720h

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
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM=noreply@yourdomain.com
ENVEOF

chown root:deploy "${SECRETS_FILE}"
chmod 640 "${SECRETS_FILE}"
chown -R root:deploy /etc/app/secrets
chmod 750 /etc/app/secrets /etc/app/secrets/keys
echo "Created ${SECRETS_FILE}"
echo ""
echo "=== DONE: 06-secrets.sh ==="
echo ""
echo "NEXT STEPS:"
echo "1. Fill in all values in ${SECRETS_FILE}."
echo "2. Copy RS256 keys from your local machine:"
echo "   scp secrets/jwt_private.pem deploy@YOUR_VPS_IP:/tmp/private.pem"
echo "   scp secrets/jwt_public.pem  deploy@YOUR_VPS_IP:/tmp/public.pem"
echo "   ssh deploy@YOUR_VPS_IP 'sudo mv /tmp/private.pem /etc/app/secrets/keys/private.pem && sudo mv /tmp/public.pem /etc/app/secrets/keys/public.pem && sudo chown root:deploy /etc/app/secrets/keys/*.pem && sudo chmod 640 /etc/app/secrets/keys/*.pem'"
echo "3. bash 07-pgbouncer.sh"
