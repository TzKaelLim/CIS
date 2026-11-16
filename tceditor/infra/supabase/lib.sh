# Shared helpers for infra/supabase/up.sh, down.sh and reset.sh.
# Source it from those scripts; do not run it directly.
#
# Every docker compose call goes through compose(), which pins the project name
# and both compose files, so these scripts only ever act on the tceditor
# project, whatever COMPOSE_* variables the calling shell exports.

TCEDITOR_PROJECT=tceditor
SUPABASE_DOCKER_DIR=$(cd "$(dirname "$0")/docker" && pwd -P)

case "$SUPABASE_DOCKER_DIR" in
    */infra/supabase/docker) ;;
    *)
        echo "$0: unexpected stack directory: $SUPABASE_DOCKER_DIR" >&2
        exit 1
        ;;
esac
if [ ! -f "$SUPABASE_DOCKER_DIR/docker-compose.tceditor.yml" ]; then
    echo "$0: missing $SUPABASE_DOCKER_DIR/docker-compose.tceditor.yml" >&2
    exit 1
fi

# docker/.env is the only configuration source.
unset COMPOSE_PROJECT_NAME COMPOSE_FILE COMPOSE_PROFILES COMPOSE_ENV_FILES \
    API_GW_HTTP_PORT POSTGRES_HOST_PORT POOLER_PROXY_PORT_TRANSACTION

if [ -f "$SUPABASE_DOCKER_DIR/.env" ]; then
    SUPABASE_ENV_FILE=$SUPABASE_DOCKER_DIR/.env
else
    # Lets down.sh and reset.sh run before setup-env.sh has created .env.
    SUPABASE_ENV_FILE=$SUPABASE_DOCKER_DIR/.env.example
fi

# docker compose lets exported shell variables override --env-file values, so
# drop every key the env file sets: a stray `export POSTGRES_PASSWORD=...` (or a
# shell that sourced another stack's .env) must not leak into this stack.
# Keys match [A-Za-z_][A-Za-z0-9_]*, so splitting the list on whitespace is safe.
# shellcheck disable=SC2013
for env_key in $(sed -n 's/^\([A-Za-z_][A-Za-z0-9_]*\)=.*/\1/p' "$SUPABASE_ENV_FILE"); do
    unset "$env_key"
done

# docker compose with the tceditor files but without a forced project name.
compose_files() {
    docker compose --project-directory "$SUPABASE_DOCKER_DIR" --env-file "$SUPABASE_ENV_FILE" \
        -f "$SUPABASE_DOCKER_DIR/docker-compose.yml" \
        -f "$SUPABASE_DOCKER_DIR/docker-compose.tceditor.yml" "$@"
}

compose() {
    compose_files -p "$TCEDITOR_PROJECT" "$@"
}

require_docker() {
    if ! docker info >/dev/null 2>&1; then
        echo "$0: cannot reach the Docker daemon; start Docker Desktop first." >&2
        exit 1
    fi
}

# Refuse to continue unless the compose files on their own resolve to the
# tceditor project, so that a plain `docker compose` run in docker/ and these
# scripts always address the same containers and volumes.
require_tceditor_project() {
    resolved=$(compose_files config 2>/dev/null | sed -n 's/^name: //p' | head -n 1)
    if [ "$resolved" != "$TCEDITOR_PROJECT" ]; then
        echo "$0: compose project resolves to '$resolved', expected '$TCEDITOR_PROJECT'; refusing to continue." >&2
        exit 1
    fi
}
