# PRODUCTION_HEALTH_REPORT

## Verdict
Production is structurally deployable, but there is a configuration dependency risk on Render for the backend.

## Evidence

### Vercel
- `apps/web-admin/vercel.json` builds `web-admin`
- `apps/web-public/vercel.json` builds `web-public`
- `apps/web-clientes/vercel.json` builds `web-clientes`

### Render
- `render.yaml` builds `@white-label/api` from `apps/api`
- Required envs are marked `sync: false` for `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET`

### Supabase
- `supabase/config.toml` links the production project `wydspsvcvbwcmumynkwx`
- `docs/SUPABASE_STATUS.md` states the migration history is aligned locally and remotely

## Findings

| severity | finding | evidence | impact |
|---|---|---|---|
| P0 | Backend production correctness depends on Render-provided secrets being present and valid | `render.yaml`, `apps/api/src/index.ts`, `apps/api/src/middleware/auth.ts` | If `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, or `JWT_SECRET` are missing or wrong on Render, core API operations fail |
| P1 | The repo supports multiple API URL aliases and depends on a single canonical runtime choice | `packages/config/src/index.ts`, `apps/web-admin/src/lib/auth.ts`, `apps/web-public/src/app/login/page.tsx` | Misconfiguration can break auth or cross-app redirects even if build succeeds |

## Not found
- No verified build-time blocker was proven in the repository state.
- No verified endpoint-deployment mismatch was proven in the repository state.

