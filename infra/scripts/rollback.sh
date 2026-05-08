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

echo ""
echo "Current tag: ${CURRENT}"
echo "Rollback to: ${ROLLBACK}"
echo ""
read -rp "Confirm rollback? (yes/no): " CONFIRM
[ "${CONFIRM}" != "yes" ] && echo "Cancelled." && exit 0

echo "=== Rolling back to ${ROLLBACK} ==="
IMAGE_TAG="${ROLLBACK}" docker compose -f "${COMPOSE}" --env-file "${ENV_FILE}" up -d

echo "${ROLLBACK}" > "${LAST_TAG_FILE}"
echo "${CURRENT}" > "${PREV_TAG_FILE}"

echo "=== Rollback complete ==="
bash /opt/app/infra/scripts/health-check.sh
