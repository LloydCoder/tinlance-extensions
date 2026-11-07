BEGIN;

CREATE TABLE public.consumer_inbox (
  tenant_id text NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  consumer_name text NOT NULL CHECK (consumer_name ~ '^[a-z0-9][a-z0-9_.-]{0,63}$'),
  event_id uuid NOT NULL,
  payload jsonb NOT NULL CHECK (
    jsonb_typeof(payload) = 'object'
    AND octet_length(payload::text) <= 1048576
  ),
  accepted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, consumer_name, event_id)
);

CREATE INDEX consumer_inbox_accepted_idx
  ON public.consumer_inbox (tenant_id, accepted_at DESC);

ALTER TABLE public.consumer_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_inbox FORCE ROW LEVEL SECURITY;

CREATE POLICY consumer_inbox_tenant_isolation ON public.consumer_inbox
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

GRANT SELECT, INSERT ON public.consumer_inbox TO tinlance_app_runtime;

CREATE FUNCTION public.accept_consumer_event(
  p_consumer_name text,
  p_event_id uuid,
  p_payload jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_tenant_id text;
  v_inserted_count integer;
  v_existing_payload jsonb;
BEGIN
  v_tenant_id := nullif(current_setting('app.tenant_id', true), '');
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant context is required' USING ERRCODE = '42501';
  END IF;

  IF p_consumer_name IS NULL
     OR p_consumer_name !~ '^[a-z0-9][a-z0-9_.-]{0,63}$' THEN
    RAISE EXCEPTION 'consumer name is invalid' USING ERRCODE = '22023';
  END IF;

  IF p_event_id IS NULL THEN
    RAISE EXCEPTION 'event ID is required' USING ERRCODE = '22023';
  END IF;

  IF p_payload IS NULL
     OR jsonb_typeof(p_payload) <> 'object'
     OR octet_length(p_payload::text) > 1048576 THEN
    RAISE EXCEPTION 'payload must be a JSON object no larger than 1 MiB' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.consumer_inbox (tenant_id, consumer_name, event_id, payload)
  VALUES (v_tenant_id, p_consumer_name, p_event_id, p_payload)
  ON CONFLICT (tenant_id, consumer_name, event_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  IF v_inserted_count = 1 THEN
    RETURN true;
  END IF;

  SELECT payload
    INTO v_existing_payload
    FROM public.consumer_inbox
   WHERE tenant_id = v_tenant_id
     AND consumer_name = p_consumer_name
     AND event_id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'consumer inbox conflict could not be resolved' USING ERRCODE = '40001';
  END IF;

  IF v_existing_payload IS DISTINCT FROM p_payload THEN
    RAISE EXCEPTION 'idempotency key payload mismatch' USING ERRCODE = '22000';
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_consumer_event(text, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_consumer_event(text, uuid, jsonb) TO tinlance_app_runtime;

COMMIT;
