# FIXI current state audit

Fecha de auditoría: 2026-06-08

Alcance: inventario real del repo actual, sin proponer cambios no verificados.

## 1) Mapa real de apps

### `apps/web-admin`
Frontend administrativo en Next.js.

Archivos base verificados:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/login/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/layout.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/lib/api-client.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/lib/api-base-url.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/services/fixService.ts`

Observación:
- Es el panel operativo principal.
- Consume API propia por `NEXT_PUBLIC_API_URL` / `API_URL`.
- Tiene lógica de auth, tenant y PWA en el frontend.

### `apps/web-public`
Frontend público del tenant, onboarding, login, billing y portal público.

Archivos base verificados:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/[tenant]/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/[tenant]/tracking/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/[tenant]/cotizar/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/portal/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/portal/[folio]/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/t/[tenantSlug]/portal/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/onboarding/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/login/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/billing/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/hub/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/api/[...path]/route.ts`

Observación:
- Es la capa pública y de transición de sesión hacia el panel admin.
- Expone landing pública por tenant y proxy de API.

### `apps/web-clientes`
Frontend público muy acotado para landing y portal del cliente.

Archivos base verificados:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/[tenantSlug]/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/t/[tenantSlug]/portal/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/layout.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/api/tenant.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/api/orders.ts`

Observación:
- Tiene menos superficie que `web-public`.
- Se centra en portal del cliente y landing del tenant.

### `apps/api`
Backend Express para Render.

Archivos base verificados:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/index.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/auth.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/public.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/orders.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/customers.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/inventory.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/purchase-orders.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/finance.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/pwa.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/billing.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/middleware/auth.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/middleware/validateTenant.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/lib/scope.ts`

Observación:
- Todas las rutas funcionales pasan por middleware de auth, tenant y rol en la mayoría de módulos críticos.
- Está orientado a Supabase con `supabaseAdmin` en el backend.

## 2) Contratos actuales

### Auth

Contrato verificado:
- `POST /api/auth/register`
- `GET /api/auth/google`
- `POST /api/auth/google/complete`
- `POST /api/auth/exchange`
- `GET /api/auth/me`
- `GET /api/auth/session`
- `GET /api/auth/tenant/:tenantSlug/settings`
- `PUT /api/auth/tenant/:tenantSlug/settings`

Evidencia:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/auth.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/auth.controller.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/middleware/auth.ts`

Contrato de token:
- JWT firmado con `tenant_id`, `tenant_slug`, `role`, `email`, `sucursal_id`, `session_id`.
- La validación del token depende del secreto por tenant (`resolveTenantJwtSecret`).

### `tenant_slug`

Contrato verificado:
- Se valida en middleware contra `req.params.tenantSlug`, `tenantId`, o `tenant`.
- Se rechaza mismatch entre URL y token.

Evidencia:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/middleware/validateTenant.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/middleware/tenantResolver.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/lib/resolve-scope.ts`

### `service_orders`

Contrato funcional observado en `orders`.

Rutas:
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders/:id/attachments`
- `POST /api/orders/:id/notes`
- `POST /api/orders/:id/messages`
- `PATCH /api/orders/:id/status`
- `PATCH /api/orders/:id/details`
- `PATCH /api/orders/:id/financials`
- `GET /api/orders/:id/checklist`
- `PUT /api/orders/:id/checklist`
- `PATCH /api/orders/:id/warranty`

Compatibilidad legacy:
- `GET /api/orders/legacy`

Evidencia:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/orders.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/orders.ts`

### `customers`

Rutas:
- `GET /api/customers`
- `POST /api/customers`

Evidencia:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/customers.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/catalogs.ts`

### `inventory`

Rutas:
- `GET /api/inventory`
- `POST /api/inventory`
- `PATCH /api/inventory/:id`
- `GET /api/inventory/:id/movements`

Evidencia:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/inventory.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/catalogs.ts`

### `purchases`

Contrato real observado como `purchase-orders`.

