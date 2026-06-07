# WEB_CLIENTES_ENV_AUDIT

## Scope
`apps/web-clientes`

## Findings

| variable | usada | definida | entorno | severidad | evidence |
|---|---:|---:|---|---|---|
| `NEXT_PUBLIC_CUSTOMER_META_DESCRIPTION` | yes | yes | local + production | P3 | Used for metadata only |
| `NEXT_PUBLIC_CUSTOMER_META_TITLE` | yes | yes | local + production | P3 | Used for metadata only |

## Hardcodes / fallback risk
- The inspected client-facing API helper in `apps/web-clientes/src/lib/api/tenant.ts` uses the shared API client path and does not introduce an alternate mock API.
- The `.env.example` for this app includes `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_RENDER_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, but the direct code sample inspected here shows only metadata env usage in the top-level scan.

## Duplicate / obsolete signals
- The client app inherits the same API URL alias pattern as the other frontends through shared config.

## Sale impact
- No verified blocker found from the currently inspected client env surface.
