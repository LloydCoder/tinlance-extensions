BEGIN;

REVOKE ALL ON FUNCTION public.cancel_job(uuid) FROM tinlance_app_runtime;

CREATE TABLE public.job_cancellation_audit (
  tenant_id text NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  actor_id text NOT NULL CHECK (char_length(actor_id) BETWEEN 1 AND 256),
  request_id uuid NOT NULL,
  previous_status text NOT NULL CHECK (previous_status IN ('queued', 'running')),
  cancelled_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, job_id, request_id),
  UNIQUE (tenant_id, request_id)
);

CREATE INDEX job_cancellation_audit_job_idx
  ON public.job_cancellation_audit (tenant_id, job_id, cancelled_at DESC);

ALTER TABLE public.job_cancellation_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_cancellation_audit FORCE ROW LEVEL SECURITY;

CREATE POLICY job_cancellation_audit_tenant_isolation ON public.job_cancellation_audit
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

GRANT SELECT ON public.job_cancellation_audit TO tinlance_app_runtime;

CREATE FUNCTION public.cancel_job_audited(
  p_job_id uuid,
  p_actor_id text,
  p_request_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_tenant_id text;
  v_previous_status text;
  v_cancelled_at timestamptz;
BEGIN
  v_tenant_id := nullif(current_setting('app.tenant_id', true), '');
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant context is required' USING ERRCODE = '42501';
  END IF;

  IF p_actor_id IS NULL OR char_length(p_actor_id) < 1 OR char_length(p_actor_id) > 256
     OR p_actor_id ~ '[[:cntrl:]]' OR p_request_id IS NULL THEN
    RAISE EXCEPTION 'cancellation audit identity is invalid' USING ERRCODE = '22023';
  END IF;

  SELECT status
    INTO v_previous_status
    FROM public.jobs
   WHERE id = p_job_id
     AND tenant_id = v_tenant_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Preserve idempotent API semantics without creating duplicate audit events.
  IF v_previous_status = 'cancelled' THEN
    RETURN true;
  END IF;

  IF v_previous_status NOT IN ('queued', 'running') THEN
    RETURN false;
  END IF;

  v_cancelled_at := now();
  UPDATE public.jobs
     SET status = 'cancelled',
         lease_expires_at = NULL,
         lease_token = NULL,
         cancelled_at = v_cancelled_at,
         updated_at = v_cancelled_at
   WHERE id = p_job_id
     AND tenant_id = v_tenant_id;

  INSERT INTO public.job_cancellation_audit (
    tenant_id, job_id, actor_id, request_id, previous_status, cancelled_at
  )
  VALUES (
    v_tenant_id, p_job_id, p_actor_id, p_request_id, v_previous_status, v_cancelled_at
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_job_audited(uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_job_audited(uuid, text, uuid) TO tinlance_app_runtime;

COMMIT;
