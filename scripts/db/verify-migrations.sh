#!/usr/bin/env bash
# verify-migrations.sh — apply the real migrations against a throwaway PostGIS container (+ auth/storage
# shims) to prove they parse, create, index, and enforce RLS cleanly. LOCAL VERIFICATION ONLY.
set -euo pipefail

CONTAINER="${PD_PG_CONTAINER:-pd_pg}"
HOSTPORT="${PD_PG_PORT:-55432}"
DBURL="postgresql://postgres:postgres@localhost:${HOSTPORT}/petrodrivers"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIG="${HERE}/../../supabase/migrations"

export PGPASSWORD=postgres
PSQL=(docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U postgres -d petrodrivers)

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "==> starting throwaway PostGIS container '$CONTAINER' on port ${HOSTPORT}"
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  docker run -d --name "$CONTAINER" -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=petrodrivers \
    -p "${HOSTPORT}:5432" postgis/postgis:16-3.4 >/dev/null
fi

echo "==> waiting for postgres in container '$CONTAINER'..."
for i in $(seq 1 60); do
  if docker exec "$CONTAINER" pg_isready -U postgres -d petrodrivers >/dev/null 2>&1; then break; fi
  sleep 1
done

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
