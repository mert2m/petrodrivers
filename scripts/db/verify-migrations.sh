#!/usr/bin/env bash
# verify-migrations.sh — apply the real migrations against a throwaway PostGIS container (+ auth/storage
# shims) to prove they parse, create, index, and enforce RLS cleanly. LOCAL VERIFICATION ONLY.
set -euo pipefail

CONTAINER="${PD_PG_CONTAINER:-pd_pg}"
HOSTPORT="${PD_PG_PORT:-55432}"
# Multi-arch PostGIS (arm64 + amd64) so it runs natively on Apple Silicon and on CI amd64 runners.
IMAGE="${PD_PG_IMAGE:-imresamu/postgis:16-3.4}"
DBURL="postgresql://postgres:postgres@localhost:${HOSTPORT}/petrodrivers"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIG="${HERE}/../../supabase/migrations"

export PGPASSWORD=postgres
PSQL=(docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U postgres -d petrodrivers)

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "==> starting throwaway PostGIS container '$CONTAINER' on port ${HOSTPORT}"
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  # --shm-size=1g: PostGIS crashes (exit 3) under the default 64MB /dev/shm when loading the extension.
  docker run -d --name "$CONTAINER" --shm-size=1g \
    -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=petrodrivers \
    -p "${HOSTPORT}:5432" "$IMAGE" >/dev/null
fi

# The postgis image loads the extension during first-boot init; pg_isready reports ready on the temp
# initdb server BEFORE that finishes, which races our CREATE EXTENSION. Wait for the init-complete marker
# first (present in logs for both fresh and reused containers), then wait for the real server.
echo "==> waiting for postgres (incl. first-boot PostGIS init) in '$CONTAINER'..."
for i in $(seq 1 120); do
  if docker logs "$CONTAINER" 2>&1 | grep -q "PostgreSQL init process complete"; then break; fi
  sleep 1
done
for i in $(seq 1 30); do
  if docker exec "$CONTAINER" pg_isready -U postgres -d petrodrivers >/dev/null 2>&1; then break; fi
  sleep 1
done
sleep 1

echo "==> applying local auth/storage shims (NOT a migration)"
"${PSQL[@]}" < "${HERE}/local-verify-shims.sql"

for f in "$MIG"/0*.sql; do
  echo "==> applying $(basename "$f")"
  "${PSQL[@]}" < "$f"
done

echo "==> re-applying ALL migrations a second time (idempotency check)"
for f in "$MIG"/0*.sql; do "${PSQL[@]}" < "$f" >/dev/null; done

echo "==> sanity counts"
"${PSQL[@]}" -c "select count(*) as tables from information_schema.tables where table_schema='public';"
"${PSQL[@]}" -c "select count(*) as policies from pg_policies where schemaname in ('public','storage');"
echo "==> OK: migrations apply cleanly and are idempotent."