Rutas:
- `GET /api/purchase-orders`
- `POST /api/purchase-orders`
- `GET /api/purchase-orders/:id`
- `PUT /api/purchase-orders/:id`
- `PATCH /api/purchase-orders/:id/status`
- `POST /api/purchase-orders/:id/receive`
- `DELETE /api/purchase-orders/:id`

Evidencia:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/purchase-orders.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/purchase-orders.ts`

### `finances`

Rutas:
- `GET /api/finance/balance`
- `GET /api/finance/cashflow/:sucursalId`
- `POST /api/finance/expense`
- `GET /api/finance/expense/:id`
- `DELETE /api/finance/expense/:id`

Evidencia:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/finance.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/finance.ts`

### `portal`

Contrato público verificado:
- `GET /api/public/tenant/:tenantSlug/landing`
- `GET /api/public/tenant/:tenantSlug/orders/:folio`
- `GET /api/public/tracking`
- `POST /api/public/quotes`

Evidencia:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/public.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/public.ts`

## 3) Estado actual de UI

### Pantallas que existen

`apps/web-admin`
- `/login`
- `/dashboard`
- `/dashboard/clientes`
- `/dashboard/operativo`
- `/dashboard/stock`
- `/dashboard/gastos`
- `/dashboard/archivo`
- `/dashboard/tareas`
- `/dashboard/proveedores`
- `/dashboard/usuarios`
- `/dashboard/sucursales`
- `/dashboard/ordenes`
- `/dashboard/seguridad`
- `/dashboard/tecnico`
- `/dashboard/solicitudes`
- `/dashboard/finanzas`
- `/dashboard/compras`
- `/dashboard/reportes`
- `/dashboard/landing`
- `/dashboard/archivo`
- `/auth/bridge`

`apps/web-public`
- `/`
- `/[tenant]`
- `/[tenant]/tracking`
- `/[tenant]/cotizar`
- `/portal`
- `/portal/[folio]`
- `/t/[tenantSlug]/portal`
- `/onboarding`
- `/onboarding/google/callback`
- `/onboarding/success`
- `/billing`
- `/billing/success`
- `/billing/failure`
- `/billing/pending`
- `/login`
- `/login/reset-password`
- `/hub`
- `/auth/callback`
- `/auth/bridge`
- `/dashboard`
- `/api/[...path]`

`apps/web-clientes`
- `/`
- `/[tenantSlug]`
- `/t/[tenantSlug]/portal`

### Pantallas incompletas o débiles

Con evidencia directa:
- `apps/web-admin/src/app/dashboard/page.tsx` es un dashboard con llamadas a API, pero todavía depende de módulos múltiples y de estado de sesión local.
- `apps/web-admin/src/app/dashboard/operativo/page.tsx` usa borrador en `localStorage` para el flujo de recepción.
- `apps/web-admin/src/app/dashboard/clientes/page.tsx` guarda borrador en `localStorage` y redirige a recepción.
- `apps/web-admin/src/app/dashboard/archivo/page.tsx` deriva el archivo desde órdenes filtradas por estado, no desde un módulo de archivo separado.
- `apps/web-admin/src/app/dashboard/landing/page.tsx` expone edición de landing y landing content; es funcional, pero la UX depende de contratos largos y muchos campos.
- `apps/web-public/src/app/hub/page.tsx` y `apps/web-public/src/app/auth/bridge/page.tsx` hacen puente de sesión por token en URL.
- `apps/web-clientes/src/app/page.tsx` es solo una entrada informativa con enlaces de ejemplo, no una experiencia operativa.

### Componentes repetidos

Componentes y patrones repetidos observados:
- `Input` / `Textarea` personalizados en `/apps/web-admin/src/components/ui/input.tsx` y `/apps/web-admin/src/components/ui/textarea.tsx`
- Formularios modales por dominio:
  - `/apps/web-admin/src/components/clientes/customer-modal.tsx`
  - `/apps/web-admin/src/components/sucursales/sucursal-modal.tsx`
  - `/apps/web-admin/src/components/seguridad/user-modal.tsx`
  - `/apps/web-admin/src/components/stock/product-modal.tsx`
  - `/apps/web-admin/src/components/stock/movement-modal.tsx`
  - `/apps/web-admin/src/components/tareas/task-modal.tsx`
- Paneles y shells repetidos:
  - `/apps/web-admin/src/components/dashboard/dashboard-shell.tsx`
  - `/apps/web-admin/src/components/dashboard/module-shell.tsx`
  - `/apps/web-admin/src/components/dashboard/sidebar.tsx`
  - `/apps/web-admin/src/components/dashboard/header.tsx`

Patrón relevante:
- Hay bastante duplicación de navegación, headers y contenedores entre pantallas de admin y web pública.

### Rutas rotas o débiles

Evidencia de debilidad, no necesariamente rotura total:
- `apps/web-public/src/app/page.tsx` y `apps/web-public/src/app/hub/page.tsx` dependen de `NEXT_PUBLIC_WEB_ADMIN_URL` para redirección/puente.
- `apps/web-public/src/app/api/[...path]/route.ts` actúa como proxy; si `API_URL` no está definido, el flujo queda debilitado.
- `apps/web-admin/src/app/login/page.tsx` exige `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `apps/web-admin/src/app/auth/bridge/page.tsx` y `apps/web-public/src/app/auth/bridge/page.tsx` dependen de tokens en query string.
- `apps/web-clientes/src/app/page.tsx` usa rutas de ejemplo (`/t/demo/...`) que son solo demo de navegación.

