# TENANT_ISOLATION_REPORT

## Verdict
The codebase shows explicit tenant isolation mechanisms. No direct evidence of cross-tenant read/write bypass was found in the inspected repository state.

## Evidence

### API middleware
- `apps/api/src/middleware/auth.ts` decodes and validates `tenant_id`, `tenant_slug`, and `sucursal_id` from the authenticated token.
- It queries user state with `.eq('tenant_id', claims.tenant_id)` and related tenant-scoped predicates.

### API route pattern
- `apps/api/src/index.ts` exposes tenant-prefixed and non-prefixed routes, but the handlers still enforce tenant context from auth claims.

### Supabase RLS
- `supabase/migrations/20260523190000_order_documents_events.sql`
- `supabase/migrations/20260530150000_add_pwa_push_subscriptions.sql`
- `supabase/migrations/20260528000600_harden_live_inventory_rls.sql`

These migrations show row-level policies using `auth.jwt() ->> 'tenant_id'` or `_live_tenant_id()` against `tenant_id`.

### Frontend session use
- `apps/web-admin/src/lib/session.ts` rejects tokens missing `tenant_slug`.
- `apps/web-admin/src/services/fixService.ts` resolves tenant-scoped session context before issuing requests.

## Findings

| severity | finding | evidence | impact |
|---|---|---|---|
| P1 | Tenant isolation depends on correct JWT claims and server-side validation in the API | `apps/api/src/middleware/auth.ts`, `supabase/migrations/*.sql` | If token issuance is wrong, isolation can be weakened, but the current code explicitly checks tenant-scoped claims |
| P2 | The frontend trusts its own stored token for UI state until the API rejects invalid scope | `apps/web-admin/src/lib/session.ts`, `apps/web-admin/src/components/auth/session-gate.tsx` | UI state may show stale context if the token is stale, but there is no evidence of cross-tenant access by itself |

## Not found
- No verified path to read another tenant’s data was found in the inspected source.
- No verified direct URL bypass was found in public/private routing.
- No verified RLS gap was proven from the repository alone.
