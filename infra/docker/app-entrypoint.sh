#!/bin/sh
set -eu

if [ -d /run/secrets ]; then
  mkdir -p /tmp/secrets
  chmod 0700 /tmp/secrets

  for src in /run/secrets/*; do
    [ -f "$src" ] || continue
    name="$(basename "$src")"
    dst="/tmp/secrets/$name"
    cp "$src" "$dst"
    chown app:app "$dst"
    chmod 0400 "$dst"
  done
  chown app:app /tmp/secrets

  env_file="/tmp/secrets/env.sh"
  : > "$env_file"
  chmod 0600 "$env_file"

  env | while IFS='=' read -r key value; do
    case "$key" in
      *_FILE)
        case "$value" in
          /run/secrets/*)
            printf 'export %s=%s\n' "$key" "/tmp/secrets/$(basename "$value")" >> "$env_file"
            ;;
        esac
        ;;
    esac
  done

  for key in JWT_PRIVATE_KEY_PATH JWT_PUBLIC_KEY_PATH RS256_PUBLIC_KEY_PATH; do
    eval "value=\${$key:-}"
    case "$value" in
      /run/secrets/*)
        printf 'export %s=%s\n' "$key" "/tmp/secrets/$(basename "$value")" >> "$env_file"
        ;;
    esac
  done

  # shellcheck disable=SC1090
  . "$env_file"
fi

exec su-exec app "$@"
