BEGIN;

-- Agent Platform's stateless MCP adapter emits request IDs such as
-- "mcp-<sha256-prefix>". Audit correlation IDs are opaque identifiers, not
-- database UUIDs. Preserve existing UUID values as text and accept the
-- Platform's bounded, normalized identifier format.
ALTER TABLE public.outbox_replay_audit
  ALTER COLUMN request_id TYPE text USING request_id::text;
ALTER TABLE public.job_cancellation_audit
  ALTER COLUMN request_id TYPE text USING request_id::text;

ALTER TABLE public.outbox_replay_audit
  ADD CONSTRAINT outbox_replay_audit_request_id_format
  CHECK (request_id ~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,255}$');
ALTER TABLE public.job_cancellation_audit
  ADD CONSTRAINT job_cancellation_audit_request_id_format
  CHECK (request_id ~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,255}$');

DROP FUNCTION public.replay_dead_letter_event(uuid, text, uuid);
CREATE FUNCTION public.replay_dead_letter_event(
  p_event_id uuid,
  p_actor_id text,
  p_request_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_tenant_id text;
  v_replay_count integer;
  v_previous_attempts integer;
  v_previous_error_code text;
  v_previous_dead_lettered_at timestamptz;
BEGIN
  v_tenant_id := nullif(current_setting('app.tenant_id', true), '');
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant context is required' USING ERRCODE = '42501';
  END IF;

  IF p_actor_id IS NULL OR char_length(p_actor_id) < 1 OR char_length(p_actor_id) > 256
     OR p_actor_id ~ '[[:cntrl:]]'
     OR p_request_id IS NULL
     OR p_request_id !~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,255}$' THEN
    RAISE EXCEPTION 'replay audit identity is invalid' USING ERRCODE = '22023';
  END IF;

  SELECT replay_count, attempts, last_error_code, dead_lettered_at
    INTO v_replay_count, v_previous_attempts, v_previous_error_code, v_previous_dead_lettered_at
    FROM public.outbox_events
   WHERE id = p_event_id
     AND tenant_id = v_tenant_id
     AND dead_lettered_at IS NOT NULL
     AND published_at IS NULL
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE public.outbox_events
     SET replay_count = replay_count + 1,
         attempts = 0,
         available_at = now(),
         dead_lettered_at = NULL,
         last_error_code = NULL,
         lease_expires_at = NULL,
         lease_token = NULL
   WHERE id = p_event_id
     AND tenant_id = v_tenant_id
     AND dead_lettered_at IS NOT NULL
     AND published_at IS NULL
  RETURNING replay_count INTO v_replay_count;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO public.outbox_replay_audit (
    tenant_id, event_id, replay_number, actor_id,
    previous_attempts, previous_error_code, previous_dead_lettered_at, request_id
  )
  VALUES (
    v_tenant_id, p_event_id, v_replay_count, p_actor_id,
    v_previous_attempts, v_previous_error_code, v_previous_dead_lettered_at, p_request_id
  );

  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.replay_dead_letter_event(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replay_dead_letter_event(uuid, text, text) TO tinlance_app_runtime;

DROP FUNCTION public.cancel_job_audited(uuid, text, uuid);
CREATE FUNCTION public.cancel_job_audited(
  p_job_id uuid,
  p_actor_id text,
  p_request_id text
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
     OR p_actor_id ~ '[[:cntrl:]]'
     OR p_request_id IS NULL
     OR p_request_id !~ '^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,255}$' THEN
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
REVOKE ALL ON FUNCTION public.cancel_job_audited(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_job_audited(uuid, text, text) TO tinlance_app_runtime;

COMMIT;
