# Deployment Guide

Production deployment uses host-managed stateful services and Dockerized stateless application services.

## Production Layout

Host services:

- PostgreSQL 16
- Redis 7
- RabbitMQ 3.13
- PgBouncer instances on ports `6433`-`6437`
- Nginx for TLS termination when a domain is configured

Docker services:

- `api-gateway`
- `auth-service`
- `user-service`
- `otp-service`
- `favorites-service`
- `alerts-service`
- `mail-service`

## First VPS Setup

Run these as root on Ubuntu:

```bash
git clone https://github.com/GalylioAI/BACKEND-NEW-INFRA /tmp/setup
cd /tmp/setup

bash infra/scripts/01-system.sh
bash infra/scripts/02-postgres.sh
bash infra/scripts/03-redis.sh
bash infra/scripts/04-rabbitmq.sh
```

If you have a domain:

```bash
DOMAIN=api.yourdomain.com EMAIL=you@example.com bash infra/scripts/05-nginx.sh
```

If you do not have a domain yet, skip Nginx. The deploy workflow can bind the gateway directly to `0.0.0.0:8080`.

Then:

```bash
bash infra/scripts/06-secrets.sh
bash infra/scripts/07-pgbouncer.sh
```

Copy JWT keys:

```bash
scp secrets/jwt_private.pem deploy@YOUR_VPS_IP:/tmp/private.pem
scp secrets/jwt_public.pem deploy@YOUR_VPS_IP:/tmp/public.pem
ssh deploy@YOUR_VPS_IP
sudo mkdir -p /etc/app/secrets/keys
sudo mv /tmp/private.pem /etc/app/secrets/keys/private.pem
sudo mv /tmp/public.pem /etc/app/secrets/keys/public.pem
sudo chown -R root:deploy /etc/app/secrets
sudo chmod 750 /etc/app/secrets /etc/app/secrets/keys
sudo chown deploy:deploy /etc/app/secrets/runtime
sudo chmod 770 /etc/app/secrets/runtime
sudo chmod 640 /etc/app/secrets/.env /etc/app/secrets/keys/*.pem
```

## Required GitHub Secrets

Repository path: `Settings -> Secrets and variables -> Actions`.

- `VPS_HOST`: VPS public IP address.
- `VPS_SSH_KEY`: private key that can SSH as the `deploy` user.
- `GHCR_TOKEN`: GitHub PAT with `read:packages`. Add `repo` too if the repository or package is private.

`GITHUB_TOKEN` is automatic and is used by GitHub Actions to push images to GHCR.

## VPS Secret File

The app reads `/etc/app/secrets/.env`. It must be readable by group `deploy`.
On deploy, `infra/scripts/08-materialize-secrets.sh` validates required secret values, rejects placeholder strings, and renders sensitive values from that file into Docker secret files under `/etc/app/secrets/runtime`, which is writable only by the `deploy` user/group. Containers receive those values through `*_FILE` variables mounted at `/run/secrets/...`, so database passwords, Redis URLs, RabbitMQ URLs, SMTP passwords, and the internal secret are not passed as plain container environment variables.

Important values:

```env
DOMAIN=api.yourdomain.com
COOKIE_DOMAIN=.yourdomain.com
COOKIE_SECURE=true
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
TRUSTED_PROXY_CIDRS=127.0.0.1/32,::1/128
DOCS_ENABLED=true

JWT_ISSUER=your-app-name
JWT_AUDIENCE=your-app-client
INTERNAL_SECRET=<openssl-rand-hex-32>

REDIS_URL_GATEWAY=redis://:<password>@host.docker.internal:6379/0
REDIS_URL_MAIL=redis://:<password>@host.docker.internal:6379/1
RABBITMQ_URL=amqp://<user>:<password>@host.docker.internal:5672/

AUTH_DB_URL=postgres://auth_user:<password>@host.docker.internal:6433/auth_db?sslmode=disable
AUTH_DB_MIGRATION_URL=postgres://auth_user:<password>@host.docker.internal:5432/auth_db?sslmode=disable
```

Repeat DB URLs for user, OTP, favorites, and alerts.

If you edit `/etc/app/secrets/.env` manually, refresh mounted secret files before a manual compose run:

```bash
sudo -u deploy bash /opt/app/infra/scripts/08-materialize-secrets.sh
```

## GitHub Actions Pipeline

On push to `main`:

1. CI runs Go tests, Python tests, and production compose validation.
2. Build job builds seven images and pushes them to GHCR using the commit SHA and `latest` tags.
3. Deploy job SSHes into the VPS, copies compose and scripts, refreshes Docker secret files, pulls all images, recreates services, checks gateway health, and runs `infra/scripts/health-check.sh`.

## Direct IP vs Domain Mode

If Nginx is active, the gateway binds to `127.0.0.1:8080` and Nginx serves public HTTPS.

If Nginx is not active, deployment binds the gateway to `0.0.0.0:8080` so you can test with:

```bash
curl http://YOUR_VPS_IP:8080/health
```

For production, prefer Nginx with TLS and set:

```env
COOKIE_SECURE=true
COOKIE_DOMAIN=.yourdomain.com
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
```

## Rollback

On the VPS:

```bash
bash /opt/app/infra/scripts/rollback.sh
```

The script swaps back to the previous deployed image tag and runs the health check.
