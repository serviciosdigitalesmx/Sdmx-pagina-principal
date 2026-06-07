# API_ENV_AUDIT

## Scope
`apps/api`

## Findings

| variable | usada | definida | entorno | severidad | evidence |
|---|---:|---:|---|---|---|
| `PORT` | yes | yes | render + local | P1 | Used in `apps/api/src/index.ts` and Render config |
| `CORS_ALLOWED_ORIGINS` | yes | yes | render + local | P1 | Used in `apps/api/src/index.ts` for CORS allowlist |
| `APP_URL` | yes | yes | render + local | P1 | Used for production origin matching and root response context |
| `BASE_DOMAIN` | yes | yes | render + local | P1 | Used to allow wildcard tenant hostnames |
| `SUPABASE_URL` | yes | yes | render + local | P0 | Required by backend Supabase client paths and Render env contract |
| `SUPABASE_ANON_KEY` | yes | yes | render + local | P0 | Required by backend Supabase client paths and Render env contract |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | yes | render + local | P0 | Required for privileged server operations; missing would block core API features |
| `JWT_SECRET` | yes | yes | render + local | P0 | Required for signing/verifying API auth tokens |
| `WEBHOOK_BASE_URL` | yes | yes | render + local | P1 | Used for external callbacks / webhook construction |
| `API_NAME` | yes | yes | render + local | P3 | Root health/message only |
| `MASTER_TENANT_SLUG` | yes | yes | render + local | P1 | Used by admin/master tenant flows |
| `MASTER_ACCOUNT_EMAIL` | yes | yes | render + local | P1 | Used by master/admin flows |
| `ORDER_FOLIO_PREFIX` | yes | yes | render + local | P2 | Business identifier generation |
| `LOW_STOCK_THRESHOLD` | yes | yes | render + local | P2 | Inventory alert threshold |
| `PWA_VAPID_PUBLIC_KEY` | yes | yes | render + local | P2 | PWA push setup |
| `PWA_VAPID_PRIVATE_KEY` | yes | yes | render + local | P2 | PWA push setup |
| `PWA_VAPID_SUBJECT` | yes | yes | render + local | P2 | PWA push setup |
| `MP_ACCESS_TOKEN` | yes | yes | render + local | P1 | Required for payment/billing integrations if used in production flows |
| `MP_WEBHOOK_SECRET` | yes | yes | render + local | P1 | Required for webhook verification if MercadoPago flows are enabled |
| `SUPABASE_ORDER_BUCKET` | yes | yes | render + local | P2 | Storage integration |
| `NEXT_PUBLIC_API_URL` | yes | yes | render + local | P2 | Present in API env surface for shared origin/build helpers |
| `NEXT_PUBLIC_WEB_ADMIN_URL` | yes | yes | render + local | P2 | Present for cross-app URL composition |
| `NEXT_PUBLIC_WEB_PUBLIC_URL` | yes | yes | render + local | P2 | Present for cross-app URL composition |
| `BILLING_ADAPTER_MODE` | yes | yes | render + local | P2 | Feature/integration mode toggle |
| `FEATURE_EVIDENCE_MODE` | yes | yes | render + local | P2 | Feature/integration mode toggle |

## Hardcodes / fallback risk
- `apps/api/src/index.ts` permits CORS for any `vercel.app` origin and localhost by design; this is broad but explicit.
- Production origins are assembled from `APP_URL`, `NEXT_PUBLIC_WEB_PUBLIC_URL`, `NEXT_PUBLIC_WEB_ADMIN_URL`, and hardcoded canonical origins.
- If `SUPABASE_*` or `JWT_SECRET` are missing on Render, the API cannot operate correctly; that is a hard production dependency.

## Duplicate / obsolete signals
- The API shares `NEXT_PUBLIC_*` naming with frontend configuration, but those are used for cross-app URL composition, not for client-side secrets.

## Sale impact
- The API has the only clearly sale-blocking dependency surface if Render env vars are missing. This is a deployment/configuration risk, not a code defect.
