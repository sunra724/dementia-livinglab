-- Disposable localhost CI database only. Business RPC permissions are unchanged.
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role, audit_backend;
-- The production hardening migration removes postgres's default PUBLIC EXECUTE.
-- Allow the test actors to call only pgTAP extension routines in this local DB.
DO $pgtap_test_roles$
DECLARE routine regprocedure;
BEGIN
  FOR routine IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_depend d ON d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e'
    JOIN pg_extension e ON e.oid=d.refobjid
    WHERE e.extname='pgtap' AND p.pronamespace='extensions'::regnamespace
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated, service_role, audit_backend', routine);
  END LOOP;
END $pgtap_test_roles$;
