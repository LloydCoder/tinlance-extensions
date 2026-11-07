#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must point to the migrated PostgreSQL 16 test database}"

tenant_id="concurrency-tenant"
key_prefix="concurrent-claim-$(date +%s)-$$"
worker_a_output="$(mktemp)"
worker_b_output="$(mktemp)"
trap 'rm -f "$worker_a_output" "$worker_b_output"' EXIT

psql "$DATABASE_URL" -X -q -v ON_ERROR_STOP=1 <<SQL
INSERT INTO tenants(id) VALUES ('$tenant_id') ON CONFLICT DO NOTHING;
INSERT INTO jobs(tenant_id, idempotency_key, job_type, payload)
VALUES
  ('$tenant_id', '$key_prefix-a', 'test.concurrent', '{}'),
  ('$tenant_id', '$key_prefix-b', 'test.concurrent', '{}');
SQL

claim_one() {
  local output_file="$1"
  psql "$DATABASE_URL" -X -qAt -v ON_ERROR_STOP=1 >"$output_file" <<SQL
BEGIN;
SET ROLE tinlance_app_runtime;
SELECT set_config('app.tenant_id', '$tenant_id', true);
SELECT id FROM claim_next_job(60);
-- Hold the transaction open so the second session must contend with a
-- genuinely locked row while FOR UPDATE SKIP LOCKED selects another job.
SELECT pg_sleep(2);
COMMIT;
SQL
}

claim_one "$worker_a_output" &
worker_a_pid=$!
claim_one "$worker_b_output" &
worker_b_pid=$!

wait "$worker_a_pid"
wait "$worker_b_pid"

worker_a_id="$(grep -E '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' "$worker_a_output" | head -n 1 || true)"
worker_b_id="$(grep -E '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' "$worker_b_output" | head -n 1 || true)"

if [[ -z "$worker_a_id" || -z "$worker_b_id" ]]; then
  echo "Expected both concurrent workers to claim one job" >&2
  cat "$worker_a_output" "$worker_b_output" >&2
  exit 1
fi

if [[ "$worker_a_id" == "$worker_b_id" ]]; then
  echo "Concurrent workers claimed the same job: $worker_a_id" >&2
  exit 1
fi

remaining="$(psql "$DATABASE_URL" -X -qAt -v ON_ERROR_STOP=1 <<SQL
SET ROLE tinlance_app_runtime;
SELECT set_config('app.tenant_id', '$tenant_id', true);
SELECT count(*) FROM claim_next_job(60);
SQL
)"
remaining="$(printf '%s\n' "$remaining" | grep -E '^[0-9]+$' | tail -n 1)"
if [[ "$remaining" != "0" ]]; then
  echo "Expected no queued job after two successful concurrent claims; got: $remaining" >&2
  exit 1
fi

printf 'A3 concurrent worker claim test passed: %s and %s were claimed exactly once.\n' "$worker_a_id" "$worker_b_id"
