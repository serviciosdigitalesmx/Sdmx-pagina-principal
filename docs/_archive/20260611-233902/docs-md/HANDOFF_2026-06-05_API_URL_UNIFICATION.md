# Handoff 2026-06-05: API_URL unification and production verification

## Objective

Unify all frontend API traffic to a single backend base URL:

- `https://api.serviciosdigitalesmx.online`

The canonical environment variable is now:

- `API_URL`

## What was changed today

### 1. Shared API resolution

The shared config package now resolves the backend base URL from `API_URL` first, while still tolerating the legacy aliases during the transition:

- `API_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_RENDER_API_URL`

Relevant file:

- [packages/config/src/index.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/packages/config/src/index.ts)

Key behavior:

- accepts full URLs with `https://`
- accepts bare domains and normalizes them
- strips trailing slashes
- strips query/hash fragments
- throws an explicit error if the environment value is invalid

### 2. Public web proxy alignment

The `web-public` API proxy now uses `API_URL` as its backend source.

Relevant file:

- [apps/web-public/src/app/api/[...path]/route.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/api/[...path]/route.ts)

### 3. Vercel environment variables

The Vercel projects were updated to use `API_URL` with:

- `production`
- `development`

For `web-public`, `web-clientes`, and `web-admin`.

Current value:

- `https://api.serviciosdigitalesmx.online`

### 4. Bootstrap and examples

Updated the bootstrap and example environment files to document the canonical contract:

- [scripts/setup-vercel.sh](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/scripts/setup-vercel.sh)
- [/.env.example](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/.env.example)

## End-to-end verification performed

### Build and type safety

Verified successfully:

- `pnpm --filter web-public build`
- `pnpm --filter web-clientes exec tsc --noEmit`
- `pnpm --filter web-admin exec tsc --noEmit`

### Runtime contract checks

Confirmed in code and environment:

- `web-public` proxy resolves through `API_URL`
- shared resolver still supports legacy aliases during transition
- Vercel production envs contain `API_URL`

### Production deploy state

Most recent verified production deployment for `web-public`:

- deployment: `https://web-public-ozdb051b4-serviciosdigitalesmxs-projects.vercel.app`
- status: `Ready`

## Current production contract

### Frontend

All frontend API requests should resolve to:

- `https://api.serviciosdigitalesmx.online`

### Backend

Backend remains on Render and is the single API source for the web apps.

### Mobile

The mobile wrapper does not contain direct backend calls in the checked runtime files. Its config reads the web entry URL from:

- `MOBILE_WEB_URL`
- `NEXT_PUBLIC_WEB_ADMIN_URL`
- `APP_URL`

## Notes on Vercel preview variables

Vercel preview envs are branch-scoped. During the migration, production and development were normalized cleanly. Preview env management may still require branch-specific handling depending on how the project is configured in Vercel.

## Commits created today

- `d58512e2` `fix(web-public): resolve public api base url`
- `3f964b37` `fix(config): harden api base url resolution`
- `6bb36c76` `fix(config): unify api url env contract`

## Risk / follow-up

- Keep only `API_URL` as the source of truth for the backend base URL going forward.
- Remove legacy aliases from Vercel once the transition is fully complete and no app depends on them.
- If preview deployments still use older branch-scoped values, add `API_URL` explicitly for those branches in Vercel.
