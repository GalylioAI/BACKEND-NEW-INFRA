#!/usr/bin/env bash
# Run as root after 02-postgres.sh.
set -euo pipefail

echo "=== Installing Redis 7 ==="
curl -fsSL https://packages.redis.io/gpg \
  | gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] \
  https://packages.redis.io/deb $(lsb_release -cs) main" \
  | tee /etc/apt/sources.list.d/redis.list
apt-get update -y
apt-get install -y redis

DOCKER_GW="$(ip -4 addr show docker0 | awk '/inet / {print $2}' | cut -d/ -f1 | head -n1)"
DOCKER_GW="${DOCKER_GW:-172.17.0.1}"

echo "=== Configuring Redis ==="
read -rsp "Enter Redis password: " REDIS_PASSWORD; echo

cat > /etc/redis/redis.conf << EOF
bind 127.0.0.1 ${DOCKER_GW}
port 6379
protected-mode yes
requirepass ${REDIS_PASSWORD}

appendonly yes
appendfsync everysec
appendfilename "appendonly.aof"
dir /var/lib/redis

maxmemory 256mb
maxmemory-policy allkeys-lru

tcp-keepalive 300
timeout 0
databases 16

loglevel notice
logfile /var/log/redis/redis-server.log
EOF

systemctl enable redis-server
systemctl restart redis-server

redis-cli -a "${REDIS_PASSWORD}" ping | grep -q PONG \
  && echo "Redis: OK" \
  || (echo "Redis: FAILED" && exit 1)

echo ""
echo "=== DONE: 03-redis.sh ==="
echo "Redis listens on 127.0.0.1 and ${DOCKER_GW}."
echo "NEXT: bash 04-rabbitmq.sh"
