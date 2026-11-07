BEGIN;

-- The login role is intentionally NOINHERIT. Applications must explicitly
-- SET ROLE to the restricted runtime role inside each tenant transaction.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'tinlance_app_login') THEN
    CREATE ROLE tinlance_app_login LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
  ELSE
    ALTER ROLE tinlance_app_login
      WITH LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
  END IF;
END
$$;

GRANT tinlance_app_runtime TO tinlance_app_login;
DO $$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO tinlance_app_login', current_database());
END
$$;

COMMIT;
