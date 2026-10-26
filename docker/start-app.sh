#!/usr/bin/env bash
# Starts a local copy of the Toolshop app (UI :4200, API :8091) with a freshly seeded database.
# Used by CI and for running the tests locally without touching the public site.
set -euo pipefail

cd "$(dirname "$0")/.."
COMPOSE="docker compose -f docker/docker-compose.yml"

# The project's license allows running its software but not publishing copies, so the nginx config
# is downloaded at start-up instead of being committed here. The URL is pinned to a commit, so the
# content cannot change underneath us.
UPSTREAM_REF=50b51f31a0bada82c75de2eff9dead25ccf8bc30
mkdir -p docker/nginx
curl -fsSL --retry 3 --retry-all-errors --connect-timeout 10 --max-time 60 \
  "https://raw.githubusercontent.com/testsmith-io/practice-software-testing/${UPSTREAM_REF}/_docker/vhost.conf" \
  -o docker/nginx/default.conf

$COMPOSE up -d

# retry <description> <attempts> <command...>: runs the command until it succeeds, printing its
# output (and the container logs) only when it never does
retry() {
  local description=$1 attempts=$2 output=""
  shift 2
  for i in $(seq 1 "$attempts"); do
    if output=$("$@" 2>&1); then
      echo "$description: ok"
      return 0
    fi
    echo "Attempt $i/$attempts: $description not ready, waiting 3s"
    sleep 3
  done
  echo "::error::$description did not succeed"
  echo "$output"
  $COMPOSE logs --tail=50
  return 1
}

retry "database" 30 $COMPOSE exec -T mariadb mysqladmin ping -h localhost -u root -proot --silent
# migrate:fresh drops everything first, so retrying it while the API container is still starting is safe
retry "database migration and seeding" 20 $COMPOSE exec -T laravel-api php artisan migrate:fresh --seed --force
retry "API" 30 curl -fsS http://localhost:8091/status
# The Angular dev server compiles on start, which takes a while
retry "UI" 100 curl -fsS http://localhost:4200
