#!/bin/sh
#
# Delete ALL data of the tceditor Supabase dev stack: its containers, its named
# volumes (<project>_db-config, <project>_deno-cache) and the bind-mounted data
# directories docker/volumes/db/data and docker/volumes/storage.
# docker/.env is kept, so the next up.sh starts an empty database with the same
# secrets. Nothing outside the tceditor compose project is touched.
#
# Usage: infra/supabase/reset.sh [--yes]
#
set -eu
. "$(dirname "$0")/lib.sh"

assume_yes=0
case "${1:-}" in
    "") ;;
    -y | --yes) assume_yes=1 ;;
    *)
        echo "usage: $0 [--yes]" >&2
        exit 2
        ;;
esac

require_docker
require_tceditor_project

db_data_dir=$SUPABASE_DOCKER_DIR/volumes/db/data
storage_dir=$SUPABASE_DOCKER_DIR/volumes/storage

echo "reset: this permanently deletes the data of compose project '$TCEDITOR_PROJECT':"
echo "  containers:"
docker ps -a --filter "label=com.docker.compose.project=$TCEDITOR_PROJECT" --format '{{.Names}}' | sed 's/^/    /'
echo "  volumes:"
docker volume ls --filter "label=com.docker.compose.project=$TCEDITOR_PROJECT" --format '{{.Name}}' | sed 's/^/    /'
echo "  directories:"
echo "    $db_data_dir"
echo "    $storage_dir"

if [ "$assume_yes" != 1 ]; then
    if [ ! -t 0 ]; then
        echo "reset: stdin is not a terminal; pass --yes to confirm." >&2
        exit 1
    fi
    printf "Type the project name (%s) to confirm: " "$TCEDITOR_PROJECT"
    read -r answer || answer=
    if [ "$answer" != "$TCEDITOR_PROJECT" ]; then
        echo "reset: cancelled; nothing was deleted."
        exit 1
    fi
fi

# down -v removes only the volumes that belong to this compose project.
compose down -v --remove-orphans
rm -rf "$db_data_dir" "$storage_dir"
echo "reset: done. Run infra/supabase/up.sh to start with an empty database."
