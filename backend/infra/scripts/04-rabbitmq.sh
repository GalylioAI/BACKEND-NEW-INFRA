#!/usr/bin/env bash
# Run as root after 03-redis.sh.
set -euo pipefail

echo "=== Installing Erlang + RabbitMQ ==="
install -m 0755 -d /usr/share/keyrings
rm -f /usr/share/keyrings/rabbitmq-archive-keyring.gpg
for key_url in \
  "https://keys.openpgp.org/vks/v1/by-fingerprint/0A9AF2115F4687BD29803A206B73A36E6026DFCA" \
  "https://github.com/rabbitmq/signing-keys/releases/download/3.0/rabbitmq-release-signing-key.asc" \
  "https://github.com/rabbitmq/signing-keys/releases/download/2.0/rabbitmq-release-signing-key.asc"; do
  curl -fsSL "${key_url}" | gpg --dearmor >> /usr/share/keyrings/rabbitmq-archive-keyring.gpg
done
chmod 0644 /usr/share/keyrings/rabbitmq-archive-keyring.gpg

CODENAME="$(lsb_release -cs)"
ARCH="$(dpkg --print-architecture)"
cat > /etc/apt/sources.list.d/rabbitmq.list << EOF
deb [arch=${ARCH} signed-by=/usr/share/keyrings/rabbitmq-archive-keyring.gpg] https://deb1.rabbitmq.com/rabbitmq-erlang/ubuntu ${CODENAME} main
deb [arch=${ARCH} signed-by=/usr/share/keyrings/rabbitmq-archive-keyring.gpg] https://deb2.rabbitmq.com/rabbitmq-erlang/ubuntu ${CODENAME} main
deb [arch=${ARCH} signed-by=/usr/share/keyrings/rabbitmq-archive-keyring.gpg] https://deb1.rabbitmq.com/rabbitmq-server/ubuntu ${CODENAME} main
deb [arch=${ARCH} signed-by=/usr/share/keyrings/rabbitmq-archive-keyring.gpg] https://deb2.rabbitmq.com/rabbitmq-server/ubuntu ${CODENAME} main
EOF
apt-get update -y
apt-get install -y \
  erlang-base erlang-asn1 erlang-crypto erlang-eldap erlang-ftp \
  erlang-inets erlang-mnesia erlang-os-mon erlang-parsetools \
  erlang-public-key erlang-runtime-tools erlang-snmp erlang-ssl \
  erlang-syntax-tools erlang-tftp erlang-tools erlang-xmerl \
  rabbitmq-server

systemctl enable rabbitmq-server
systemctl start rabbitmq-server
rabbitmq-plugins enable rabbitmq_management

read -rsp "RabbitMQ app username: " RABBITMQ_USER;     echo
read -rsp "RabbitMQ app password: " RABBITMQ_PASSWORD; echo

rabbitmqctl delete_user guest 2>/dev/null || true
rabbitmqctl add_user "${RABBITMQ_USER}" "${RABBITMQ_PASSWORD}"
rabbitmqctl set_user_tags "${RABBITMQ_USER}" administrator
rabbitmqctl set_permissions -p "/" "${RABBITMQ_USER}" ".*" ".*" ".*"

APP_INTERNAL_NETWORK="${APP_INTERNAL_NETWORK:-app_internal}"
APP_DOCKER_SUBNET="${APP_DOCKER_SUBNET:-172.18.0.0/16}"
DOCKER_GW="${APP_DOCKER_GATEWAY:-172.18.0.1}"

if command -v docker >/dev/null 2>&1 && ! docker network inspect "${APP_INTERNAL_NETWORK}" >/dev/null 2>&1; then
  docker network create \
    --driver bridge \
    --subnet "${APP_DOCKER_SUBNET}" \
    --gateway "${DOCKER_GW}" \
    "${APP_INTERNAL_NETWORK}"
fi

cat > /etc/rabbitmq/rabbitmq.conf << EOF
listeners.tcp.1 = 127.0.0.1:5672
listeners.tcp.2 = ${DOCKER_GW}:5672
management.listener.ip = 127.0.0.1
management.listener.port = 15672
heartbeat = 60
vm_memory_high_watermark.relative = 0.6
disk_free_limit.relative = 1.5
log.file.level = warning
EOF

systemctl restart rabbitmq-server
rabbitmqctl status | grep -q "RabbitMQ" \
  && echo "RabbitMQ: OK" \
  || (echo "RabbitMQ: FAILED" && exit 1)

echo ""
echo "=== DONE: 04-rabbitmq.sh ==="
echo "RabbitMQ listens on 127.0.0.1 and ${DOCKER_GW}."
echo "Management UI via SSH tunnel: ssh -L 15672:localhost:15672 deploy@YOUR_VPS_IP"
echo "NEXT: DOMAIN=api.yourdomain.com EMAIL=you@example.com bash 05-nginx.sh"
