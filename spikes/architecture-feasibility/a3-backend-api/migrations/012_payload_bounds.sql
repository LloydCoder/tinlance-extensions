BEGIN;

ALTER TABLE public.tenant_records
  ADD CONSTRAINT tenant_records_payload_object_size_check
  CHECK (
    jsonb_typeof(payload) = 'object'
    AND octet_length(payload::text) <= 1048576
  ) NOT VALID;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_payload_object_size_check
  CHECK (
    jsonb_typeof(payload) = 'object'
    AND octet_length(payload::text) <= 1048576
  ) NOT VALID;

ALTER TABLE public.outbox_events
  ADD CONSTRAINT outbox_events_payload_object_size_check
  CHECK (
    jsonb_typeof(payload) = 'object'
    AND octet_length(payload::text) <= 1048576
  ) NOT VALID;

ALTER TABLE public.tenant_records
  VALIDATE CONSTRAINT tenant_records_payload_object_size_check;
ALTER TABLE public.jobs
  VALIDATE CONSTRAINT jobs_payload_object_size_check;
ALTER TABLE public.outbox_events
  VALIDATE CONSTRAINT outbox_events_payload_object_size_check;

COMMENT ON CONSTRAINT tenant_records_payload_object_size_check ON public.tenant_records
  IS 'Tenant record payloads must be JSON objects no larger than 1 MiB when serialized as JSON.';
COMMENT ON CONSTRAINT jobs_payload_object_size_check ON public.jobs
  IS 'Job payloads must be JSON objects no larger than 1 MiB when serialized as JSON.';
COMMENT ON CONSTRAINT outbox_events_payload_object_size_check ON public.outbox_events
  IS 'Outbox event payloads must be JSON objects no larger than 1 MiB when serialized as JSON.';

COMMIT;
