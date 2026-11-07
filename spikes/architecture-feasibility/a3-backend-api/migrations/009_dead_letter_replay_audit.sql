BEGIN;

ALTER TABLE public.outbox_events
  ADD COLUMN replay_count integer NOT NULL DEFAULT 0 CHECK (replay_count >= 0);

CREATE TABLE public.outbox_replay_audit (
  tenant_id text NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.outbox_events(id) ON DELETE CASCADE,
  replay_number integer NOT NULL CHECK (replay_number > 0),
  actor_id text NOT NULL CHECK (char_length(actor_id) BETWEEN 1 AND 256),
  previous_attempts integer NOT NULL CHECK (previous_attempts >= 0),
  previous_error_code text,
  previous_dead_lettered_at timestamptz NOT NULL,
  request_id uuid NOT NULL,
  replayed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, event_id, replay_number),
  UNIQUE (tenant_id, request_id)
);

CREATE INDEX outbox_replay_audit_event_idx
  ON public.outbox_replay_audit (tenant_id, event_id, replayed_at DESC);

ALTER TABLE public.outbox_replay_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox_replay_audit FORCE ROW LEVEL SECURITY;

CREATE POLICY outbox_replay_audit_tenant_isolation ON public.outbox_replay_audit
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

GRANT SELECT ON public.outbox_replay_audit TO tinlance_app_runtime;

CREATE FUNCTION public.replay_dead_letter_event(
  p_event_id uuid,
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
     OR p_actor_id ~ '[[:cntrl:]]' OR p_request_id IS NULL THEN
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

REVOKE ALL ON FUNCTION public.replay_dead_letter_event(uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replay_dead_letter_event(uuid, text, uuid) TO tinlance_app_runtime;

COMMIT;
