# Deployment Source of Truth

## Frontend on Vercel

Expected apps:

- `apps/web-admin`
- `apps/web-public`
- `apps/web-clientes`

Recommended build commands:

- `pnpm --dir apps/web-admin build`
- `pnpm --dir apps/web-public build`
- `pnpm --dir apps/web-clientes build`

Expected runtime envs:

- `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_RENDER_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

Keep a single API base convention per project. If both `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_API_BASE_URL` are present, document which one is authoritative.

## Backend on Render

Expected service:

- `apps/api`

Recommended build/start:

- build: `pnpm --dir apps/api build`
- start: `pnpm --filter @white-label/api start`

Expected envs:

- `PORT`
- `CORS_ALLOWED_ORIGINS`
- `APP_URL`
- `WEBHOOK_BASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `MASTER_TENANT_SLUG`
- `MASTER_ACCOUNT_EMAIL`
- `TRIAL_DAYS`
- `ORDER_FOLIO_PREFIX`
- `SUPABASE_ORDER_BUCKET`

## Supabase

Supabase is the source of truth for:

- auth
- row-level security
- tenant-scoped data
- storage
- migrations

Rules:

- service role stays server-side only
- anon/publishable key may be used in frontend for public-safe flows
- RLS must enforce `tenant_id`

## Avoiding stale deploys

Checklist:

1. Confirm the repo points to the right branch.
2. Confirm the root directory for each Vercel project.
3. Confirm Render is building the latest commit.
4. Confirm the env var set matches the code path used by the app.
5. Confirm migrations were applied in Supabase.
6. Confirm no build artifact from old deploys is being served.

## Validation curls

Use real endpoints only.

- `/api/health`
- `/api/auth/me`
- `/api/auth/tenant/:slug/settings`
- `/api/public/tenant/:slug/landing`
- `/api/public/tenant/:slug/orders/:folio`

Never print secrets in logs or docs.
