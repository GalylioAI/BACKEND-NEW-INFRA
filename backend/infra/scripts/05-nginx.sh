#!/usr/bin/env bash
# Run as root after 04-rabbitmq.sh.
# Usage: DOMAIN=api.yourdomain.com EMAIL=you@example.com bash 05-nginx.sh
set -euo pipefail

DOMAIN="${DOMAIN:?Set DOMAIN=api.yourdomain.com}"
EMAIL="${EMAIL:?Set EMAIL=you@example.com}"

echo "=== Installing Nginx ==="
apt-get install -y nginx

echo "=== Installing Certbot ==="
apt-get install -y snapd
snap install core && snap refresh core
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot

echo "=== Initial HTTP config for certificate verification ==="
mkdir -p /var/www/certbot
cat > /etc/nginx/sites-available/app << EOF
server {
    listen 80;
    server_name ${DOMAIN};
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://\$host\$request_uri; }
}
EOF

ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "=== Obtaining TLS certificate ==="
certbot certonly --webroot \
  -w /var/www/certbot \
  -d "${DOMAIN}" \
  --email "${EMAIL}" \
  --agree-tos \
  --non-interactive

echo "=== Writing final HTTPS Nginx config ==="
cat > /etc/nginx/sites-available/app << EOF
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    location ~ ^/internal/ {
        deny all;
        return 403;
    }

    location = /health {
        proxy_pass http://127.0.0.1:8080/health;
        access_log off;
    }

    location / {
        proxy_pass         http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_read_timeout 30s;
        proxy_connect_timeout 5s;
        proxy_send_timeout 30s;
        proxy_buffering    off;
    }

    client_max_body_size 2m;
    keepalive_timeout 65;

    access_log /var/log/nginx/app_access.log;
    error_log  /var/log/nginx/app_error.log warn;
}
EOF

nginx -t && systemctl reload nginx

SECRETS_FILE="/etc/app/secrets/.env"
if [ -f "${SECRETS_FILE}" ]; then
  if grep -q '^DOMAIN=' "${SECRETS_FILE}"; then
    sed -i "s|^DOMAIN=.*|DOMAIN=${DOMAIN}|" "${SECRETS_FILE}"
  fi
  if grep -q '^GATEWAY_BIND_IP=' "${SECRETS_FILE}"; then
    sed -i 's|^GATEWAY_BIND_IP=.*|GATEWAY_BIND_IP=127.0.0.1|' "${SECRETS_FILE}"
  fi
fi

(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

echo ""
echo "=== DONE: 05-nginx.sh ==="
echo "Your API is now reachable at https://${DOMAIN}"
echo "NEXT: bash 06-secrets.sh"
