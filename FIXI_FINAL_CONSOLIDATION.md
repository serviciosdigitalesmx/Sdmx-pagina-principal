# FIXI_FINAL_CONSOLIDATION

## P0
### Bloquea venta
- `Render` must have valid `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET`.
- Evidence: `render.yaml`, `apps/api/src/index.ts`, `apps/api/src/middleware/auth.ts`.
- Impact: without these secrets the API cannot authenticate or operate core flows.

## P1
### Importante
- API URL alias drift across `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_RENDER_API_URL`.
- Evidence: `packages/config/src/index.ts`, `apps/web-admin/src/lib/auth.ts`, `apps/web-public/src/app/login/page.tsx`.
- Impact: wrong alias selection can break login, onboarding, or redirects.
- Auth/session handoff depends on stored token moving across `web-public` and `web-admin`.
- Evidence: `apps/web-public/src/app/onboarding/page.tsx`, `apps/web-public/src/app/login/page.tsx`, `apps/web-admin/src/app/auth/bridge/page.tsx`, `apps/web-admin/src/lib/session.ts`.
- Impact: user must reauthenticate if the token is lost during redirect or storage is cleared.
- Tenant isolation is claim-driven and requires correct JWT content.
- Evidence: `apps/api/src/middleware/auth.ts`, `supabase/migrations/20260523190000_order_documents_events.sql`, `supabase/migrations/20260528000600_harden_live_inventory_rls.sql`.
- Impact: any token issuance defect would weaken isolation, though no bypass was proven.

## P2
### Mejorable
- Duplicate API URL configuration surface.
- Evidence: `packages/config/src/index.ts`, `.env.example`, `apps/web-admin/.env.example`, `apps/web-public/.env.example`, `apps/web-clientes/.env.example`.
- Impact: increases operator error but does not block sale by itself.
- Session-gated UI redirects to login when token is absent.
- Evidence: `apps/web-admin/src/components/auth/session-gate.tsx`.
- Impact: expected behavior, but recovery depends on valid token persistence.

## P3
### Ruido
- Branding, metadata, and trial-copy envs.
- Evidence: `NEXT_PUBLIC_SAAS_*`, `NEXT_PUBLIC_THEME_*`, `NEXT_PUBLIC_CUSTOMER_META_*`.
- Impact: cosmetic or marketing only.

## Decision
### LISTO PARA VENDER
With the evidence currently available in the repository, there is no proven blocker that shows a customer cannot pay, enter the system, and operate in production. The only real sale-blocking risk identified is backend Render secret correctness, which is a deployment/configuration dependency, not a code defect.
