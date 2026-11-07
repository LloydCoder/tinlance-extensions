\set ON_ERROR_STOP on

INSERT INTO tenants(id) VALUES ('outbox-tenant'), ('other-outbox-tenant') ON CONFLICT DO NOTHING;
INSERT INTO jobs(tenant_id,idempotency_key,job_type,payload)
VALUES ('outbox-tenant','outbox-aggregate-001','test.outbox','{}'),
       ('other-outbox-tenant','other-outbox-aggregate-001','test.outbox','{}')
ON CONFLICT (tenant_id,idempotency_key) DO NOTHING;
INSERT INTO outbox_events(tenant_id,aggregate_id,event_type,payload)
SELECT tenant_id,id,'test.event','{}'::jsonb
FROM jobs
WHERE (tenant_id,idempotency_key) IN
  (('outbox-tenant','outbox-aggregate-001'),('other-outbox-tenant','other-outbox-aggregate-001'))
ON CONFLICT (aggregate_id,event_type) DO NOTHING;

DO $$
BEGIN
  BEGIN
    PERFORM * FROM claim_outbox_events(60,10);
    RAISE EXCEPTION 'outbox claim succeeded without tenant context';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'outbox claim succeeded without tenant context' THEN RAISE; END IF;
    IF SQLERRM <> 'tenant context is required' THEN RAISE; END IF;
  END;
END $$;

SELECT set_config('app.tenant_id','outbox-tenant',false);

DO $$
DECLARE first_event outbox_events%ROWTYPE;
        reclaimed_event outbox_events%ROWTYPE;
        published boolean;
BEGIN
  SELECT * INTO first_event FROM claim_outbox_events(60,10);
  IF first_event.id IS NULL OR first_event.tenant_id <> 'outbox-tenant'
     OR first_event.attempts <> 1 THEN
    RAISE EXCEPTION 'outbox claim returned no event or crossed tenant boundary';
  END IF;

  UPDATE outbox_events
     SET lease_expires_at = now() - interval '1 second'
   WHERE id = first_event.id;

  SELECT * INTO reclaimed_event FROM claim_outbox_events(60,10);
  IF reclaimed_event.id <> first_event.id
     OR reclaimed_event.attempts <> 2
     OR reclaimed_event.lease_token = first_event.lease_token THEN
    RAISE EXCEPTION 'expired outbox lease was not reclaimed with a fresh token';
  END IF;

  published := mark_outbox_published(first_event.id, first_event.lease_token);
  IF published THEN RAISE EXCEPTION 'stale outbox publisher token was accepted'; END IF;

  published := mark_outbox_published(reclaimed_event.id, reclaimed_event.lease_token);
  IF NOT published THEN RAISE EXCEPTION 'current outbox publisher could not mark event published'; END IF;

  IF EXISTS (SELECT 1 FROM outbox_events WHERE id = first_event.id AND published_at IS NULL) THEN
    RAISE EXCEPTION 'published outbox event still appears unpublished';
  END IF;
END $$;

-- Obtain a real lease in the other tenant, then prove the first tenant
-- cannot publish it even when it supplies the correct event ID and lease token.
SELECT set_config('app.tenant_id','other-outbox-tenant',false);
DO $
DECLARE other_event outbox_events%ROWTYPE;
BEGIN
  SELECT * INTO other_event FROM claim_outbox_events(60,10);
  IF other_event.id IS NULL OR other_event.tenant_id <> 'other-outbox-tenant' THEN
    RAISE EXCEPTION 'other tenant fixture could not claim its own event';
  END IF;
  CREATE TEMP TABLE other_outbox_lease AS
    SELECT other_event.id AS id, other_event.lease_token AS lease_token;
END $;
SELECT set_config('app.tenant_id','outbox-tenant',false);
DO $
DECLARE other_lease record;
        published boolean;
BEGIN
  SELECT * INTO other_lease FROM other_outbox_lease;
  published := mark_outbox_published(other_lease.id, other_lease.lease_token);
  IF published THEN RAISE EXCEPTION 'cross-tenant outbox publish was accepted'; END IF;
END $;

\echo 'A3 tenant-bound transactional outbox claim/reclaim/publish checks passed'
