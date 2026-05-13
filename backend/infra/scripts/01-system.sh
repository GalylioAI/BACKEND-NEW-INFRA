#!/usr/bin/env bash
# Run as root on a fresh Ubuntu 22.04 VPS - one time only.
set -euo pipefail

APP_INTERNAL_NETWORK="${APP_INTERNAL_NETWORK:-app_internal}"
APP_DOCKER_SUBNET="${APP_DOCKER_SUBNET:-172.18.0.0/16}"
APP_DOCKER_GATEWAY="${APP_DOCKER_GATEWAY:-172.18.0.1}"

echo "=== [1/6] System update ==="
apt-get update -y && apt-get upgrade -y
apt-get install -y \
  curl wget git unzip gnupg2 ca-certificates lsb-release \
  ufw fail2ban htop vim jq net-tools iproute2

echo "=== [2/6] Firewall ==="
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow from "${APP_DOCKER_SUBNET}" to any port 5432 proto tcp
ufw allow from "${APP_DOCKER_SUBNET}" to any port 6379 proto tcp
ufw allow from "${APP_DOCKER_SUBNET}" to any port 5672 proto tcp
ufw allow from "${APP_DOCKER_SUBNET}" to any port 6433 proto tcp
ufw allow from "${APP_DOCKER_SUBNET}" to any port 6434 proto tcp
ufw allow from "${APP_DOCKER_SUBNET}" to any port 6435 proto tcp
ufw allow from "${APP_DOCKER_SUBNET}" to any port 6436 proto tcp
ufw allow from "${APP_DOCKER_SUBNET}" to any port 6437 proto tcp
ufw --force enable

echo "=== [3/6] Fail2ban ==="
systemctl enable fail2ban
systemctl start fail2ban

echo "=== [4/6] Docker ==="
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  | tee /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable docker
systemctl start docker

echo "=== [4b/6] Docker app network ==="
if ! docker network inspect "${APP_INTERNAL_NETWORK}" >/dev/null 2>&1; then
  docker network create \
    --driver bridge \
    --subnet "${APP_DOCKER_SUBNET}" \
    --gateway "${APP_DOCKER_GATEWAY}" \
    "${APP_INTERNAL_NETWORK}"
fi

echo "=== [5/6] App user and directories ==="
useradd -m -s /bin/bash deploy || echo "User deploy already exists"
usermod -aG docker deploy
mkdir -p /opt/app
mkdir -p /etc/app/secrets/keys
chown -R deploy:deploy /opt/app
chown -R root:deploy /etc/app/secrets
chmod 700 /etc/app/secrets
chmod 700 /etc/app/secrets/keys

echo "=== [6/6] SSH hardening ==="
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl reload sshd

echo ""
echo "=== DONE: 01-system.sh ==="
echo "IMPORTANT: ensure your SSH public key is in /home/deploy/.ssh/authorized_keys before logging out."
echo "NEXT: bash 02-postgres.sh"
