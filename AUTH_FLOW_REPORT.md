# AUTH_FLOW_REPORT

## Verdict
No evidence of a broken auth loop that prevents login in the inspected code paths.

## Evidence

### Landing -> onboarding
- `apps/web-public/src/app/onboarding/page.tsx` posts to `${resolveApiBaseUrl()}/api/auth/register`.
- It saves returned token with `saveAuthToken(data.token)` and redirects to the server-provided `redirectUrl`.

### Onboarding callback
- `apps/web-public/src/app/auth/callback/page.tsx` forwards query params to `/onboarding/google/callback`.

### Login -> dashboard
- `apps/web-public/src/app/login/page.tsx` uses Supabase password sign-in, exchanges access token with `/api/auth/exchange`, saves API token, and redirects to `/dashboard`.

### Bridge handling
- `apps/web-admin/src/app/auth/bridge/page.tsx` stores the token from the query string and replaces the location with `/dashboard`.
- `apps/web-public/src/app/hub/page.tsx` also reads token from query/local storage and routes to admin bridge if configured.

### Session validation
- `apps/web-admin/src/lib/session.ts` requires `tenant_slug` in the decoded token.
- Missing `tenant_slug` returns `null` instead of impersonating a session.
- `apps/web-admin/src/components/auth/session-gate.tsx` redirects to `/login` if no token exists.

## Findings

| severity | finding | evidence | impact |
|---|---|---|---|
| P1 | Auth flow depends on a successful token handoff between web/public and web/admin, with local storage as the bridge | `apps/web-public/src/app/login/page.tsx`, `apps/web-admin/src/app/auth/bridge/page.tsx`, `apps/web-admin/src/lib/session.ts` | If token storage is blocked by browser policy or user clears storage between redirects, the user must re-authenticate |
| P2 | Session persistence is token-driven and not server-session-driven in the admin frontend | `apps/web-admin/src/components/auth/session-gate.tsx`, `apps/web-admin/src/lib/session.ts` | Some recovery is limited to token presence, not active server session lookup |

## Not found
- No verified redirect loop was observed in the inspected auth code.
- No verified tenant mismatch bug was proven from code alone.
- No verified auth blocker preventing a customer from entering the system was found.
