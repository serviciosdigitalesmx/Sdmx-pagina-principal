# WEB_PUBLIC_ENV_AUDIT

## Scope
`apps/web-public`

## Findings

| variable | usada | definida | entorno | severidad | evidence |
|---|---:|---:|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes | yes | local + production | P1 | Used by `apps/web-public/src/app/onboarding/page.tsx`, `apps/web-public/src/app/login/page.tsx`, and shared config |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | yes | local + production | P1 | Defined in env examples and consumed by browser helpers in the public app |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | yes | local + production | P1 | Defined in env examples and consumed by browser helpers |
| `NEXT_PUBLIC_WEB_ADMIN_URL` | yes | yes | local + production | P1 | Used by bridge and hub navigation in public login flows |
| `NEXT_PUBLIC_WEB_PUBLIC_URL` | yes | yes | local + production | P2 | Used for canonical public URLs and redirects |
| `NEXT_PUBLIC_BASE_DOMAIN` | yes | yes | local + production | P2 | Used in public routing and tenant URL composition |
| `NEXT_PUBLIC_HUB_NAME` | yes | yes | local + production | P3 | Copy only |
| `NEXT_PUBLIC_SAAS_BRAND_NAME` | yes | yes | local + production | P3 | Copy only |
| `NEXT_PUBLIC_SAAS_BRAND_SHORT` | yes | yes | local + production | P3 | Copy only |
| `NEXT_PUBLIC_SAAS_CONTACT_EMAIL` | yes | yes | local + production | P3 | Copy only |
| `NEXT_PUBLIC_SAAS_CONTACT_PHONE` | yes | yes | local + production | P3 | Copy only |
| `NEXT_PUBLIC_SAAS_META_DESCRIPTION` | yes | yes | local + production | P3 | Metadata only |
| `NEXT_PUBLIC_SAAS_THEME_COLOR` | yes | yes | local + production | P3 | Metadata only |
| `NEXT_PUBLIC_SAAS_TRIAL_DAYS` | yes | yes | local + production | P3 | Copy / marketing only |
| `NEXT_PUBLIC_TENANT_LANDING_URL_TEMPLATE` | yes | yes | local + production | P2 | Used in public tenant routing |
| `NEXT_PUBLIC_SAAS_DEMO_URL` | yes | yes | local + production | P3 | Public demo link only |
| `NEXT_PUBLIC_AUTH_TOKEN_KEY` | yes | yes | local + production | P1 | Used for session persistence across login/bridge routes |
| `NEXT_PUBLIC_RENDER_API_URL` | yes | yes | local + production | P2 | Fallback API source in shared config |
| `NEXT_PUBLIC_API_BASE_URL` | yes | yes | local + production | P2 | Alias resolved by shared config |

## Hardcodes / fallback risk
- `apps/web-public/src/app/onboarding/page.tsx` and `apps/web-public/src/app/login/page.tsx` depend on `resolveApiBaseUrl()` from shared config, which accepts three API URL env variants.
- `apps/web-public/src/app/onboarding/page.tsx` falls back `NEXT_PUBLIC_SAAS_TRIAL_DAYS` to `"7"` if unset. That is a non-blocking content fallback, not a production blocker.
- Public auth paths call the real API; no mocked auth path was found in the inspected code.

## Duplicate / obsolete signals
- `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_API_BASE_URL` are both accepted. This is duplicate configuration surface, but not a blocker.
- `NEXT_PUBLIC_RENDER_API_URL` remains a fallback alias.

## Sale impact
- No verified blocker found in the public frontend env surface.
- The only operational risk is env drift between alias variables, but the shared config fails fast when no API URL exists.
