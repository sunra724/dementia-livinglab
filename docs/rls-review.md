# RLS review and disposable CI

The dementia-livinglab warning targets are hardened in security/migrations. This directory is deliberately outside automatic application migrations: this review does not apply or authorize a production migration.

CI uses only disposable loopback PostgreSQL 17. It applies repository schema sources (typescript-ddl), all native migrations, then an audited empty catalog supplement for reviewed/shared tables and previous RLS state. The supplement contains no production rows, triggers or business RPC bodies. It is not a complete production restore or an app/API integration certificate. Current source tables are preserved rather than replaced by the supplement.

The guard checks effective table/column/PUBLIC grants, RLS, reviewed contracts and table-specific CRUD tests. Real transient tables probe new-table and missing-test rejection. Supabase CLI runs role-specific pgTAP including anon, A/B, other-organization claims and service/non-owner backend operations. Claims are synthetic and do not establish verified membership.

The source manifest must register new DDL files. New tables in current schema/migration sources without RLS, reviewed access contracts or tests fail CI. Existing named baseline objects are explicit exceptions requiring a separate access review.

This branch disables only its own automatic Vercel deployment, so CI cannot accidentally point a new Preview at inherited production settings. Existing deployment rules are preserved.

Release blockers: verify shared deployed callers, current catalog drift, server privileges, and application/batch operations in an approved non-production environment. No production data writes or production settings are part of this branch.

Before release, snapshot policies/ACL/default ACL and confirm creators. Apply reviewed grants and RLS atomically with the migration timeouts. Rerun Security Advisor after an approved release. If application access fails, stop writes and repair only the necessary server privilege; keep RLS and client denials. Do not restore anonymous CRUD, permissive true policies, or disable RLS as rollback.
