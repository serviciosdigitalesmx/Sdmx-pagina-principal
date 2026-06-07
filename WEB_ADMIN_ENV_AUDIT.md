# WEB_ADMIN_ENV_AUDIT

## Scope
`apps/web-admin`

## Findings

| variable | usada | definida | entorno | severidad | evidence |
|---|---:|---:|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes | yes | local + production | P1 | Used by `apps/web-admin/src/lib/auth.ts`, `apps/web-admin/src/services/fixService.ts`, and `apps/web-admin/src/lib/supabase-browser.ts`; also defined in `apps/web-admin/.env.local` and `apps/web-admin/.env.example` |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | yes | local + production | P1 | Used by browser Supabase client setup; defined in `apps/web-admin/.env.local` and examples |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | yes | local + production | P1 | Used by browser Supabase client setup; defined in `apps/web-admin/.env.local` and examples |
| `NEXT_PUBLIC_AUTH_TOKEN_KEY` | yes | yes | local + production | P2 | Used for token storage key; defined in env examples and `.env.local` |
| `NEXT_PUBLIC_THEME_PRIMARY` | yes | yes | local + production | P3 | Used by theme surfaces; not sale-blocking |
| `NEXT_PUBLIC_DEFAULT_TENANT_SLUG` | yes | yes | local + production | P2 | Used in session/tenant bootstrap paths; defined in env examples and `.env.local` |
| `NEXT_PUBLIC_DEFAULT_TENANT_NAME` | yes | yes | local + production | P3 | Used as display fallback only |
| `NEXT_PUBLIC_DEFAULT_SUCURSAL_NAME` | yes | yes | local + production | P3 | Used as display fallback only |
| `NEXT_PUBLIC_DEFAULT_USER_EMAIL` | yes | yes | local + production | P3 | Default display/bootstrap value |
| `NEXT_PUBLIC_DEFAULT_USER_ROLE` | yes | yes | local + production | P3 | Default display/bootstrap value |
| `NEXT_PUBLIC_DEFAULT_USER_SUCURSAL_ID` | yes | yes | local + production | P3 | Default display/bootstrap value |
| `NEXT_PUBLIC_TENANT_BRAND_NAME` | yes | yes | local + production | P3 | Branding only |
| `NEXT_PUBLIC_TENANT_META_TITLE` | yes | yes | local + production | P3 | Metadata only |
| `NEXT_PUBLIC_TENANT_META_DESCRIPTION` | yes | yes | local + production | P3 | Metadata only |
| `NEXT_PUBLIC_WEB_ADMIN_URL` | yes | yes | local + production | P1 | Used in hub/login redirect logic and bridge URLs |
| `NEXT_PUBLIC_WEB_PUBLIC_URL` | yes | yes | local + production | P2 | Used in cross-app navigation and defaults |
| `NEXT_PUBLIC_API_BASE_URL` | yes | yes | local + production | P2 | Alias resolved by `@white-label/config`; duplicate of API URL convention |
| `NEXT_PUBLIC_RENDER_API_URL` | yes | yes | local + production | P2 | Fallback API source in shared config |
| `NEXT_PUBLIC_DEV_AUTH_TOKEN` | no visible usage in runtime code | yes | local only | P3 | Present in env example, not required by runtime paths inspected |
| `NEXT_PUBLIC_ENABLE_PWA` | no visible usage in runtime code | yes | local only | P3 | Present in env example, not used in the inspected admin runtime paths |

## Hardcodes / fallback risk
- `apps/web-admin/src/lib/auth.ts` relies on `NEXT_PUBLIC_API_URL` through `@white-label/config`, which in turn accepts `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_API_URL`, or `NEXT_PUBLIC_RENDER_API_URL`.
- This is safe only if one canonical API URL is configured. If none are present, the auth path fails fast.
- `apps/web-admin/src/lib/session.ts` requires `tenant_slug` in the token; missing claim returns `null`.

## Duplicate / obsolete signals
- `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_API_BASE_URL` are both supported. This is a compatibility alias, not a blocker, but it increases configuration drift risk.
- `NEXT_PUBLIC_DEV_AUTH_TOKEN` and `NEXT_PUBLIC_ENABLE_PWA` appear in examples but are not confirmed as runtime requirements in the inspected paths.

## Sale impact
- No env issue here blocks selling by itself.
- The main risk is configuration drift between alias variables, but the code fails fast rather than silently degrading.
