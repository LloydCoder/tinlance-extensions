BEGIN;

ALTER TABLE outbox_events
  ADD COLUMN available_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  ADD COLUMN lease_expires_at timestamptz,
  ADD COLUMN lease_token uuid,
  ADD COLUMN dead_lettered_at timestamptz,
  ADD CONSTRAINT outbox_running_requires_token
    CHECK ((lease_expires_at IS NULL) = (lease_token IS NULL));

CREATE INDEX outbox_claim_idx
  ON outbox_events (tenant_id, available_at, created_at)
  WHERE published_at IS NULL AND dead_lettered_at IS NULL;

CREATE FUNCTION claim_outbox_events(
  p_lease_seconds integer DEFAULT 60,
  p_limit integer DEFAULT 10
)
RETURNS SETOF public.outbox_events
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
  IF p_lease_seconds < 5 OR p_lease_seconds > 3600
     OR p_limit < 1 OR p_limit > 100 THEN
    RAISE EXCEPTION 'invalid outbox lease or batch limit';
  END IF;

  RETURN QUERY
  WITH candidates AS (
    SELECT id
      FROM public.outbox_events
     WHERE tenant_id = v_tenant_id
       AND published_at IS NULL
       AND dead_lettered_at IS NULL
       AND available_at <= now()
       AND (lease_expires_at IS NULL OR lease_expires_at <= now())
     ORDER BY created_at, id
     FOR UPDATE SKIP LOCKED
     LIMIT p_limit
  )
  UPDATE public.outbox_events AS event
     SET attempts = event.attempts + 1,
         lease_expires_at = now() + make_interval(secs => p_lease_seconds),
         lease_token = gen_random_uuid()
    FROM candidates
   WHERE event.id = candidates.id
     AND event.tenant_id = v_tenant_id
  RETURNING event.*;
END;
$$;

CREATE FUNCTION mark_outbox_published(p_event_id uuid, p_lease_token uuid)
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

  UPDATE public.outbox_events
     SET published_at = now(),
         lease_expires_at = NULL,
         lease_token = NULL
   WHERE id = p_event_id
     AND tenant_id = v_tenant_id
     AND published_at IS NULL
     AND dead_lettered_at IS NULL
     AND lease_token = p_lease_token
     AND lease_expires_at > now();
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed = 1;
END;
$$;

REVOKE ALL ON FUNCTION claim_outbox_events(integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION mark_outbox_published(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_outbox_events(integer, integer) TO tinlance_app_runtime;
GRANT EXECUTE ON FUNCTION mark_outbox_published(uuid, uuid) TO tinlance_app_runtime;

COMMIT;
