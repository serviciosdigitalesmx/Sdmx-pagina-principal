# Endpoint Map

## Shared backend base

- `API_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_RENDER_API_URL`

Resolution order:
1. `API_URL`
2. `NEXT_PUBLIC_API_URL`
3. `NEXT_PUBLIC_API_BASE_URL`
4. `NEXT_PUBLIC_RENDER_API_URL`

## `web-admin`

| Purpose | Route | Notes |
| --- | --- | --- |
| Exchange Supabase session | `POST /api/auth/exchange` | Converts Supabase `access_token` into FIXI session JWT |
| Google auth start | `GET /api/auth/google` | Redirects to Supabase OAuth |
| Google complete | `POST /api/auth/google/complete` | Completes onboarding |
| Register tenant | `POST /api/auth/register` | Creates tenant + first user |
| Tenant settings | `GET /api/auth/tenant/:tenantSlug/settings` | Landing config |
| Tenant settings update | `PUT /api/auth/tenant/:tenantSlug/settings` | Landing config |
| Module APIs | `/api/:tenantSlug/...` | All tenant-scoped admin modules |
| Global APIs | `/api/...` | Used when route is not tenant-scoped |

## `web-public`

| Purpose | Route | Notes |
| --- | --- | --- |
| Exchange Supabase session | `POST /api/auth/exchange` | Same auth bridge as admin |
| Google auth start | `GET /api/auth/google` | Public onboarding |
| Google complete | `POST /api/auth/google/complete` | Public onboarding callback |
| Register tenant | `POST /api/auth/register` | Public signup |
| Public landing | `GET /api/public/tenant/:tenantSlug/landing` | Tenant storefront/landing |
| Public order lookup | `GET /api/public/tenant/:tenantSlug/orders/:folio` | Customer tracking |
| Public tracking | `GET /api/public/tracking` | Tracking endpoint |
| Public store catalog | `GET /api/public/store/:tenantSlug/catalog` | Storefront catalog |
| Public checkout | `POST /api/public/store/checkout` | Storefront checkout |
| Billing | `POST /api/billing/checkout` | Billing entrypoint |

## Vercel / routing notes

- `web-public` also exposes a catch-all proxy at `src/app/api/[...path]/route.ts`.
- `web-admin` requests must use the backend base URL resolver to reach the Render API directly.
- Production domains should not rely on relative paths for auth bridging.
