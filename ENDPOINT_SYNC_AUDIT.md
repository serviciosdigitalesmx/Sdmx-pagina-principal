# Endpoint Sync Audit

No values shown. Only routes, apps, and environments.

## Production hosts

- `apps/api` -> Render backend host
- `apps/web-admin` -> Vercel admin host
- `apps/web-public` -> Vercel public host
- `apps/web-clientes` -> Vercel customer host
- `Supabase` -> project `wydspsvcvbwcmumynkwx` for auth, DB, and RLS

## Matrix

| Endpoint / Route | App(s) that use it | Expected prod host | Exists in production | Gap |
|---|---|---|---|---|
| `/api/health` | `apps/api`, all frontends for health checks | Render API | Yes | OK |
| `/api/auth/me` | `apps/api`, `web-admin` | Render API | Yes | OK |
| `/api/auth/session` | `apps/api` | Render API | Yes | OK |
| `/api/auth/register` | `web-public`, `apps/api` | Render API | Yes | OK |
| `/api/auth/google` | `web-public`, `apps/api` | Render API | Yes | OK |
| `/api/auth/google/complete` | `web-public`, `apps/api` | Render API | Yes | OK |
| `/api/auth/exchange` | `web-public`, `web-admin` | Render API | Yes | OK |
| `/api/auth/tenant/:tenantSlug/settings` | `web-admin`, `apps/api` | Render API | Yes | OK |
| `/api/public/tenant/:tenantSlug/landing` | `web-public`, `web-clientes`, `apps/api` | Render API | Yes | OK |
| `/api/public/tenant/:tenantSlug/orders/:folio` | `web-public`, `web-clientes`, `apps/api` | Render API | Yes | OK |
| `/api/public/tracking` | `web-public`, `apps/api` | Render API | Yes | OK |
| `/api/public/quotes` | `web-public`, `apps/api` | Render API | Yes | OK |
| `/api/:tenantSlug/orders` | `web-admin`, `apps/api` | Render API | Yes | OK |
| `/api/:tenantSlug/customers` | `web-admin`, `apps/api` | Render API | Yes | OK |
| `/api/:tenantSlug/inventory` | `web-admin`, `apps/api` | Render API | Yes | OK |
| `/api/:tenantSlug/suppliers` | `web-admin`, `apps/api` | Render API | Yes | OK |
| `/api/:tenantSlug/purchase-orders` | `web-admin`, `apps/api` | Render API | Yes | OK |
| `/api/:tenantSlug/users` | `web-admin`, `apps/api` | Render API | Yes | OK |
| `/api/:tenantSlug/security` | `web-admin`, `apps/api` | Render API | Yes | OK |
| `/api/:tenantSlug/procurement` | `web-admin`, `apps/api` | Render API | Yes | OK |
| `/api/:tenantSlug/reports` | `web-admin`, `apps/api` | Render API | Yes | OK |
| `/api/:tenantSlug/stock-alerts` | `web-admin`, `apps/api` | Render API | Yes | OK |
| `/api/:tenantSlug/pwa` | `web-admin`, `apps/api` | Render API | Yes | OK |
| `/api/:tenantSlug/billing` | `web-public`, `web-admin`, `apps/api` | Render API | Yes | OK |
| `/api/webhooks/mercadopago` | `apps/api` only | Render API | Yes | OK |
| `/api/healthz` | `apps/api` only | Render API | Yes | OK |
| `/api` | `apps/api` only | Render API | Yes | OK |
| `/login` | `web-public`, `web-admin` | Vercel public/admin | Yes | OK |
| `/auth/bridge` | `web-public`, `web-admin` | Vercel public/admin | Yes | OK |
| `/dashboard` | `web-public`, `web-admin`, `web-clientes` | Vercel admin/customer/public | Yes | OK |
| `/portal` | `web-public`, `web-clientes` | Vercel public/customer | Yes | OK |
| `/t/[tenantSlug]/portal` | `web-public`, `web-clientes` | Vercel public/customer | Yes | OK |
| `/onboarding` | `web-public` | Vercel public | Yes | OK |
| `/onboarding/success` | `web-public` | Vercel public | Yes | OK |
| `/onboarding/google/callback` | `web-public` | Vercel public | Yes | OK |
| `/billing` | `web-public` | Vercel public | Yes | OK |
| `/billing/success` | `web-public` | Vercel public | Yes | OK |
| `/billing/pending` | `web-public` | Vercel public | Yes | OK |
| `/billing/failure` | `web-public` | Vercel public | Yes | OK |
| `/api/pwa/manifest` | `web-admin` | Vercel admin | Yes | OK |
| `/api/pwa/sw.js` | `web-admin` | Vercel admin | Yes | OK |

## Notes

- No route drift found between the codebase and the current production host layout.
- Public routes are handled by Vercel frontends; API routes are handled by Render.
- Supabase is not a route host in the same sense; it is the data/auth backend.

## Verification script

Script added at `scripts/check-endpoints.mjs`.

Behavior:
- reads endpoint inventory from the source tree
- checks HTTP status for a small list of production endpoints
- does not print secrets or tokens
- only reports `OK`, `WARN`, or `FAIL`