## 4) Riesgos

### Auth

Riesgo confirmado:
- El flujo de autenticación depende de JWT propio del backend y de Supabase en frontend, con puentes entre apps.
- Si falla el intercambio de token o el bridge, el usuario queda desautenticado entre dominios.

Evidencia:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/auth.controller.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/auth/bridge/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/auth/bridge/page.tsx`

### Tenant isolation

Riesgo mitigado pero sensible:
- El backend valida `tenant_slug` y `tenant_id`, y las queries relevantes filtran por `tenant_id`.
- Aun así, hay muchas rutas y módulos; un error de middleware o scope puede romper aislamiento.

Evidencia:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/middleware/auth.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/middleware/validateTenant.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/lib/resolve-scope.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/public.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/catalogs.ts`

### CORS

Riesgo confirmado:
- CORS depende de `CORS_ALLOWED_ORIGINS` más una lista de fallback y detección de Vercel/localhost.
- Si los dominios reales cambian o faltan vars, el frontend puede quedar bloqueado.

Evidencia:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/index.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/render.yaml`

### Service worker / PWA

Riesgo confirmado:
- Hay manifest y service worker dinámicos en `web-admin`.
- El API expone endpoints `pwa` con VAPID, pero dependen de variables de entorno.

Evidencia:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/api/pwa/manifest/route.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/api/pwa/sw.js/route.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/pwa.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/pwa.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/services/pwa-push.ts`

### Variables de entorno

Riesgo confirmado:
- Hay muchas rutas críticas que fallan si faltan env vars.
- Se observan dependencias en frontend y backend para URLs, llaves y branding.

Evidencia:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/lib/api-base-url.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/login/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/billing/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/services/billing.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/render.yaml`

### Llamadas directas a Supabase desde frontend

Riesgo confirmado:
- El frontend sí usa Supabase directamente para login y sesión en al menos `web-admin` y `web-public`.
- Eso no es necesariamente incorrecto, pero aumenta la superficie de dependencia de `NEXT_PUBLIC_SUPABASE_*`.

Evidencia:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/lib/supabase-browser.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/login/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/lib/supabase-browser.ts`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/login/page.tsx`

## Conclusión operativa

El repo sí tiene tres frontends funcionales y un backend real. El contrato de multitenancy existe y está bastante extendido por middleware y queries con `tenant_id`, pero la superficie de auth, puente de sesión, CORS, PWA y env vars sigue siendo sensible.

No se propone cambio alguno en este documento. Esta auditoría solo confirma estado real y archivos existentes.
