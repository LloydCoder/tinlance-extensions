BEGIN;

ALTER TABLE jobs ADD COLUMN lease_token uuid;
ALTER TABLE jobs ADD CONSTRAINT jobs_running_requires_token
  CHECK ((status = 'running') = (lease_token IS NOT NULL));

CREATE INDEX jobs_reclaim_idx ON jobs (lease_expires_at, available_at)
  WHERE status = 'running';

-- SECURITY DEFINER bypasses table RLS, so every operation must explicitly
-- bind to the transaction-local tenant context established by trusted auth.
CREATE FUNCTION claim_next_job(p_lease_seconds integer DEFAULT 60)
RETURNS SETOF public.jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE v_tenant_id text;
BEGIN
  v_tenant_id := nullif(current_setting('app.tenant_id', true), '');
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant context is required';
  END IF;
  IF p_lease_seconds < 5 OR p_lease_seconds > 3600 THEN
    RAISE EXCEPTION 'lease duration must be between 5 and 3600 seconds';
  END IF;

  RETURN QUERY
  WITH candidate AS (
    SELECT id
    FROM public.jobs
    WHERE tenant_id = v_tenant_id
      AND ((status = 'queued' AND available_at <= now())
        OR (status = 'running' AND lease_expires_at <= now()))
    ORDER BY available_at, created_at
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  UPDATE public.jobs AS j
     SET status = 'running',
         attempts = j.attempts + 1,
         lease_expires_at = now() + make_interval(secs => p_lease_seconds),
         lease_token = gen_random_uuid(),
         updated_at = now()
    FROM candidate
   WHERE j.id = candidate.id AND j.tenant_id = v_tenant_id
  RETURNING j.*;
END;
$$;

CREATE FUNCTION finish_job(p_job_id uuid, p_lease_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE changed integer; v_tenant_id text;
BEGIN
  v_tenant_id := nullif(current_setting('app.tenant_id', true), '');
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'tenant context is required'; END IF;
  UPDATE public.jobs
     SET status = 'succeeded', lease_expires_at = NULL,
         lease_token = NULL, updated_at = now()
   WHERE id = p_job_id AND tenant_id = v_tenant_id AND status = 'running'
     AND lease_token = p_lease_token AND lease_expires_at > now();
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed = 1;
END;
$$;

CREATE FUNCTION fail_job(
  p_job_id uuid,
  p_lease_token uuid,
  p_retry_delay_seconds integer DEFAULT 30,
  p_max_attempts integer DEFAULT 5
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE result_status text; v_tenant_id text;
BEGIN
  v_tenant_id := nullif(current_setting('app.tenant_id', true), '');
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'tenant context is required'; END IF;
  IF p_retry_delay_seconds < 0 OR p_retry_delay_seconds > 86400
     OR p_max_attempts < 1 OR p_max_attempts > 100 THEN
    RAISE EXCEPTION 'invalid retry policy';
  END IF;

  UPDATE public.jobs
     SET status = CASE WHEN attempts >= p_max_attempts THEN 'failed' ELSE 'queued' END,
         available_at = CASE WHEN attempts >= p_max_attempts
                             THEN available_at
                             ELSE now() + make_interval(secs => p_retry_delay_seconds) END,
         lease_expires_at = NULL, lease_token = NULL, updated_at = now()
   WHERE id = p_job_id AND tenant_id = v_tenant_id AND status = 'running'
     AND lease_token = p_lease_token AND lease_expires_at > now()
  RETURNING status INTO result_status;

  RETURN result_status;
END;
$$;

REVOKE ALL ON FUNCTION claim_next_job(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION finish_job(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION fail_job(uuid, uuid, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_next_job(integer) TO tinlance_app_runtime;
GRANT EXECUTE ON FUNCTION finish_job(uuid, uuid) TO tinlance_app_runtime;
GRANT EXECUTE ON FUNCTION fail_job(uuid, uuid, integer, integer) TO tinlance_app_runtime;

COMMIT;
