# Operations Guide

## Health Checks

Gateway:

```bash
curl http://127.0.0.1:8080/health
```

Full VPS check:

```bash
bash /opt/app/infra/scripts/health-check.sh
```

The health check reports Nginx/HTTPS as warnings when Nginx is intentionally skipped for direct-IP deployments.

## Logs

```bash
docker compose -f /opt/app/docker-compose.prod.yml --env-file /etc/app/secrets/.env logs -f api-gateway
docker logs app-auth-service-1 --tail 100
sudo journalctl -u redis-server -n 100 --no-pager
sudo journalctl -u rabbitmq-server -n 100 --no-pager
```

Sensitive data should never appear in logs. Scan with:

```bash
docker compose -f /opt/app/docker-compose.prod.yml --env-file /etc/app/secrets/.env logs \
  | grep -iE "(password|otp_code|token_hash|secret|authorization)" \
  | wc -l
```

## Network Checks

From a container:

```bash
docker exec app-api-gateway-1 sh -c 'getent hosts host.docker.internal'
docker exec app-api-gateway-1 sh -c 'nc -vz host.docker.internal 6379'
docker exec app-api-gateway-1 sh -c 'nc -vz host.docker.internal 5672'
docker exec app-api-gateway-1 sh -c 'nc -vz host.docker.internal 6433'
```

If these hang, verify UFW allows the Docker subnet to host service ports.

## RabbitMQ

The app declares topic exchange `app.events`. Host RabbitMQ listens on localhost and the Docker gateway address.

Management UI can be reached with SSH tunneling:

```bash
ssh -L 15672:localhost:15672 deploy@YOUR_VPS_IP
```

Then open `http://localhost:15672`.

## Redis

Redis DB `0` is used by the gateway rate limiter. Redis DB `1` is used by mail idempotency.

```bash
redis-cli -a "$REDIS_PASSWORD" ping
redis-cli -a "$REDIS_PASSWORD" -n 0 keys 'ratelimit:*'
redis-cli -a "$REDIS_PASSWORD" -n 1 keys 'mail:processed:*'
```

## PgBouncer

Ports:

- `6433`: auth
- `6434`: user
- `6435`: otp
- `6436`: favorites
- `6437`: alerts

```bash
systemctl status pgbouncer-auth --no-pager
psql "postgres://auth_user:<password>@127.0.0.1:6433/auth_db?sslmode=disable" -c "SELECT 1"
```

## Common Failure Modes

### Gateway healthy but upstreams down

Check service logs first:

```bash
docker logs app-auth-service-1 --tail 100
```

Most common causes are DB URL/password mismatch, PgBouncer not running, RabbitMQ password mismatch, or host firewall blocking the Docker subnet.

### CI deploy fails at health-check because Nginx is skipped

That should now be a warning, not a fatal error. If it is fatal, make sure the latest `infra/scripts/health-check.sh` was copied to `/opt/app/infra/scripts/health-check.sh` by the deploy workflow.

### `unauthorized` pulling GHCR images

Refresh `GHCR_TOKEN` with `read:packages`; add `repo` if the repo/package is private. Then run:

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### App containers cannot reach host services

Inspect the Docker subnet:

```bash
docker network inspect app_internal --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}'
```

Allow that subnet through UFW for host-only service ports.

## Maintenance

Restart one service:

```bash
IMAGE_TAG=$(cat /opt/app/.last_deployed_tag) \
docker compose -f /opt/app/docker-compose.prod.yml --env-file /etc/app/secrets/.env up -d --no-deps auth-service
```

Prune old images:

```bash
docker image prune -f --filter "until=72h"
```

Back up PostgreSQL:

```bash
sudo -u postgres pg_dump auth_db > auth_db.sql
```

Repeat for each database or configure automated host backups.
