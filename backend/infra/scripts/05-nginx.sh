#!/usr/bin/env bash
# Run as root after the host services are configured.
# Usage: EMAIL=ops@1111.tn bash 05-nginx.sh
set -euo pipefail

FRONTEND_DOMAIN="${FRONTEND_DOMAIN:-1111.tn}"
WWW_DOMAIN="${WWW_DOMAIN:-www.1111.tn}"
BACKEND_DOMAIN="${BACKEND_DOMAIN:-backend.1111.tn}"
EMAIL="${EMAIL:?Set EMAIL=you@example.com}"
CERT_NAME="${FRONTEND_DOMAIN}"

echo "=== Installing Nginx and Certbot ==="
apt-get update
apt-get install -y nginx snapd
snap install core || true
snap refresh core
snap install --classic certbot || true
ln -sf /snap/bin/certbot /usr/bin/certbot

echo "=== Writing HTTP challenge config ==="
mkdir -p /var/www/certbot
cat > /etc/nginx/sites-available/1111.tn << EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${FRONTEND_DOMAIN} ${WWW_DOMAIN} ${BACKEND_DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF

ln -sf /etc/nginx/sites-available/1111.tn /etc/nginx/sites-enabled/1111.tn
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "=== Obtaining TLS certificate ==="
certbot certonly --webroot \
  -w /var/www/certbot \
  --cert-name "${CERT_NAME}" \
  -d "${FRONTEND_DOMAIN}" \
  -d "${WWW_DOMAIN}" \
  -d "${BACKEND_DOMAIN}" \
  --email "${EMAIL}" \
  --agree-tos \
  --non-interactive

echo "=== Writing final HTTPS Nginx config ==="
cat > /etc/nginx/sites-available/1111.tn << EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${FRONTEND_DOMAIN} ${WWW_DOMAIN} ${BACKEND_DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${WWW_DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${CERT_NAME}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${CERT_NAME}/privkey.pem;

    return 301 https://${FRONTEND_DOMAIN}\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${FRONTEND_DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${CERT_NAME}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${CERT_NAME}/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Cross-Origin-Opener-Policy "same-origin-allow-popups" always;

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
    }

    client_max_body_size 5m;
    access_log /var/log/nginx/1111_frontend_access.log;
    error_log  /var/log/nginx/1111_frontend_error.log warn;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${BACKEND_DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${CERT_NAME}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${CERT_NAME}/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    location ~ ^/internal/ {
        deny all;
        return 403;
    }

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Request-Id \$request_id;
        proxy_read_timeout 30s;
        proxy_connect_timeout 5s;
        proxy_send_timeout 30s;
        proxy_buffering off;
    }

    client_max_body_size 2m;
    access_log /var/log/nginx/1111_backend_access.log;
    error_log  /var/log/nginx/1111_backend_error.log warn;
}
EOF

nginx -t && systemctl reload nginx

SECRETS_FILE="/etc/app/secrets/.env"
if [ -f "${SECRETS_FILE}" ]; then
  sed -i "s|^DOMAIN=.*|DOMAIN=${BACKEND_DOMAIN}|" "${SECRETS_FILE}" || true
  sed -i "s|^FRONTEND_DOMAIN=.*|FRONTEND_DOMAIN=${FRONTEND_DOMAIN}|" "${SECRETS_FILE}" || true
  sed -i "s|^BACKEND_DOMAIN=.*|BACKEND_DOMAIN=${BACKEND_DOMAIN}|" "${SECRETS_FILE}" || true
  sed -i 's|^FRONTEND_BIND_IP=.*|FRONTEND_BIND_IP=127.0.0.1|' "${SECRETS_FILE}" || true
  sed -i 's|^GATEWAY_BIND_IP=.*|GATEWAY_BIND_IP=127.0.0.1|' "${SECRETS_FILE}" || true
fi

(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

echo "=== DONE: 05-nginx.sh ==="
echo "Frontend: https://${FRONTEND_DOMAIN}"
echo "Backend:  https://${BACKEND_DOMAIN}"
