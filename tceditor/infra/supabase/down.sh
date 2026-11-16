#!/bin/sh
#
# Stop the tceditor Supabase dev stack: removes its containers and network.
# Data is kept (named volumes and docker/volumes/db/data, docker/volumes/storage);
# reset.sh is the only script that deletes it.
#
# Usage: infra/supabase/down.sh
#
set -eu
. "$(dirname "$0")/lib.sh"

require_docker
require_tceditor_project

compose down --remove-orphans
echo "down: tceditor Supabase stopped; data is kept."
