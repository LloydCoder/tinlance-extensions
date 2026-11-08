#!/usr/bin/env bash
set -Eeuo pipefail

: "\${PGPASSWORD:?PGPASSWORD is required for the isolated PostgreSQL rollback test}"
host="\${PGHOST:-127.0.0.1}"
port="\${PGPORT:-5432}"
user="\${PGUSER:-postgres}"
database="tinlance_rollback_test"
migration_dir="spikes/architecture-feasibility/a3-backend-api/migrations"
rollback_file="spikes/architecture-feasibility/a3-backend-api/rollback/rollback-all-test-only.sql"

createdb --host="$host" --port="$port" --username="$user" "$database"
cleanup() {
  dropdb --if-exists --host="$host" --port="$port" --username="$user" "$database" >/dev/null 2>&1 || true
}
trap cleanup EXIT

connection="host=$host port=$port dbname=$database user=$user"
for migration in "$migration_dir"/0*.sql; do
  psql "$connection" -v ON_ERROR_STOP=1 -f "$migration"
done

# Prove the rollback refuses to destroy a non-empty schema.
psql "$connection" -v ON_ERROR_STOP=1 -c "INSERT INTO public.tenants (id) VALUES ('rollback_guard');"
if psql "$connection" -v ON_ERROR_STOP=1 -v confirm_a3_spike_rollback=true -f "$rollback_file"; then
  echo "ERROR: destructive rollback unexpectedly succeeded while tenant data existed" >&2
  exit 1
fi

# Remove the sentinel and prove the explicitly confirmed, empty-spike rollback.
psql "$connection" -v ON_ERROR_STOP=1 -c "DELETE FROM public.tenants WHERE id = 'rollback_guard';"
psql "$connection" -v ON_ERROR_STOP=1 -v confirm_a3_spike_rollback=true -f "$rollback_file"
