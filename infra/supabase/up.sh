#!/bin/sh
#
# Start the tceditor Supabase dev stack and wait until every service is healthy.
# Refuses to start when a host port it needs is taken by anything else.
#
# Usage: infra/supabase/up.sh
#
set -eu
. "$(dirname "$0")/lib.sh"

if [ ! -f "$SUPABASE_DOCKER_DIR/.env" ]; then
    echo "up: infra/supabase/docker/.env not found; run infra/supabase/setup-env.sh first." >&2
    exit 1
fi

require_docker
require_tceditor_project

config=$(compose config)

# Every published port must be bound to 127.0.0.1 (no host_ip means 0.0.0.0).
published_count=$(printf '%s\n' "$config" | grep -c '^ *published: ' || true)
loopback_count=$(printf '%s\n' "$config" | grep -c '^ *host_ip: 127\.0\.0\.1$' || true)
if [ "$published_count" != "$loopback_count" ]; then
    echo "up: some published ports are not bound to 127.0.0.1; check docker-compose.tceditor.yml." >&2
    exit 1
fi

# A port is fine when it is free, or already published by this stack (up.sh run twice).
ports=$(printf '%s\n' "$config" | sed -n 's/^ *published: "\{0,1\}\([0-9][0-9]*\)"\{0,1\}$/\1/p')
for port in $ports; do
    if [ -n "$(docker ps -q --filter "label=com.docker.compose.project=$TCEDITOR_PROJECT" --filter "publish=$port")" ]; then
        continue
    fi
    if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 || nc -z 127.0.0.1 "$port" >/dev/null 2>&1; then
        echo "up: port $port is already in use; not starting the stack." >&2
        lsof -nP -iTCP:"$port" -sTCP:LISTEN >&2 || true
        docker ps --filter "publish=$port" --format '  container {{.Names}}: {{.Ports}}' >&2
        echo "up: free port $port (or stop whatever owns it), then run up.sh again." >&2
        exit 1
    fi
done

if ! compose up -d --wait --wait-timeout 300; then
    compose ps -a --format 'table {{.Name}}\t{{.Status}}' >&2
    echo "up: the stack did not become healthy. Inspect a service with" >&2
    echo "up:   docker compose -p $TCEDITOR_PROJECT logs <service>" >&2
    echo "up: then run infra/supabase/down.sh before trying again." >&2
    exit 1
fi
compose ps --format 'table {{.Name}}\t{{.Status}}'

echo ""
echo "up: tceditor Supabase is running."
echo "  API gateway + Studio:  http://127.0.0.1:8200  (Studio login: DASHBOARD_USERNAME / DASHBOARD_PASSWORD)"
echo "  Postgres, session:     127.0.0.1:5434  user postgres.tceditor  (POSTGRES_PASSWORD)"
echo "  Postgres, transaction: 127.0.0.1:6545  user postgres.tceditor"
echo "  Keys and passwords are in infra/supabase/docker/.env (ANON_KEY, SERVICE_ROLE_KEY, ...)."
