BEGIN;

ALTER TABLE outbox_events
  ADD COLUMN last_error_code text,
  ADD COLUMN last_error_at timestamptz,
  ADD CONSTRAINT outbox_error_code_format
    CHECK (last_error_code IS NULL OR last_error_code ~ '^[a-z0-9_.-]{1,64}$');

CREATE INDEX outbox_dead_letter_idx
  ON outbox_events (tenant_id, dead_lettered_at)
  WHERE dead_lettered_at IS NOT NULL;

CREATE FUNCTION renew_outbox_lease(
  p_event_id uuid,
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

  UPDATE public.outbox_events
     SET lease_expires_at = now() + make_interval(secs => p_lease_seconds)
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

CREATE FUNCTION fail_outbox_event(
  p_event_id uuid,
  p_lease_token uuid,
  p_error_code text,
  p_retry_delay_seconds integer DEFAULT 30,
  p_max_attempts integer DEFAULT 8
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE result_status text; v_tenant_id text;
BEGIN
  v_tenant_id := nullif(current_setting('app.tenant_id', true), '');
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant context is required';
  END IF;
  IF p_error_code IS NULL OR p_error_code !~ '^[a-z0-9_.-]{1,64}$'
     OR p_retry_delay_seconds IS NULL OR p_retry_delay_seconds < 0 OR p_retry_delay_seconds > 86400
     OR p_max_attempts IS NULL OR p_max_attempts < 1 OR p_max_attempts > 100 THEN
    RAISE EXCEPTION 'invalid outbox retry policy or error code';
  END IF;

  UPDATE public.outbox_events
     SET dead_lettered_at = CASE WHEN attempts >= p_max_attempts THEN now() ELSE NULL END,
         available_at = CASE WHEN attempts >= p_max_attempts
                             THEN available_at
                             ELSE now() + make_interval(secs => p_retry_delay_seconds) END,
         last_error_code = p_error_code,
         last_error_at = now(),
         lease_expires_at = NULL,
         lease_token = NULL
   WHERE id = p_event_id
     AND tenant_id = v_tenant_id
     AND published_at IS NULL
     AND dead_lettered_at IS NULL
     AND lease_token = p_lease_token
     AND lease_expires_at > now()
  RETURNING CASE WHEN dead_lettered_at IS NOT NULL
                 THEN 'dead_lettered' ELSE 'retry_scheduled' END
       INTO result_status;

  RETURN result_status;
END;
$$;

REVOKE ALL ON FUNCTION renew_outbox_lease(uuid, uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION fail_outbox_event(uuid, uuid, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION renew_outbox_lease(uuid, uuid, integer) TO tinlance_app_runtime;
GRANT EXECUTE ON FUNCTION fail_outbox_event(uuid, uuid, text, integer, integer) TO tinlance_app_runtime;

COMMIT;
