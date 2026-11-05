\set ON_ERROR_STOP on
INSERT INTO tenants(id) VALUES ('worker-tenant') ON CONFLICT DO NOTHING;
INSERT INTO jobs(tenant_id,idempotency_key,job_type,payload)
VALUES ('worker-tenant','worker-lease-001','test.worker','{}')
ON CONFLICT (tenant_id,idempotency_key) DO NOTHING;

-- Claim, simulate process death/lease expiry, reclaim with a new fencing token.
DO $$
DECLARE first_job jobs%ROWTYPE; second_job jobs%ROWTYPE; finished boolean;
BEGIN
  SELECT * INTO first_job FROM claim_next_job(60);
  IF first_job.id IS NULL OR first_job.status <> 'running' OR first_job.attempts <> 1 THEN
    RAISE EXCEPTION 'first worker claim failed';
  END IF;

  UPDATE jobs SET lease_expires_at = now() - interval '1 second'
   WHERE id = first_job.id;

  SELECT * INTO second_job FROM claim_next_job(60);
  IF second_job.id <> first_job.id OR second_job.attempts <> 2
     OR second_job.lease_token = first_job.lease_token THEN
    RAISE EXCEPTION 'expired lease was not safely reclaimed with new fencing token';
  END IF;

  finished := finish_job(first_job.id, first_job.lease_token);
  IF finished THEN RAISE EXCEPTION 'stale worker was allowed to finish reclaimed job'; END IF;

  finished := finish_job(second_job.id, second_job.lease_token);
  IF NOT finished THEN RAISE EXCEPTION 'current lease holder could not finish job'; END IF;

  IF EXISTS (SELECT 1 FROM jobs WHERE id=first_job.id AND (status <> 'succeeded' OR lease_token IS NOT NULL OR lease_expires_at IS NOT NULL)) THEN
    RAISE EXCEPTION 'successful job retained active lease';
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
  IF result <> 'failed' THEN RAISE EXCEPTION 'attempt ceiling did not dead-letter job'; END IF;
  IF fail_job(claimed.id, claimed.lease_token, 0, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'stale lease token changed terminal job';
  END IF;
END $$;

\echo 'A3 worker lease recovery and fencing checks passed'
