#!/usr/bin/env bash
# Small idempotent Nginx runtime adjustments that are safe to run on every deploy.
set -euo pipefail

SITE_PATH="${NGINX_SITE_PATH:-/etc/nginx/sites-available/1111.tn}"

if [ ! -f "${SITE_PATH}" ]; then
  echo "Nginx site config not found at ${SITE_PATH}; skipping runtime Nginx adjustments."
  exit 0
fi

if grep -q 'add_header Cross-Origin-Opener-Policy' "${SITE_PATH}"; then
  sed -i 's|^[[:space:]]*add_header Cross-Origin-Opener-Policy .*$|    add_header Cross-Origin-Opener-Policy "same-origin-allow-popups" always;|' "${SITE_PATH}"
elif grep -q 'add_header Referrer-Policy' "${SITE_PATH}"; then
  sed -i '/add_header Referrer-Policy/a\    add_header Cross-Origin-Opener-Policy "same-origin-allow-popups" always;' "${SITE_PATH}"
else
  sed -i '/add_header X-Content-Type-Options/a\    add_header Cross-Origin-Opener-Policy "same-origin-allow-popups" always;' "${SITE_PATH}"
fi

nginx -t
systemctl reload nginx
echo "Nginx runtime adjustments applied."
