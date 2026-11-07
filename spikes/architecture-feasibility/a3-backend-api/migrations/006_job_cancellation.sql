BEGIN;

ALTER TABLE jobs
  ADD COLUMN cancelled_at timestamptz,
  ADD CONSTRAINT jobs_cancelled_timestamp
    CHECK ((status = 'cancelled') = (cancelled_at IS NOT NULL));

CREATE FUNCTION cancel_job(p_job_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE changed integer; v_tenant_id text;
BEGIN
  v_tenant_id := nullif(current_setting('app.tenant_id', true), '');
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant context is required';
  END IF;

  UPDATE public.jobs
     SET status = 'cancelled',
         lease_expires_at = NULL,
         lease_token = NULL,
         cancelled_at = now(),
         updated_at = now()
   WHERE id = p_job_id
     AND tenant_id = v_tenant_id
     AND status IN ('queued', 'running');
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed = 1 THEN
    RETURN TRUE;
  END IF;

  -- Cancellation is idempotent for an already-cancelled job, but cannot
  -- report success for another tenant or a terminal non-cancelled job.
  RETURN EXISTS (
    SELECT 1 FROM public.jobs
     WHERE id = p_job_id
       AND tenant_id = v_tenant_id
       AND status = 'cancelled'
  );
END;
$$;

REVOKE ALL ON FUNCTION cancel_job(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cancel_job(uuid) TO tinlance_app_runtime;

COMMIT;
