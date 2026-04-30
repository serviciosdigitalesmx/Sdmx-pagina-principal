# Source of Truth

This repository is a production SaaS monorepo. The deployment and runtime boundaries are strict:

## Production targets

- Frontend on Vercel: `apps/frontend-next`
- Backend on Render: `apps/backend-api`
- Database/Auth/Storage on Supabase: `https://wydspsvcvbwcmumynkwx.supabase.co`

## Runtime contract

- Frontend never authenticates directly against Supabase.
- Frontend calls the backend login endpoint:
  - `POST ${NEXT_PUBLIC_API_BASE_URL}/api/auth/login`
- Backend is the only runtime that talks to Supabase auth and storage directly.
- Supabase access is configured only through environment variables.

## Environment variables

### Frontend

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_API_URL` as compatibility fallback only
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Backend

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ALLOWED_ORIGINS`
- `APP_URL`
- `WEBHOOK_BASE_URL`

## Repository layout

Keep in the product repo:

- `apps/frontend-next`
- `apps/backend-api`
- `packages/contracts`
- `supabase/migrations`
- `scripts`
- `docs`

Archive outside the product repo:

- legacy prototypes
- comparison copies
- temporary audits
- generated build caches
- deprecated frontend variants

## Auth boundary

- Frontend login page must not import `createBrowserClient`.
- Frontend login page must not call `signInWithPassword` directly.
- Backend login service owns Supabase authentication.

## Deployment invariants

- Vercel root directory: `apps/frontend-next`
- Render root: `apps/backend-api`
- The production bundle must contain backend login calls, not browser Supabase auth.

