BEGIN;

-- Extend the database-side lease contract so long-running handlers can
-- renew ownership without exposing direct job-table updates to workers.
CREATE FUNCTION renew_job_lease(
  p_job_id uuid,
  p_lease_token uuid,
  p_lease_seconds integer DEFAULT 60
)
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
  IF p_lease_seconds IS NULL OR p_lease_seconds < 5 OR p_lease_seconds > 3600 THEN
    RAISE EXCEPTION 'lease duration must be between 5 and 3600 seconds';
  END IF;

  UPDATE public.jobs
     SET lease_expires_at = now() + make_interval(secs => p_lease_seconds),
         updated_at = now()
   WHERE id = p_job_id
     AND tenant_id = v_tenant_id
     AND status = 'running'
     AND lease_token = p_lease_token
     AND lease_expires_at > now();
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed = 1;
END;
$$;

REVOKE ALL ON FUNCTION renew_job_lease(uuid, uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION renew_job_lease(uuid, uuid, integer) TO tinlance_app_runtime;

COMMIT;
