#!/bin/sh
set -eu

timeout="${TIMEOUT_SECONDS:-120}"
end=$(( $(date +%s) + timeout ))

for url in http://localhost:8080/health http://localhost:8081/health http://localhost:8082/health http://localhost:8083/health http://localhost:8084/health http://localhost:8085/health; do
  while [ "$(date +%s)" -lt "$end" ]; do
    if wget -qO- "$url" | grep -q '"status":"ok"'; then
      echo "$url ok"
      break
    fi
    sleep 2
  done
  if [ "$(date +%s)" -ge "$end" ]; then
    echo "Timed out waiting for $url" >&2
    exit 1
  fi
done
