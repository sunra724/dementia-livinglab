-- Isolated catalog reconstruction. No production rows, triggers, indexes or API stack copied.
-- Run ONLY in the disposable local test database. Production schema truth: evidence/whtwsdomvkktnpqbvcnt.json.
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA public, extensions, auth TO anon, authenticated, service_role, audit_backend;
CREATE SEQUENCE public."admin_audit_logs_id_seq";
CREATE SEQUENCE public."participants_id_seq";
CREATE SEQUENCE public."institutions_id_seq";
CREATE SEQUENCE public."workshops_id_seq";
CREATE SEQUENCE public."worksheet_tokens_id_seq";
CREATE SEQUENCE public."worksheet_entries_id_seq";
CREATE SEQUENCE public."issue_items_id_seq";
CREATE TABLE public."admin_audit_logs" (
  "id" integer DEFAULT nextval('admin_audit_logs_id_seq'::regclass) NOT NULL,
  "query_keys" text DEFAULT '[]'::text NOT NULL,
  "resource" text NOT NULL,
  "session_fingerprint" text NOT NULL,
  "ip_fingerprint" text NOT NULL,
  "created_at" text NOT NULL,
  "method" text NOT NULL
);
ALTER TABLE public."admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY (id);
CREATE TABLE public."participants" (
  "id" integer DEFAULT nextval('participants_id_seq'::regclass) NOT NULL,
  "active" integer DEFAULT 1,
  "notes" text DEFAULT ''::text,
  "affiliation" text NOT NULL,
  "role" text NOT NULL,
  "joined_date" text NOT NULL,
  "contact" text NOT NULL,
  "name" text NOT NULL
);
ALTER TABLE public."participants" ADD CONSTRAINT "participants_pkey" PRIMARY KEY (id);
CREATE TABLE public."institutions" (
  "id" integer DEFAULT nextval('institutions_id_seq'::regclass) NOT NULL,
  "mou_signed" integer DEFAULT 0,
  "participating_phases" text DEFAULT '[]'::text,
  "notes" text DEFAULT ''::text,
  "representative" text NOT NULL,
  "address" text NOT NULL,
  "mou_date" text,
  "type" text NOT NULL,
  "contact" text NOT NULL,
  "contact_person" text NOT NULL,
  "name" text NOT NULL
);
ALTER TABLE public."institutions" ADD CONSTRAINT "institutions_pkey" PRIMARY KEY (id);
CREATE TABLE public."workshops" (
  "id" integer DEFAULT nextval('workshops_id_seq'::regclass) NOT NULL,
  "participants_count" integer DEFAULT 0,
  "facilitator_id" integer,
  "actual_date" text,
  "phase" integer NOT NULL,
  "location" text NOT NULL,
  "type" text NOT NULL,
  "outcome_summary" text NOT NULL,
  "status" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "scheduled_date" text NOT NULL
);
ALTER TABLE public."workshops" ADD CONSTRAINT "workshops_pkey" PRIMARY KEY (id);
CREATE TABLE public."worksheet_tokens" (
  "id" integer DEFAULT nextval('worksheet_tokens_id_seq'::regclass) NOT NULL,
  "active" integer DEFAULT 1 NOT NULL,
  "token" text NOT NULL,
  "created_at" text NOT NULL,
  "expires_at" text,
  "workshop_id" integer NOT NULL,
  "template_key" text NOT NULL
);
ALTER TABLE public."worksheet_tokens" ADD CONSTRAINT "worksheet_tokens_pkey" PRIMARY KEY (id);
ALTER TABLE public."worksheet_tokens" ADD CONSTRAINT "worksheet_tokens_token_key" UNIQUE (token);
CREATE TABLE public."worksheet_entries" (
  "id" integer DEFAULT nextval('worksheet_entries_id_seq'::regclass) NOT NULL,
  "group_name" text DEFAULT ''::text NOT NULL,
  "filled_by_name" text DEFAULT ''::text NOT NULL,
  "filled_by_role" text DEFAULT 'activist'::text NOT NULL,
  "content_json" text DEFAULT '{}'::text NOT NULL,
  "reviewed" integer DEFAULT 0 NOT NULL,
  "reviewed_by" text DEFAULT ''::text NOT NULL,
  "review_note" text DEFAULT ''::text NOT NULL,
  "reviewed_at" text,
  "token_id" integer,
  "submitted_at" text,
  "workshop_id" integer NOT NULL,
  "template_key" text NOT NULL
);
ALTER TABLE public."worksheet_entries" ADD CONSTRAINT "worksheet_entries_pkey" PRIMARY KEY (id);
ALTER TABLE public."worksheet_entries" ADD CONSTRAINT "worksheet_entries_token_id_key" UNIQUE (token_id);
CREATE TABLE public."issue_items" (
  "priority" text DEFAULT 'medium'::text NOT NULL,
  "id" integer DEFAULT nextval('issue_items_id_seq'::regclass) NOT NULL,
  "problem_statement" text DEFAULT ''::text NOT NULL,
  "status" text DEFAULT 'problem_defined'::text NOT NULL,
  "idea_summary" text DEFAULT ''::text NOT NULL,
  "prototype_summary" text DEFAULT ''::text NOT NULL,
  "test_summary" text DEFAULT ''::text NOT NULL,
  "policy_proposal" text DEFAULT ''::text NOT NULL,
  "updated_at" text NOT NULL,
  "code" text NOT NULL,
  "category" text NOT NULL,
  "source_worksheet_id" integer,
  "title" text NOT NULL,
  "created_at" text NOT NULL,
  "owner_institution_id" integer
);
ALTER TABLE public."issue_items" ADD CONSTRAINT "issue_items_code_key" UNIQUE (code);
ALTER TABLE public."issue_items" ADD CONSTRAINT "issue_items_pkey" PRIMARY KEY (id);
ALTER TABLE public."worksheet_tokens" ADD CONSTRAINT "worksheet_tokens_workshop_id_fkey" FOREIGN KEY (workshop_id) REFERENCES workshops(id);
ALTER TABLE public."worksheet_entries" ADD CONSTRAINT "worksheet_entries_token_id_fkey" FOREIGN KEY (token_id) REFERENCES worksheet_tokens(id);
ALTER TABLE public."worksheet_entries" ADD CONSTRAINT "worksheet_entries_workshop_id_fkey" FOREIGN KEY (workshop_id) REFERENCES workshops(id);
ALTER TABLE public."issue_items" ADD CONSTRAINT "issue_items_owner_institution_id_fkey" FOREIGN KEY (owner_institution_id) REFERENCES institutions(id);
ALTER TABLE public."issue_items" ADD CONSTRAINT "issue_items_source_worksheet_id_fkey" FOREIGN KEY (source_worksheet_id) REFERENCES worksheet_entries(id);
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, audit_backend;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, audit_backend;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
ALTER TABLE public."institutions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."workshops" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."worksheet_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."worksheet_entries" ENABLE ROW LEVEL SECURITY;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
