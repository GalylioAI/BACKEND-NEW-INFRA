#!/usr/bin/env bash
# Run as root after 03-redis.sh.
set -euo pipefail

echo "=== Installing Erlang + RabbitMQ 3.13 ==="
curl -1sLf https://dl.cloudsmith.io/public/rabbitmq/rabbitmq-erlang/setup.deb.sh | bash
curl -1sLf https://dl.cloudsmith.io/public/rabbitmq/rabbitmq-server/setup.deb.sh  | bash
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

DOCKER_GW="$(ip -4 addr show docker0 | awk '/inet / {print $2}' | cut -d/ -f1 | head -n1)"
DOCKER_GW="${DOCKER_GW:-172.17.0.1}"

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
