\set ON_ERROR_STOP on
INSERT INTO tenants(id) VALUES ('worker-tenant'), ('other-worker-tenant') ON CONFLICT DO NOTHING;
INSERT INTO jobs(tenant_id,idempotency_key,job_type,payload)
VALUES
 ('worker-tenant','worker-lease-001','test.worker','{}'),
 ('other-worker-tenant','other-tenant-queued','test.worker','{}')
ON CONFLICT (tenant_id,idempotency_key) DO NOTHING;

-- The definer functions must fail closed without trusted tenant context.
DO $$
BEGIN
  BEGIN
    PERFORM * FROM claim_next_job(60);
    RAISE EXCEPTION 'claim succeeded without tenant context';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'claim succeeded without tenant context' THEN RAISE; END IF;
    IF SQLERRM <> 'tenant context is required' THEN RAISE; END IF;
  END;
END $$;
SELECT set_config('app.tenant_id','worker-tenant',false);

-- A worker must not claim another tenant's queued job.
DO $$
DECLARE claimed jobs%ROWTYPE;
BEGIN
  SELECT * INTO claimed FROM claim_next_job(60);
  IF claimed.id IS NULL OR claimed.tenant_id <> 'worker-tenant'
     OR claimed.idempotency_key <> 'worker-lease-001' THEN
    RAISE EXCEPTION 'worker claimed a cross-tenant job or wrong fixture';
  END IF;
END $$;

-- Claim, simulate process death/lease expiry, reclaim with a new fencing token.
DO $$
DECLARE first_job jobs%ROWTYPE; second_job jobs%ROWTYPE; finished boolean;
BEGIN
  SELECT * INTO first_job FROM jobs WHERE tenant_id='worker-tenant' AND idempotency_key='worker-lease-001';
  UPDATE jobs SET lease_expires_at = now() - interval '1 second' WHERE id = first_job.id;

  SELECT * INTO second_job FROM claim_next_job(60);
  IF second_job.id <> first_job.id OR second_job.attempts <> 2
     OR second_job.lease_token = first_job.lease_token THEN
    RAISE EXCEPTION 'expired lease was not safely reclaimed with new fencing token';
  END IF;

  finished := finish_job(first_job.id, first_job.lease_token);
  IF finished THEN RAISE EXCEPTION 'stale worker was allowed to finish reclaimed job'; END IF;

  finished := finish_job(second_job.id, second_job.lease_token);
  IF NOT finished THEN RAISE EXCEPTION 'current lease holder could not finish job'; END IF;
END $$;

-- A tenant cannot finish or fail another tenant's job, even with its token.
DO $$
DECLARE other_id uuid; other_token uuid;
BEGIN
  SELECT id, lease_token INTO other_id, other_token FROM jobs
   WHERE tenant_id='other-worker-tenant' AND idempotency_key='other-tenant-queued';
  IF finish_job(other_id, other_token) THEN
    RAISE EXCEPTION 'cross-tenant finish was accepted';
  END IF;
  IF fail_job(other_id, other_token, 0, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'cross-tenant fail was accepted';
  END IF;
END $$;

-- Retry is bounded; the configured attempt ceiling moves the job to failed.
INSERT INTO jobs(tenant_id,idempotency_key,job_type,payload)
VALUES ('worker-tenant','worker-retry-001','test.worker','{}')
ON CONFLICT (tenant_id,idempotency_key) DO NOTHING;
DO $$
DECLARE claimed jobs%ROWTYPE; result text;
BEGIN
  SELECT * INTO claimed FROM claim_next_job(60);
  IF claimed.id IS NULL OR claimed.idempotency_key <> 'worker-retry-001' THEN
    RAISE EXCEPTION 'retry test job was not claimed';
  END IF;
  result := fail_job(claimed.id, claimed.lease_token, 0, 1);
  IF result <> 'failed' THEN RAISE EXCEPTION 'attempt ceiling did not reach terminal failure'; END IF;
  IF fail_job(claimed.id, claimed.lease_token, 0, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'stale lease token changed terminal job';
  END IF;
END $$;

\echo 'A3 tenant-bound worker lease recovery and fencing checks passed'
