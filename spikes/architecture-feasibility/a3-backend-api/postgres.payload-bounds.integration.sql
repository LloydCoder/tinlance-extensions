BEGIN;

INSERT INTO tenants (id)
VALUES ('payload-boundary-tenant')
ON CONFLICT (id) DO NOTHING;

SELECT set_config('app.tenant_id', 'payload-boundary-tenant', true);

DO $$
DECLARE
  v_job_id uuid;
  v_small_payload jsonb;
  v_large_payload jsonb;
BEGIN
  v_small_payload := jsonb_build_object('value', repeat('x', 1048560));
  v_large_payload := jsonb_build_object('value', repeat('x', 1048576));

  IF octet_length(v_small_payload::text) > 1048576 THEN
    RAISE EXCEPTION 'small payload fixture unexpectedly exceeds 1 MiB';
  END IF;
  IF octet_length(v_large_payload::text) <= 1048576 THEN
    RAISE EXCEPTION 'large payload fixture unexpectedly fits within 1 MiB';
  END IF;

  INSERT INTO tenant_records (id, tenant_id, payload)
  VALUES ('payload-small-record', 'payload-boundary-tenant', v_small_payload);

  INSERT INTO jobs (tenant_id, idempotency_key, job_type, payload)
  VALUES ('payload-boundary-tenant', 'payload-small-job', 'payload.bounds.test', v_small_payload)
  RETURNING id INTO v_job_id;

  INSERT INTO outbox_events (tenant_id, aggregate_id, event_type, payload)
  VALUES ('payload-boundary-tenant', v_job_id, 'payload.bounds.accepted', v_small_payload);

  BEGIN
    INSERT INTO tenant_records (id, tenant_id, payload)
    VALUES ('payload-array-record', 'payload-boundary-tenant', '[]'::jsonb);
    RAISE EXCEPTION 'tenant_records accepted a non-object payload';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  BEGIN
    INSERT INTO tenant_records (id, tenant_id, payload)
    VALUES ('payload-large-record', 'payload-boundary-tenant', v_large_payload);
    RAISE EXCEPTION 'tenant_records accepted a payload larger than 1 MiB';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  BEGIN
    INSERT INTO jobs (tenant_id, idempotency_key, job_type, payload)
    VALUES ('payload-boundary-tenant', 'payload-large-job', 'payload.bounds.test', v_large_payload);
    RAISE EXCEPTION 'jobs accepted a payload larger than 1 MiB';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  BEGIN
    INSERT INTO outbox_events (tenant_id, aggregate_id, event_type, payload)
    VALUES ('payload-boundary-tenant', v_job_id, 'payload.bounds.oversized', v_large_payload);
    RAISE EXCEPTION 'outbox_events accepted a payload larger than 1 MiB';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;
END;
$$;

ROLLBACK;
