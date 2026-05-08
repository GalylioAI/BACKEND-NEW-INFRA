#!/usr/bin/env bash
# Roll back all containers to the previously deployed image tag.
set -euo pipefail

COMPOSE="/opt/app/docker-compose.prod.yml"
ENV_FILE="/etc/app/secrets/.env"
LAST_TAG_FILE="/opt/app/.last_deployed_tag"
PREV_TAG_FILE="/opt/app/.previous_tag"

[ -f "${LAST_TAG_FILE}" ] || { echo "No deployment record found."; exit 1; }
[ -f "${PREV_TAG_FILE}" ] || { echo "No previous tag; cannot roll back."; exit 1; }

CURRENT="$(cat "${LAST_TAG_FILE}")"
ROLLBACK="$(cat "${PREV_TAG_FILE}")"

get_env_value() {
  grep -E "^$1=" "${ENV_FILE}" 2>/dev/null | tail -n1 | cut -d= -f2- || true
}

echo ""
echo "Current tag: ${CURRENT}"
echo "Rollback to: ${ROLLBACK}"
echo ""
read -rp "Confirm rollback? (yes/no): " CONFIRM
[ "${CONFIRM}" != "yes" ] && echo "Cancelled." && exit 0

echo "=== Rolling back to ${ROLLBACK} ==="

APP_INTERNAL_NETWORK="$(get_env_value APP_INTERNAL_NETWORK)"
APP_INTERNAL_NETWORK="${APP_INTERNAL_NETWORK:-app_internal}"
APP_DOCKER_SUBNET="$(get_env_value APP_DOCKER_SUBNET)"
APP_DOCKER_SUBNET="${APP_DOCKER_SUBNET:-172.18.0.0/16}"
APP_DOCKER_GATEWAY="$(get_env_value APP_DOCKER_GATEWAY)"
APP_DOCKER_GATEWAY="${APP_DOCKER_GATEWAY:-172.18.0.1}"
GATEWAY_BIND_IP="$(get_env_value GATEWAY_BIND_IP)"
if [ -z "${GATEWAY_BIND_IP}" ]; then
  if systemctl is-active --quiet nginx; then
    GATEWAY_BIND_IP="127.0.0.1"
  else
    GATEWAY_BIND_IP="0.0.0.0"
  fi
fi

export APP_INTERNAL_NETWORK APP_DOCKER_SUBNET APP_DOCKER_GATEWAY GATEWAY_BIND_IP

if ! docker network inspect "${APP_INTERNAL_NETWORK}" >/dev/null 2>&1; then
  docker network create \
    --driver bridge \
    --subnet "${APP_DOCKER_SUBNET}" \
    --gateway "${APP_DOCKER_GATEWAY}" \
    "${APP_INTERNAL_NETWORK}"
fi

IMAGE_TAG="${ROLLBACK}" docker compose -f "${COMPOSE}" --env-file "${ENV_FILE}" up -d

echo "${ROLLBACK}" > "${LAST_TAG_FILE}"
echo "${CURRENT}" > "${PREV_TAG_FILE}"

echo "=== Rollback complete ==="
bash /opt/app/infra/scripts/health-check.sh
