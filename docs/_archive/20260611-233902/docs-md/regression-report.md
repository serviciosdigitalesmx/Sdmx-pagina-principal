# Regression Report

Fecha: 2026-05-26

Comparación base:
- Source: [Sr-Fix](https://github.com/serviciosdigitalesmx/Sr-Fix)
- Target: [Sdmx-pagina-principal](/Users/jesusvilla/Desktop/Sdmx-pagina-principal)

Fuentes auditadas:
- [docs/ui/source-truth.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/ui/source-truth.md)
- [docs/parity/dashboard.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/parity/dashboard.md)
- [apps/api/src/controllers/public.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/public.ts)
- [apps/api/src/routes/public.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/public.ts)
- [apps/api/src/controllers/orders.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/orders.ts)
- [apps/web-admin/src/services/fixService.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/services/fixService.ts)
- [apps/web-public/src/app/[tenant]/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/%5Btenant%5D/page.tsx)
- [apps/web-public/src/app/[tenant]/cotizar/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/%5Btenant%5D/cotizar/page.tsx)
- [apps/web-public/src/app/[tenant]/tracking/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/%5Btenant%5D/tracking/page.tsx)
- [apps/web-public/src/app/t/[tenantSlug]/portal/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/t/%5BtenantSlug%5D/portal/page.tsx)
- [apps/web-admin/src/components/dashboard/dashboard-shell.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/dashboard-shell.tsx)
- [apps/web-admin/src/components/dashboard/module-shell.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/module-shell.tsx)
- [apps/web-admin/src/components/dashboard/operational-hub.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/operational-hub.tsx)
- [apps/web-admin/src/components/dashboard/orders/order-intake-modal.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-intake-modal.tsx)
- [apps/web-admin/src/components/dashboard/orders/order-detail-drawer.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-detail-drawer.tsx)
- [apps/web-admin/src/app/dashboard/ordenes/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/ordenes/page.tsx)
- [.env.example](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/.env.example)
- [render.yaml](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/render.yaml)

## 1. Contratos revisados

### 1.1 Frontend público

- `web-public` consume endpoints reales de landing, cotización, tracking y portal.
- Contrato de landing público:
  - `GET /api/public/tenant/:tenantSlug/landing`
- Contrato de cotización:
  - `POST /api/public/quotes`
- Contrato de tracking:
  - `GET /api/public/tracking`
- Contrato de portal cliente:
  - `GET /api/public/tenant/:tenantSlug/orders/:folio`

### 1.2 Frontend admin

- `web-admin` consume endpoints por tenant con `fixService`.
- El dashboard usa contexto de tenant desde host + auth.
- Los módulos operan con el contrato actual de API real.

### 1.3 Backend

- `apps/api/src/controllers/public.ts`
- `apps/api/src/controllers/orders.ts`
- `apps/api/src/routes/public.ts`

No se detectó cambio de contrato de DTOs en esta pasada.

## 2. DTOs revisados

### 2.1 DTOs públicos

- `LandingResponse` en `apps/web-public/src/app/[tenant]/page.tsx`
- `QuoteResponse` en `apps/web-public/src/app/[tenant]/cotizar/page.tsx`
- `PortalOrderResponse` en `apps/web-public/src/app/t/[tenantSlug]/portal/page.tsx`

### 2.2 DTOs admin

- `ApiListResponse`, `ApiSingleResponse`, `ApiErrorResponse` en `apps/web-admin/src/services/fixService.ts`
- `LandingContent` y normalizadores en `apps/web-admin/src/services/fixService.ts`
- tipos de órdenes, solicitudes, inventario, seguridad y tenant settings en `fixService`

### 2.3 Resultado

- No se detectó ruptura de DTOs.
- Sí se detectó desalineación de presentación y copy frente a `Sr-Fix`.

## 3. Endpoints revisados

### 3.1 Backend público

- `GET /api/public/tenant/:tenantSlug/landing`
- `GET /api/public/tenant/:tenantSlug/orders/:folio`
- `GET /api/public/tracking`
- `POST /api/public/quotes`

### 3.2 Backend privado

- rutas por tenant en `apps/api/src/index.ts`
- órdenes, clientes, inventario, compras, gastos, finanzas, reportes, sucursales, seguridad, solicitudes

### 3.3 Resultado

- No se detectó cambio de rutas backend.
- No se detectó cambio de forma de request/response en esta pasada.

## 4. Variables de entorno revisadas

### 4.1 Fuente de configuración

- `.env.example`
- `.env.local`
- `render.yaml`

### 4.2 Variables críticas observadas

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_BASE_DOMAIN`
- `NEXT_PUBLIC_WEB_ADMIN_URL`
- `NEXT_PUBLIC_CUSTOMER_TRACKING_URL`
- `NEXT_PUBLIC_SAAS_BRAND_NAME`
- `NEXT_PUBLIC_SAAS_META_TITLE`
- `NEXT_PUBLIC_SAAS_META_DESCRIPTION`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `APP_URL`
- `WEBHOOK_BASE_URL`
- `CORS_ALLOWED_ORIGINS`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4.3 Hallazgo

- Hay drift histórico entre backups de producción y el estado activo local.
- El frontend depende de variables reales para operar, así que una mala variable sí puede producir regresión visible.

## 5. Deploy real revisado

### 5.1 Render

- `render.yaml` existe y concentra variables críticas.
- El historial previo del proyecto mostró fallos de build por lockfile y por estado del instalador.

### 5.2 Vercel

- Los proyectos siguen existiendo y están conectados al repo.
- El flujo de build ya mostró fallos por `pnpm install` y por checks de entorno, no por DTOs o endpoints.

### 5.3 Riesgo de regresión de deploy

- alto si cambian variables o configuración de instalación
- medio si se altera el root directory o el install command
- bajo en el código visual tocado en esta auditoría

## 6. Comparación SR-FIX vs SDMX

### 6.1 Rutas

- `Sr-Fix`: una landing pública, un integrador interno, un portal cliente, paneles específicos por dominio.
- `SDMX`: rutas separadas por apps y por tenant.

Estado:
- `PARCIAL`

### 6.2 Navegación

- `Sr-Fix`: navegación concentrada en `integrador.html`.
- `SDMX`: navegación distribuida entre shell, hub y módulos.

Estado:
- `PARCIAL`

### 6.3 Textos

- `Sr-Fix`: copy operativo, directo, centrado en recepción, técnico y seguimiento.
- `SDMX`: todavía conserva lenguaje SaaS en varias superficies.

Estado:
- `PARCIAL`

### 6.4 Tiempos

- `Sr-Fix`: flujo simple, menor fricción.
- `SDMX`: más carga visual, más capas y mayor complejidad de shell.

Estado:
- `PARCIAL`

### 6.5 Estados

- `Sr-Fix`: empty states muy explícitos.
- `SDMX`: empty states reales, pero algunos siguen menos directos.

Estado:
- `PARCIAL`

### 6.6 Formularios

- `Sr-Fix`: recepción y confirmación en pasos claros, con modales densos.
- `SDMX`: modal de órdenes y drawers ya están alineados, pero todavía no idénticos.

Estado:
- `PARCIAL`

### 6.7 PDF

- `Sr-Fix`: generación/descarga ligada al flujo operativo.
- `SDMX`: PDF real existe en backend y en portal, con attachment/receipt support.

Estado:
- `PARCIAL`

### 6.8 WhatsApp

- `Sr-Fix`: WhatsApp directo desde recepción y seguimiento.
- `SDMX`: se construyen links reales desde órdenes, portal y tracking.

Estado:
- `PARCIAL`

### 6.9 Portal

- `Sr-Fix`: portal simple por folio, con datos reales, timeline, archivos y contacto.
- `SDMX`: portal real y conectado a API, pero con divergencias de estilo y densidad.

Estado:
- `PARCIAL`

## 7. Regresiones detectadas

### 7.1 Regresión visual parcial

**Archivo origen:** [integrador.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/integrador.html)  
**Archivo destino:** [apps/web-admin/src/components/dashboard/dashboard-shell.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/dashboard-shell.tsx)  
**Razón:** el target ya no es un shell SaaS estándar, pero todavía no es una réplica exacta del integrador fuente.  
**Riesgo:** medio, porque la distancia visual afecta percepción de paridad aunque no rompe funcionalidad.  
**Prueba:** la navegación sigue real, pero el framing de la UI no coincide 1:1 con el source.

### 7.2 Regresión de copy operativo parcial

**Archivo origen:** `panel-operativo.html`  
**Archivo destino:** [apps/web-admin/src/components/dashboard/orders/order-intake-modal.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-intake-modal.tsx)  
**Razón:** ya se acercó al lenguaje del source, pero todavía hay etiquetas y microcopy que no son idénticos.  
**Riesgo:** medio-bajo.  
**Prueba:** el alta sigue siendo real, pero el texto no es totalmente isomórfico al prototipo.

### 7.3 Regresión de shell distribuido

**Archivo origen:** `integrador.html`  
**Archivo destino:** [apps/web-admin/src/components/dashboard/operational-hub.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/operational-hub.tsx)  
**Razón:** el source concentra el acceso, el target separa shell + hub + módulos.  
**Riesgo:** bajo-mediano.  
**Prueba:** no rompe datos, pero sí cambia la sensación del flujo.

## 8. Qué revertir si empeora

Si en una validación visual o funcional algo se degrada:

- revertir cambios solo de presentación en `dashboard-shell.tsx`
- revertir cambios solo de copy en `module-shell.tsx`
- revertir cambios solo de framing en `operational-hub.tsx`
- revertir cambios solo de copy y styles en:
  - `order-intake-modal.tsx`
  - `order-detail-drawer.tsx`
  - `ordenes/page.tsx`

No revertir:
- endpoints
- DTOs
- RLS
- `tenant_id`
- lógica de env

## 9. Conclusión

- No se detectó una regresión funcional crítica en rutas, DTOs, endpoints o backend.
- Sí se detectó una regresión de paridad visual/experiencial respecto a `Sr-Fix` en varias superficies.
- El frontend ya opera con datos reales, pero la experiencia todavía no es idéntica.
- Antes de tocar más código, la siguiente validación debería ser visual + E2E sobre:
  - Dashboard
  - Órdenes
  - Portal Cliente
  - Landing pública

