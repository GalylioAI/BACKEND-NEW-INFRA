# 1111.tn Production Deployment

This deployment serves the Next.js frontend at `https://1111.tn` and the Go API gateway at `https://backend.1111.tn`. Public traffic must enter through Nginx only.

## GitHub Secrets

```text
VPS_HOST
VPS_SSH_KEY
GHCR_TOKEN
```

The workflow is intentionally hardcoded for:

- SSH user: `deploy`
- SSH port: `22`
- Deploy path: `/opt/1111`

All runtime environment values live on the VPS in `/etc/app/secrets/.env`. The GitHub workflow does not overwrite that file.

## Backend Environment

Use these public-domain and cookie values in production:

```env
APP_ENV=production
FRONTEND_DOMAIN=1111.tn
BACKEND_DOMAIN=backend.1111.tn
DOMAIN=backend.1111.tn
BASE_API_URL=https://backend.1111.tn
FRONTEND_URL=https://1111.tn
NEXT_PUBLIC_API_BASE_URL=https://backend.1111.tn
NEXT_PUBLIC_APP_URL=https://1111.tn
CORS_ALLOWED_ORIGINS=https://1111.tn
CORS_ALLOW_CREDENTIALS=true
COOKIE_DOMAIN=backend.1111.tn
REFRESH_COOKIE_DOMAIN=backend.1111.tn
REFRESH_COOKIE_PATH=/auth
REFRESH_COOKIE_SECURE=true
REFRESH_COOKIE_HTTPONLY=true
REFRESH_COOKIE_SAMESITE=Lax
FRONTEND_BIND_IP=127.0.0.1
GATEWAY_BIND_IP=127.0.0.1
```

`SameSite=Lax` works because `1111.tn` and `backend.1111.tn` are same-site under HTTPS. `Path=/auth` keeps the refresh cookie limited to refresh/logout endpoints. Switch to `SameSite=None` only if the browser-origin credential test fails.

## Ubuntu VPS Setup

```bash
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y git curl ca-certificates gnupg ufw fail2ban unattended-upgrades

sudo adduser deploy
sudo usermod -aG sudo deploy
sudo install -d -o deploy -g deploy /opt/1111

sudo sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl reload ssh

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Install Docker:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker deploy
```

Install host-managed stateful services with the repository scripts:

```bash
cd /opt/1111
sudo bash infra/scripts/01-system.sh
sudo bash infra/scripts/02-postgres.sh
sudo bash infra/scripts/03-redis.sh
sudo bash infra/scripts/04-rabbitmq.sh
sudo bash infra/scripts/06-secrets.sh
sudo bash infra/scripts/07-pgbouncer.sh
```

Fill `/etc/app/secrets/.env`, copy RS256 keys into `/etc/app/secrets/keys`, then materialize Docker secrets:

```bash
sudo -u deploy bash /opt/1111/infra/scripts/08-materialize-secrets.sh
sudo chown -R root:deploy /etc/app/secrets
sudo chmod 750 /etc/app/secrets /etc/app/secrets/keys
sudo chmod 640 /etc/app/secrets/.env /etc/app/secrets/keys/*.pem
```

Configure Nginx and TLS:

```bash
sudo FRONTEND_DOMAIN=1111.tn BACKEND_DOMAIN=backend.1111.tn EMAIL=ops@1111.tn bash /opt/1111/infra/scripts/05-nginx.sh
sudo nginx -t
sudo certbot renew --dry-run
```

## Manual Deployment Commands

```bash
cd /opt/1111
sudo -u deploy bash infra/scripts/08-materialize-secrets.sh
docker login ghcr.io
IMAGE_TAG=<git-short-sha> docker compose -f docker-compose.prod.yml --env-file /etc/app/secrets/.env pull
IMAGE_TAG=<git-short-sha> docker compose -f docker-compose.prod.yml --env-file /etc/app/secrets/.env up -d --wait
sudo nginx -t && sudo systemctl reload nginx
bash infra/scripts/health-check.sh
curl -fsS https://1111.tn
curl -fsS https://backend.1111.tn/health
```

## Security Checklist

- UFW allows only SSH, HTTP, and HTTPS publicly.
- `FRONTEND_BIND_IP` and `GATEWAY_BIND_IP` are `127.0.0.1`.
- No PostgreSQL, Redis, RabbitMQ, PgBouncer, or internal Go service port is public.
- CORS is exactly `https://1111.tn`; no wildcard origins.
- Refresh cookie is HttpOnly, Secure, `SameSite=Lax`, and scoped to `/auth`.
- `.env`, generated runtime secrets, and private keys are not committed and are readable only by root/deploy.
- Nginx does not inject backend CORS headers; the Go gateway owns backend CORS/security headers.
- Logs must not contain access tokens, refresh cookies, passwords, or OTP codes.

## Validation

```bash
cd frontend
npm ci
npm run lint
npm run typecheck
npm run format:check
npm run build

cd ../backend
go test ./shared/... ./user-service/... ./auth-service/... ./otp-service/... ./favorites-service/... ./alerts-service/... ./api-gateway/...
go vet ./shared/... ./user-service/... ./auth-service/... ./otp-service/... ./favorites-service/... ./alerts-service/... ./api-gateway/...
cd mail-service && python -m unittest discover -s tests -v
```

Browser credential test from `https://1111.tn`:

```js
await fetch("https://backend.1111.tn/auth/refresh", {
  method: "POST",
  credentials: "include",
});
```
