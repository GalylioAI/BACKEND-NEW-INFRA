#!/usr/bin/env bash
# Run as root on a fresh Ubuntu 22.04 VPS - one time only.
set -euo pipefail

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

echo "=== [5/6] App user and directories ==="
useradd -m -s /bin/bash deploy || echo "User deploy already exists"
usermod -aG docker deploy
mkdir -p /opt/app
mkdir -p /etc/app/secrets/keys
chown -R deploy:deploy /opt/app
chmod 700 /etc/app/secrets
chmod 700 /etc/app/secrets/keys

echo "=== [6/6] SSH hardening ==="
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl reload sshd

echo ""
echo "=== DONE: 01-system.sh ==="
echo "IMPORTANT: ensure your SSH public key is in /home/deploy/.ssh/authorized_keys before logging out."
echo "NEXT: bash 02-postgres.sh"
