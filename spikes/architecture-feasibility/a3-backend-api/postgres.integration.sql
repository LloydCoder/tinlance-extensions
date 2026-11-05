\set ON_ERROR_STOP on
BEGIN;
INSERT INTO tenants(id) VALUES ('tenant-a'), ('tenant-b') ON CONFLICT DO NOTHING;
INSERT INTO tenant_records(id, tenant_id, payload) VALUES
 ('record-a','tenant-a','{"value":"alpha"}'),
 ('record-b','tenant-b','{"value":"beta"}')
ON CONFLICT DO NOTHING;
COMMIT;

-- The runtime role must not see or mutate another tenant's rows.
BEGIN;
SET LOCAL ROLE tinlance_app_runtime;
SELECT set_config('app.tenant_id','tenant-a',true);
DO $$
DECLARE visible_count integer;
BEGIN
  SELECT count(*) INTO visible_count FROM tenant_records;
  IF visible_count <> 1 THEN RAISE EXCEPTION 'tenant isolation failed: expected 1 visible row, got %', visible_count; END IF;
  IF EXISTS (SELECT 1 FROM tenant_records WHERE id = 'record-b') THEN
    RAISE EXCEPTION 'cross-tenant record leaked';
  END IF;
END $$;
ROLLBACK;

-- Missing tenant context is fail-closed.
BEGIN;
SET LOCAL ROLE tinlance_app_runtime;
DO $$
DECLARE visible_count integer;
BEGIN
  SELECT count(*) INTO visible_count FROM tenant_records;
  IF visible_count <> 0 THEN RAISE EXCEPTION 'missing tenant context exposed rows'; END IF;
END $$;
ROLLBACK;

-- Idempotency and transactional outbox: one job and one event per tenant/key.
BEGIN;
SET LOCAL ROLE tinlance_app_runtime;
SELECT set_config('app.tenant_id','tenant-a',true);
WITH inserted AS (
  INSERT INTO jobs(tenant_id,idempotency_key,job_type,payload)
  VALUES ('tenant-a','idem-001','evidence.scan','{"source":"test"}')
  ON CONFLICT (tenant_id,idempotency_key) DO NOTHING
  RETURNING id, tenant_id
)
INSERT INTO outbox_events(tenant_id,aggregate_id,event_type,payload)
SELECT tenant_id,id,'job.created','{}'::jsonb FROM inserted
ON CONFLICT (aggregate_id,event_type) DO NOTHING;
INSERT INTO jobs(tenant_id,idempotency_key,job_type,payload)
VALUES ('tenant-a','idem-001','evidence.scan','{"source":"duplicate"}')
ON CONFLICT (tenant_id,idempotency_key) DO NOTHING;
DO $$
DECLARE job_count integer; event_count integer;
BEGIN
 SELECT count(*) INTO job_count FROM jobs WHERE tenant_id='tenant-a' AND idempotency_key='idem-001';
 SELECT count(*) INTO event_count FROM outbox_events WHERE tenant_id='tenant-a' AND event_type='job.created';
 IF job_count <> 1 OR event_count <> 1 THEN RAISE EXCEPTION 'idempotent enqueue/outbox invariant failed'; END IF;
END $$;
ROLLBACK;

-- Atomic enqueue rollback must leave neither job nor outbox event.
DO $$
DECLARE job_count integer; event_count integer;
BEGIN
 SELECT count(*) INTO job_count FROM jobs WHERE tenant_id='tenant-a' AND idempotency_key='idem-001';
 SELECT count(*) INTO event_count FROM outbox_events WHERE tenant_id='tenant-a' AND event_type='job.created';
 IF job_count <> 0 OR event_count <> 0 THEN RAISE EXCEPTION 'transaction rollback left partial enqueue'; END IF;
END $$;

\echo 'A3 PostgreSQL tenancy, idempotency and transactional outbox checks passed'
