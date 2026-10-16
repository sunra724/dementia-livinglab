-- REVIEW DRAFT: dementia-livinglab (whtwsdomvkktnpqbvcnt). Not applied to production.
-- Business tables are reached through authorized server code; no client policies are needed.
-- Confirm deployment callers and rerun a fresh catalog audit before release.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';
DO $preflight$
DECLARE target text; relation_oid oid;
BEGIN
  FOREACH target IN ARRAY ARRAY['issue_items', 'admin_audit_logs', 'participants'] LOOP
    SELECT c.oid INTO relation_oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=target AND c.relkind IN ('r','p');
    IF relation_oid IS NULL THEN RAISE EXCEPTION 'Reviewed relation missing: public.%',target; END IF;
    IF EXISTS(SELECT 1 FROM pg_policy WHERE polrelid=relation_oid) THEN RAISE EXCEPTION 'Policy drift on public.%; review before migration',target; END IF;
  END LOOP;
END $preflight$;

ALTER TABLE public."issue_items" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."issue_items" FROM PUBLIC, anon, authenticated;
REVOKE SELECT ("priority", "id", "problem_statement", "status", "idea_summary", "prototype_summary", "test_summary", "policy_proposal", "updated_at", "code", "category", "source_worksheet_id", "title", "created_at", "owner_institution_id"), INSERT ("priority", "id", "problem_statement", "status", "idea_summary", "prototype_summary", "test_summary", "policy_proposal", "updated_at", "code", "category", "source_worksheet_id", "title", "created_at", "owner_institution_id"), UPDATE ("priority", "id", "problem_statement", "status", "idea_summary", "prototype_summary", "test_summary", "policy_proposal", "updated_at", "code", "category", "source_worksheet_id", "title", "created_at", "owner_institution_id"), REFERENCES ("priority", "id", "problem_statement", "status", "idea_summary", "prototype_summary", "test_summary", "policy_proposal", "updated_at", "code", "category", "source_worksheet_id", "title", "created_at", "owner_institution_id") ON TABLE public."issue_items" FROM PUBLIC, anon, authenticated;

ALTER TABLE public."admin_audit_logs" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."admin_audit_logs" FROM PUBLIC, anon, authenticated;
REVOKE SELECT ("id", "query_keys", "resource", "session_fingerprint", "ip_fingerprint", "created_at", "method"), INSERT ("id", "query_keys", "resource", "session_fingerprint", "ip_fingerprint", "created_at", "method"), UPDATE ("id", "query_keys", "resource", "session_fingerprint", "ip_fingerprint", "created_at", "method"), REFERENCES ("id", "query_keys", "resource", "session_fingerprint", "ip_fingerprint", "created_at", "method") ON TABLE public."admin_audit_logs" FROM PUBLIC, anon, authenticated;

ALTER TABLE public."participants" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."participants" FROM PUBLIC, anon, authenticated;
REVOKE SELECT ("id", "active", "notes", "affiliation", "role", "joined_date", "contact", "name"), INSERT ("id", "active", "notes", "affiliation", "role", "joined_date", "contact", "name"), UPDATE ("id", "active", "notes", "affiliation", "role", "joined_date", "contact", "name"), REFERENCES ("id", "active", "notes", "affiliation", "role", "joined_date", "contact", "name") ON TABLE public."participants" FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON SEQUENCE public.issue_items_id_seq FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON SEQUENCE public.admin_audit_logs_id_seq FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON SEQUENCE public.participants_id_seq FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON SEQUENCE public."issue_items_id_seq" FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON SEQUENCE public."admin_audit_logs_id_seq" FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON SEQUENCE public."participants_id_seq" FROM PUBLIC, anon, authenticated;

-- Actual application creator is postgres. Other creators need a separately reviewed change.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;
-- Built-in PUBLIC EXECUTE is global, so a schema-only revoke would not remove it.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;
COMMIT;
