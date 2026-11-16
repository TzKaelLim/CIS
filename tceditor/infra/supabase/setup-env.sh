#!/bin/sh
#
# Create infra/supabase/docker/.env for the tceditor Supabase dev stack.
#
# Copies the upstream .env.example, fills every secret with the official
# utils/generate-keys.sh, then applies the tceditor settings (project files,
# 127.0.0.1 URLs and ports, email auto-confirm). Secrets are written to
# docker/.env only (mode 600) and never printed.
#
# Usage: infra/supabase/setup-env.sh
#
set -eu

cd "$(dirname "$0")/docker"

if [ -e .env ] || [ -L .env ]; then
    echo "setup-env: docker/.env already exists; refusing to overwrite it." >&2
    echo "setup-env: to regenerate secrets: run reset.sh (an existing database keeps the old" >&2
    echo "setup-env: passwords), delete docker/.env, then run this script again." >&2
    exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
    echo "setup-env: openssl is required." >&2
    exit 1
fi

# Value of KEY in FILE (last assignment wins, like docker compose).
env_get() {
    sed -n "s/^$1=//p" "$2" | tail -n 1
}

# Replace KEY=... in .env, or append it when the key is missing.
set_env() {
    if grep -q "^$1=" .env; then
        awk -v k="$1" -v v="$2" 'index($0, k "=") == 1 { print k "=" v; next } { print }' .env >.env.tmp
    else
        cp .env .env.tmp
        printf '%s=%s\n' "$1" "$2" >>.env.tmp
    fi
    mv .env.tmp .env
}

umask 077
env_ready=0
# On any failure, leave no half-written docker/.env behind.
trap 'rm -f .env.tmp .env.old; [ "$env_ready" = 1 ] || rm -f .env' EXIT

cp .env.example .env
# Writes JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY, POSTGRES_PASSWORD,
# DASHBOARD_PASSWORD and the other secrets into .env (backup in .env.old).
sh utils/generate-keys.sh --update-env >/dev/null

set_env COMPOSE_FILE docker-compose.yml:docker-compose.tceditor.yml
set_env SUPABASE_PUBLIC_URL http://127.0.0.1:8200
set_env API_EXTERNAL_URL http://127.0.0.1:8200/auth/v1
set_env SITE_URL http://127.0.0.1:8200
set_env ENABLE_EMAIL_AUTOCONFIRM true
set_env POOLER_TENANT_ID tceditor
set_env API_GW_HTTP_PORT 8200
set_env POSTGRES_HOST_PORT 5434
set_env POOLER_PROXY_PORT_TRANSACTION 6545
chmod 600 .env

for key in POSTGRES_PASSWORD JWT_SECRET ANON_KEY SERVICE_ROLE_KEY DASHBOARD_PASSWORD \
    SECRET_KEY_BASE REALTIME_DB_ENC_KEY VAULT_ENC_KEY PG_META_CRYPTO_KEY \
    S3_PROTOCOL_ACCESS_KEY_ID S3_PROTOCOL_ACCESS_KEY_SECRET; do
    value=$(env_get "$key" .env)
    if [ -z "$value" ] || [ "$value" = "$(env_get "$key" .env.example)" ]; then
        echo "setup-env: $key was not generated; removed docker/.env." >&2
        exit 1
    fi
done
env_ready=1

echo "setup-env: wrote infra/supabase/docker/.env (mode 600, git-ignored)."
echo "setup-env: Studio login is DASHBOARD_USERNAME / DASHBOARD_PASSWORD in that file."
echo "setup-env: next, run infra/supabase/up.sh"
