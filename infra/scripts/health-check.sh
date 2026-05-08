#!/usr/bin/env bash
# Run on the VPS at any time to verify the full system.
set -euo pipefail

PASS=0
FAIL=0

ok() {
  echo "  OK    $1"
  PASS=$((PASS + 1))
}

fail() {
  echo "  FAIL  $1"
  FAIL=$((FAIL + 1))
}

check() {
  local label="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    ok "${label}"
  else
    fail "${label}"
  fi
}

echo ""
echo "===================================="
echo "  HOST SERVICES"
echo "===================================="
check "PostgreSQL"       systemctl is-active --quiet postgresql
check "Redis"            systemctl is-active --quiet redis-server
check "RabbitMQ"         systemctl is-active --quiet rabbitmq-server
check "Nginx"            systemctl is-active --quiet nginx
check "PgBouncer auth"   systemctl is-active --quiet pgbouncer-auth
check "PgBouncer user"   systemctl is-active --quiet pgbouncer-user
check "PgBouncer otp"    systemctl is-active --quiet pgbouncer-otp
check "PgBouncer fav"    systemctl is-active --quiet pgbouncer-favorites
check "PgBouncer alerts" systemctl is-active --quiet pgbouncer-alerts

echo ""
echo "===================================="
echo "  DOCKER CONTAINERS"
echo "===================================="
for svc in api-gateway auth-service user-service otp-service \
            favorites-service alerts-service mail-service; do
  check "${svc}" bash -c "docker ps --format '{{.Names}}' --filter 'name=${svc}' --filter 'status=running' | grep -q ."
done

echo ""
echo "===================================="
echo "  GATEWAY + HTTPS"
echo "===================================="
check "Gateway HTTP" curl -sf http://127.0.0.1:8080/health -o /dev/null

DOMAIN="$(grep '^DOMAIN=' /etc/app/secrets/.env 2>/dev/null | cut -d= -f2 || true)"
if [ -n "${DOMAIN}" ]; then
  check "HTTPS responds" curl -sf --max-time 10 "https://${DOMAIN}/health" -o /dev/null
  check "TLS cert valid" curl -sf --max-time 10 "https://${DOMAIN}/health" -o /dev/null
fi

echo ""
echo "===================================="
GW_RESP="$(curl -s http://127.0.0.1:8080/health 2>/dev/null || echo '{}')"
echo "  Gateway health response:"
echo "  ${GW_RESP}" | python3 -m json.tool 2>/dev/null || echo "  ${GW_RESP}"

echo ""
echo "===================================="
echo "  RESULT: ${PASS} passed | ${FAIL} failed"
echo "===================================="
[ "${FAIL}" -eq 0 ] && exit 0 || exit 1
