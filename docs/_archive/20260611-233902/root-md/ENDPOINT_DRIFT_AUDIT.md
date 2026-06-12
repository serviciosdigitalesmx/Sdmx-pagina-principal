# Endpoint Drift Audit

No values shown. Only routes, apps, and production status.

## Summary

- Declared endpoints in code: aligned with the documented backend routes.
- Production liveness: all sampled production endpoints returned HTTP 200.
- No route drift found for the main login/auth/public/dashboard surfaces.

## Comparison

| Endpoint | Declared in code | Documented | Live in production | Drift |
|---|---|---|---|---|
| `/api/health` | Yes | Yes | Yes | No |
| `/api` | Yes | Yes | Yes | No |
| `/api/auth/exchange` | Yes | Yes | Yes | No |
| `/api/auth/register` | Yes | Yes | Yes | No |
| `/api/auth/google` | Yes | Yes | Yes | No |
| `/api/auth/google/complete` | Yes | Yes | Yes | No |
| `/api/public/tenant/:tenantSlug/landing` | Yes | Yes | Yes | No |
| `/api/public/tenant/:tenantSlug/orders/:folio` | Yes | Yes | Yes | No |
| `/login` | Yes | Yes | Yes | No |
| `/auth/bridge` | Yes | Yes | Yes | No |
| `/dashboard` | Yes | Yes | Yes | No |
| `/onboarding` | Yes | Yes | Yes | No |
| `/billing` | Yes | Yes | Yes | No |

## Notes

- `web-admin`, `web-public`, and `web-clientes` are configured to talk to the Render API through `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_API_BASE_URL`.
- `apps/api` exposes the canonical backend routes on Render.
- Supabase remains the source of truth for auth/database behavior; it is not part of the HTTP route parity check.

## Verification script

Script added at `scripts/check-endpoints.mjs`.

Behavior:
- checks a small set of production endpoints
- prints only status, no secrets
- can be extended to include more routes
