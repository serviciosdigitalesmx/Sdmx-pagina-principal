# ENV Sync Audit

No values shown. Only names and presence.

## Matrix

| Variable | App(s) that use it | Exists in Vercel | Exists in Render | Gap |
|---|---|---:|---:|---|
| `API_NAME` | `apps/api` | No | Yes | Missing in Vercel for API (not needed there) |
| `APP_URL` | `apps/api` | No | Yes | Missing in Vercel for API (not needed there) |
| `BASE_DOMAIN` | `apps/api`, `apps/web-admin`, `apps/web-public` | Yes | Yes | OK |
| `BILLING_ADAPTER_MODE` | `apps/api` | No | Yes | OK on Render only |
| `CORS_ALLOWED_ORIGINS` | `apps/api` | No | Yes | Missing in Vercel for API (not needed there) |
| `FEATURE_EVIDENCE_MODE` | `apps/api` | No | Yes | OK on Render only |
| `JWT_SECRET` | `apps/api` | No | Yes | OK on Render only |
| `LOW_STOCK_THRESHOLD` | `apps/api` | No | Yes | OK on Render only |
| `MASTER_ACCOUNT_EMAIL` | `apps/api` | No | Yes | OK on Render only |
| `MASTER_TENANT_SLUG` | `apps/api` | No | Yes | OK on Render only |
| `MP_ACCESS_TOKEN` | `apps/api` | No | Yes | OK on Render only |
| `MP_WEBHOOK_SECRET` | `apps/api` | No | Yes | OK on Render only |
| `NEXT_PUBLIC_API_BASE_URL` | `apps/web-admin`, `apps/web-public`, `apps/web-clientes` | Yes | No | Extra in Vercel; not needed on Render |
| `NEXT_PUBLIC_API_URL` | `apps/web-admin`, `apps/web-public`, `apps/web-clientes` | Yes | No | Extra in Vercel; not needed on Render |
| `NEXT_PUBLIC_AUTH_TOKEN_KEY` | `apps/web-admin`, `apps/web-public`, `apps/web-clientes` | Yes | No | OK on Vercel only |
| `NEXT_PUBLIC_BASE_DOMAIN` | `apps/web-admin`, `apps/web-public`, `apps/web-clientes` | Yes | No | OK on Vercel only |
| `NEXT_PUBLIC_CUSTOMER_META_DESCRIPTION` | `apps/web-clientes` | Yes | No | OK on Vercel only |
| `NEXT_PUBLIC_CUSTOMER_META_TITLE` | `apps/web-clientes` | Yes | No | OK on Vercel only |
| `NEXT_PUBLIC_DEFAULT_TENANT_SLUG` | `apps/web-admin`, `apps/web-clientes` | Yes | No | OK on Vercel only |
| `NEXT_PUBLIC_HUB_NAME` | `apps/web-public` | Yes | No | OK on Vercel only |
| `NEXT_PUBLIC_RENDER_API_URL` | `apps/web-admin`, `apps/web-public`, `apps/web-clientes` | Yes | No | Extra in Vercel; not needed on Render |
| `NEXT_PUBLIC_SAAS_BRAND_NAME` | `apps/web-public` | Yes | No | OK on Vercel only |
| `NEXT_PUBLIC_SAAS_BRAND_SHORT` | `apps/web-public` | Yes | No | OK on Vercel only |
| `NEXT_PUBLIC_SAAS_CONTACT_EMAIL` | `apps/web-public` | Yes | No | OK on Vercel only |
| `NEXT_PUBLIC_SAAS_CONTACT_PHONE` | `apps/web-public` | Yes | No | OK on Vercel only |
| `NEXT_PUBLIC_SAAS_META_DESCRIPTION` | `apps/web-public` | Yes | No | OK on Vercel only |
| `NEXT_PUBLIC_SAAS_THEME_COLOR` | `apps/web-public` | Yes | No | OK on Vercel only |
| `NEXT_PUBLIC_SAAS_TRIAL_DAYS` | `apps/web-public` | Yes | No | OK on Vercel only |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `apps/web-admin`, `apps/web-public`, `apps/web-clientes` | Yes | No | Extra in Vercel; not needed on Render |
| `NEXT_PUBLIC_SUPABASE_URL` | `apps/web-admin`, `apps/web-public`, `apps/web-clientes` | Yes | No | Extra in Vercel; not needed on Render |
| `NEXT_PUBLIC_THEME_PRIMARY` | `apps/web-admin` | Yes | No | OK on Vercel only |
| `NEXT_PUBLIC_WEB_ADMIN_URL` | `apps/web-admin`, `apps/web-public`, `apps/web-clientes`, `apps/api` | Yes | Yes | OK |
| `NEXT_PUBLIC_WEB_PUBLIC_URL` | `apps/web-admin`, `apps/web-public`, `apps/web-clientes`, `apps/api` | Yes | Yes | OK |
| `ORDER_FOLIO_PREFIX` | `apps/api` | No | Yes | OK on Render only |
| `PORT` | `apps/api` | No | Yes | OK on Render only |
| `PWA_VAPID_PRIVATE_KEY` | `apps/api` | No | No | Missing in Render |
| `PWA_VAPID_PUBLIC_KEY` | `apps/api` | No | No | Missing in Render |
| `PWA_VAPID_SUBJECT` | `apps/api` | No | Yes | OK on Render only |
| `SUPABASE_ORDER_BUCKET` | `apps/api` | No | Yes | OK on Render only |
| `SUPABASE_SERVICE_ROLE_KEY` | `apps/api` | No | Yes | OK on Render only |
| `SUPABASE_URL` | `apps/api` | No | Yes | OK on Render only |
| `TRIAL_DAYS` | `apps/api` | No | Yes | Extra in Render; code does not read it directly |
| `VERCEL` | `apps/api`, `apps/web-admin`, `apps/web-public`, `apps/web-clientes` | Yes | No | Platform-provided in Vercel |
| `WEBHOOK_BASE_URL` | `apps/api` | No | Yes | OK on Render only |

## Notable gaps

- `apps/api` is missing `PWA_VAPID_PUBLIC_KEY` and `PWA_VAPID_PRIVATE_KEY` in Render.
- `apps/api` has `TRIAL_DAYS` in Render, but the current backend code does not read it directly.
- Vercel has a few extras that are safe because they are only used by the frontend apps or shared config.
- Render has the backend-only variables needed for the API, except the two PWA VAPID keys.

## Sync script

Script added at `scripts/sync-envs.mjs`.

Behavior:
- reads env names from the source code
- compares Vercel production vars for each frontend app
- compares Render env vars for the API service
- prints only names and gaps
- no secret values are emitted
