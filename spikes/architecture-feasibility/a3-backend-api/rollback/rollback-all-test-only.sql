\set ON_ERROR_STOP on

\if :{?confirm_a3_spike_rollback}
\else
  \echo 'Refusing rollback: set -v confirm_a3_spike_rollback=true explicitly.'
  \quit
\endif

\if :confirm_a3_spike_rollback
\else
  \echo 'Refusing rollback: confirm_a3_spike_rollback must be true.'
  \quit
\endif

BEGIN;

DO $$
BEGIN
  IF current_database() <> 'tinlance_rollback_test' THEN
    RAISE EXCEPTION 'refusing rollback outside the isolated tinlance_rollback_test database';
  END IF;

  IF EXISTS (SELECT 1 FROM public.tenant_records)
     OR EXISTS (SELECT 1 FROM public.jobs)
     OR EXISTS (SELECT 1 FROM public.outbox_events)
     OR EXISTS (SELECT 1 FROM public.consumer_inbox)
     OR EXISTS (SELECT 1 FROM public.outbox_replay_audit)
     OR EXISTS (SELECT 1 FROM public.job_cancellation_audit)
     OR EXISTS (SELECT 1 FROM public.tenants) THEN
    RAISE EXCEPTION 'refusing destructive A3 spike rollback while application data exists';
  END IF;
END;
$$;

DROP FUNCTION public.cancel_job_audited(uuid, text, text);
DROP FUNCTION public.replay_dead_letter_event(uuid, text, text);
DROP FUNCTION public.accept_consumer_event(text, uuid, jsonb);
DROP FUNCTION public.cancel_job(uuid);
DROP FUNCTION public.fail_outbox_event(uuid, uuid, text, integer, integer);
DROP FUNCTION public.renew_outbox_lease(uuid, uuid, integer);
DROP FUNCTION public.mark_outbox_published(uuid, uuid);
DROP FUNCTION public.claim_outbox_events(integer, integer);
DROP FUNCTION public.renew_job_lease(uuid, uuid, integer);
DROP FUNCTION public.fail_job(uuid, uuid, integer, integer);
DROP FUNCTION public.finish_job(uuid, uuid);
DROP FUNCTION public.claim_next_job(integer);

DROP TABLE public.job_cancellation_audit;
DROP TABLE public.outbox_replay_audit;
DROP TABLE public.consumer_inbox;
DROP TABLE public.outbox_events;
DROP TABLE public.jobs;
DROP TABLE public.tenant_records;
DROP TABLE public.tenants;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM tinlance_app_runtime;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM tinlance_app_runtime;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM tinlance_app_runtime;
REVOKE ALL ON SCHEMA public FROM tinlance_app_runtime;
REVOKE tinlance_app_runtime FROM tinlance_app_login;
REVOKE CONNECT ON DATABASE tinlance_rollback_test FROM tinlance_app_login;

DROP ROLE tinlance_app_login;
DROP ROLE tinlance_app_runtime;

COMMIT;

DO $$
BEGIN
  IF to_regclass('public.tenants') IS NOT NULL
     OR to_regclass('public.jobs') IS NOT NULL
     OR to_regclass('public.outbox_events') IS NOT NULL
     OR to_regclass('public.consumer_inbox') IS NOT NULL
     OR to_regclass('public.outbox_replay_audit') IS NOT NULL
     OR to_regclass('public.job_cancellation_audit') IS NOT NULL THEN
    RAISE EXCEPTION 'A3 rollback left application tables behind';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_roles
     WHERE rolname IN ('tinlance_app_runtime', 'tinlance_app_login')
  ) THEN
    RAISE EXCEPTION 'A3 rollback left application roles behind';
  END IF;
END;
$$;
