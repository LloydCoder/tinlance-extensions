#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must use the restricted tinlance_app_login role}"
: "${ADMIN_DATABASE_URL:?ADMIN_DATABASE_URL is required for backup and restore administration}"

work_dir="$(mktemp -d)"
suffix="$(openssl rand -hex 6)"
tenant_id="restore-${suffix}"
record_id="restore-${suffix}"
event_id="00000000-0000-4000-8000-${suffix}"
restore_db="tinlance_restore_${suffix}"
archive="${work_dir}/database.dump"

make_database_url() {
  node -e 'const url = new URL(process.argv[1]); url.pathname = "/" + process.argv[2]; process.stdout.write(url.toString());' "$1" "$2"
}

restore_admin_url="$(make_database_url "$ADMIN_DATABASE_URL" "$restore_db")"
restore_app_url="$(make_database_url "$DATABASE_URL" "$restore_db")"

cleanup() {
  dropdb --if-exists --force --maintenance-db="$ADMIN_DATABASE_URL" "$restore_db" >/dev/null 2>&1 || true
  psql "$ADMIN_DATABASE_URL" -v ON_ERROR_STOP=1 -v tenant_id="$tenant_id" <<'SQL' >/dev/null 2>&1 || true
DELETE FROM public.tenants WHERE id = :'tenant_id';
SQL
  rm -rf "$work_dir"
}
trap cleanup EXIT

# Seed a unique tenant-owned row so the restore assertion proves data recovery,
# not merely that pg_restore returned a zero exit code.
psql "$ADMIN_DATABASE_URL" -v ON_ERROR_STOP=1 -v tenant_id="$tenant_id" -v record_id="$record_id" -v event_id="$event_id" <<'SQL'
INSERT INTO public.tenants(id) VALUES (:'tenant_id');
INSERT INTO public.tenant_records(id, tenant_id, payload)
VALUES (:'record_id', :'tenant_id', '{"restore":"verified"}'::jsonb);
INSERT INTO public.consumer_inbox(tenant_id, consumer_name, event_id, payload)
VALUES (:'tenant_id', 'restore.receiver', :'event_id', '{"restore":"inbox"}'::jsonb);
SQL

# Custom format is compressed and supports pg_restore inspection and selective
# restoration. The archive remains local to this ephemeral CI job.
pg_dump --format=custom --file="$archive" "$ADMIN_DATABASE_URL"
test -s "$archive"
pg_restore --list "$archive" > "${work_dir}/toc.list"
grep -q "tenant_records" "${work_dir}/toc.list"

createdb --maintenance-db="$ADMIN_DATABASE_URL" --template=template0 "$restore_db"
pg_restore --exit-on-error --no-owner --dbname="$restore_admin_url" "$archive"

# Database-level dumps do not include cluster-global roles. The test cluster
# already has the roles from migration setup; grant CONNECT on the new database
# so the restored application login can prove its RLS boundary.
psql "$ADMIN_DATABASE_URL" -v ON_ERROR_STOP=1 -v restore_db="$restore_db" <<'SQL'
GRANT CONNECT ON DATABASE :"restore_db" TO tinlance_app_login;
SQL

restored_count="$(psql "$restore_admin_url" -v ON_ERROR_STOP=1 -v tenant_id="$tenant_id" -At <<'SQL'
SELECT count(*) FROM public.tenant_records WHERE tenant_id = :'tenant_id';
SQL
)"
if [[ "$restored_count" != "1" ]]; then
  echo "expected one restored tenant record, found: $restored_count" >&2
  exit 1
fi

restored_functions="$(psql "$restore_admin_url" -v ON_ERROR_STOP=1 -At <<'SQL'
SELECT count(*) FROM pg_proc
WHERE proname IN (
  'claim_next_job',
  'cancel_job',
  'claim_outbox_events',
  'renew_outbox_lease',
  'fail_outbox_event',
  'accept_consumer_event'
);
SQL
)"
if [[ "$restored_functions" -lt "6" ]]; then
  echo "expected all worker/outbox/cancellation functions after restore, found: $restored_functions" >&2
  exit 1
fi

forced_rls_tables="$(psql "$restore_admin_url" -v ON_ERROR_STOP=1 -At <<'SQL'
SELECT count(*) FROM pg_class
WHERE relkind = 'r'
  AND relname IN ('tenant_records', 'jobs', 'outbox_events', 'consumer_inbox')
  AND relrowsecurity
  AND relforcerowsecurity;
SQL
)"
if [[ "$forced_rls_tables" != "4" ]]; then
  echo "expected forced RLS on all four tenant tables after restore, found: $forced_rls_tables" >&2
  exit 1
fi

# Verify the restored data through the same non-superuser login and explicit
# transaction-local runtime role/tenant context used by the application.
psql "$restore_app_url" -v ON_ERROR_STOP=1 -v tenant_id="$tenant_id" <<'SQL'
BEGIN;
SET LOCAL ROLE tinlance_app_runtime;
SELECT set_config('app.tenant_id', :'tenant_id', true);
DO $$
DECLARE visible_count integer;
BEGIN
  SELECT count(*) INTO visible_count FROM public.tenant_records;
  IF visible_count <> 1 THEN
    RAISE EXCEPTION 'restored application login did not observe exactly one tenant record: %', visible_count;
  END IF;
  SELECT count(*) INTO visible_count FROM public.consumer_inbox;
  IF visible_count <> 1 THEN
    RAISE EXCEPTION 'restored application login did not observe exactly one inbox event: %', visible_count;
  END IF;
END $$;
ROLLBACK;
SQL

echo "PostgreSQL custom-format backup and fresh-database restore passed; tenant RLS, application login, worker, outbox, consumer inbox and cancellation contracts were restored."
