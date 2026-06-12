# Supabase Status

Current state:
- Remote project `wydspsvcvbwcmumynkwx` is linked from the repo.
- Migration history is aligned locally and remotely.
- The latest schema snapshot is stored in `supabase/migrations/20260514133525_remote_schema.sql`.

Source of truth:
- Prefer the pulled remote schema as the reference for the current project state.
- Avoid reintroducing the older hand-written baseline unless you need an isolated bootstrap for a fresh database.

Applied migration chain:
1. `20260424_baseline_schema.sql`
2. `20260514120000_enable_rls_and_policies.sql`
3. `20260514133525_remote_schema.sql`

Notes:
- The repository previously contained RLS policies targeting older table names.
- The current project schema uses tables such as `service_orders`, `service_requests`, `sucursal_inventory`, `products`, `suppliers`, and `tasks`.
- Any new migration should be incremental and should be validated against the pulled remote schema before pushing to staging or production.

Recommended workflow for future schema changes:
1. Modify the schema locally.
2. Generate or update a new migration.
3. Run `supabase migration up --linked --include-all`.
4. Verify with `supabase migration list`.
5. Only then promote to the next environment.
