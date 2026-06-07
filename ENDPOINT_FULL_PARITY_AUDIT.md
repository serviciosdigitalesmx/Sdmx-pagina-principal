# Endpoint Full Parity Audit

No values shown. Only routes, app ownership, and production state.

## Scope

This audit compares:
- endpoints declared in source
- endpoints documented in `docs/endpoint-contracts.md`
- endpoints live in production for the core public/admin/API surfaces

## Canonical ownership

- `apps/api` -> Render API
- `apps/web-admin` -> Vercel admin frontend
- `apps/web-public` -> Vercel public frontend
- `apps/web-clientes` -> Vercel customer frontend

## High-confidence parity set

| Endpoint | Declared | Documented | Live | Drift |
|---|---|---|---|---|
| `/api/health` | Yes | Yes | Yes | No |
| `/api` | Yes | Yes | Yes | No |
| `/api/auth/me` | Yes | Yes | Yes | No |
| `/api/auth/session` | Yes | Yes | Yes | No |
| `/api/auth/register` | Yes | Yes | Yes | No |
| `/api/auth/google` | Yes | Yes | Yes | No |
| `/api/auth/google/complete` | Yes | Yes | Yes | No |
| `/api/auth/exchange` | Yes | Yes | Yes | No |
| `/api/auth/tenant/:tenantSlug/settings` | Yes | Yes | Yes | No |
| `/api/public/tenant/:tenantSlug/landing` | Yes | Yes | Yes | No |
| `/api/public/tenant/:tenantSlug/orders/:folio` | Yes | Yes | Yes | No |
| `/api/public/tracking` | Yes | Yes | Yes | No |
| `/api/public/quotes` | Yes | Yes | Yes | No |
| `/login` | Yes | Yes | Yes | No |
| `/auth/bridge` | Yes | Yes | Yes | No |
| `/dashboard` | Yes | Yes | Yes | No |
| `/onboarding` | Yes | Yes | Yes | No |
| `/billing` | Yes | Yes | Yes | No |
| `/api/:tenantSlug/orders` | Yes | Yes | Yes | No |
| `/api/:tenantSlug/customers` | Yes | Yes | Yes | No |
| `/api/:tenantSlug/inventory` | Yes | Yes | Yes | No |
| `/api/:tenantSlug/suppliers` | Yes | Yes | Yes | No |
| `/api/:tenantSlug/purchase-orders` | Yes | Yes | Yes | No |
| `/api/:tenantSlug/users` | Yes | Yes | Yes | No |
| `/api/:tenantSlug/security` | Yes | Yes | Yes | No |
| `/api/:tenantSlug/procurement` | Yes | Yes | Yes | No |
| `/api/:tenantSlug/reports` | Yes | Yes | Yes | No |
| `/api/:tenantSlug/stock-alerts` | Yes | Yes | Yes | No |
| `/api/:tenantSlug/pwa` | Yes | Yes | Yes | No |
| `/api/:tenantSlug/billing` | Yes | Yes | Yes | No |
| `/api/webhooks/mercadopago` | Yes | Yes | Yes | No |

## Notes

- The wider source tree contains many route fragments in service clients (e.g. `/:id`, `/summary`, `/checkout`), but those are constructed under the canonical backend prefixes above.
- The public/customer apps are healthy as long as they resolve the canonical API base URL correctly.
- No route drift was observed in the sampled production endpoints.

## Verification script

Script added at `scripts/check-endpoints.mjs`.

Behavior:
- checks the core production routes
- emits only route name and HTTP result
- never prints values or tokens
