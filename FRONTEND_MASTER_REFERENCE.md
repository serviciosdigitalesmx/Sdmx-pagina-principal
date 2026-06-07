# FRONTEND_MASTER_REFERENCE

Fecha de consolidación: 2026-06-07

Objetivo:
Documentar la fuente única de verdad del frontend actual de Fixi / Sr. Fix en el monorepo `Sdmx-pagina-principal`, con foco en `apps/web-admin` y `apps/web-public`.

## 1. Arquitectura actual

### 1.1 Apps en alcance

- `apps/web-admin`
- `apps/web-public`

### 1.2 Apps fuera de alcance para esta referencia

- `apps/web-clientes`
- clientes experimentales
- aplicaciones secundarias

### 1.3 Responsabilidad de cada app

- `web-admin`: panel operativo interno para recepción, seguimiento técnico, inventario, compras, finanzas, reportes, sucursales, seguridad y usuarios.
- `web-public`: capa pública de marketing, login, onboarding, tracking y puente de autenticación hacia el panel interno.

### 1.4 Contratos y dependencias

- API backend externa en Render.
- Supabase como fuente de datos con aislamiento por `tenant_id`.
- Rutas y helpers de API resueltos por variables de entorno.
- `web-public` y `web-admin` no deben depender de mocks ni datos estáticos para flujos operativos.

## 2. Flujos existentes

### 2.1 `web-admin`

- Dashboard principal.
- Órdenes / recepción.
- Técnico.
- Solicitudes.
- Clientes.
- Archivo.
- Stock.
- Proveedores.
- Compras.
- Gastos.
- Finanzas.
- Reportes.
- Sucursales.
- Seguridad.
- Usuarios.
- Landing por tenant.

### 2.2 `web-public`

- Home pública.
- Login.
- Auth bridge.
- Onboarding.
- Billing.
- Tracking.
- Portal público por tenant.
- Ruta de portal de cliente por folio.

## 3. Flujos faltantes o incompletos

### 3.1 Vacíos funcionales

- No existe una sola pantalla que reproduzca de forma literal el integrador clásico de Sr. Fix.
- La navegación pública e interna está separada en más rutas que el prototipo legado.
- La experiencia de recepción depende de una combinación de dashboard, modal de captura y drawer de detalle.
- La consistencia visual entre módulos no es idéntica al legado.

### 3.2 Vacíos de UX

- El flujo semáforo no está aislado como una vista dedicada en todas las variantes.
- Hay diferencias en densidad visual, copy y jerarquía respecto a la experiencia histórica.
- Algunas rutas priorizan SaaS multi-tenant sobre operación diaria compacta.

## 4. Decisiones tomadas

- Mantener `web-admin` como panel operativo real y no como prototipo visual.
- Mantener `web-public` como superficie pública y puente de autenticación.
- Priorizar contratos reales y `tenant_id` antes que recreación literal de HTML legado.
- Documentar gaps en lugar de simular datos.

## 5. Componentes críticos

### 5.1 `web-admin`

- `src/components/dashboard/dashboard-shell.tsx`
- `src/components/dashboard/sidebar.tsx`
- `src/components/dashboard/header.tsx`
- `src/components/dashboard/branch-selector.tsx`
- `src/components/dashboard/orders/order-detail-drawer.tsx`
- `src/components/dashboard/orders/order-intake-modal.tsx`
- `src/components/dashboard/orders/order-timeline.tsx`
- `src/components/tecnico/order-modal.tsx`
- `src/components/tecnico/order-card.tsx`
- `src/components/operativo/step-1.tsx`
- `src/components/operativo/step-2.tsx`
- `src/components/operativo/step-3.tsx`
- `src/components/operativo/success.tsx`

### 5.2 `web-public`

- `src/app/login/page.tsx`
- `src/app/onboarding/page.tsx`
- `src/app/auth/bridge/page.tsx`
- `src/app/[tenant]/tracking/page.tsx`
- `src/app/t/[tenantSlug]/portal/page.tsx`
- `src/app/api/[...path]/route.ts`
- `src/lib/public-api.ts`
- `src/lib/admin-url.ts`

## 6. Pantallas críticas

### 6.1 Operación diaria

- Dashboard.
- Órdenes.
- Técnico.
- Solicitudes.
- Clientes.

### 6.2 Back-office

- Archivo.
- Stock.
- Proveedores.
- Compras.
- Gastos.
- Finanzas.
- Reportes.
- Sucursales.
- Seguridad.
- Usuarios.

### 6.3 Superficie pública

- Home pública.
- Login.
- Onboarding.
- Tracking.
- Portal de cliente.

## 7. Convenciones de UI

- Fondos oscuros con contraste alto para operación.
- Tarjetas densas y compactas para lectura rápida.
- Estados visibles por color, badge o jerarquía.
- CTA operativos claros.
- Formularios por pasos en flujos complejos.
- Drawer o modal para detalle de orden.
- Jerarquía clara para folio, estado, promesa y acciones.

## 8. Convenciones de navegación

- `web-admin` usa shell operativo con sidebar.
- `web-public` usa rutas públicas cortas y puente hacia admin.
- Las rutas del panel deben evitar duplicar lógica de captura.
- El flujo de recepción debe poder resolverse desde dashboard, técnico y detalle sin ambigüedad de contexto.

## 9. Flujo Semáforo

### 9.1 Estado actual

- Existe el concepto de semáforo en el ranking visual de órdenes.
- Existe una vista de órdenes priorizadas con estados y urgencia.
- Existe una integración parcial del flujo técnico y del drawer de detalle.

### 9.2 Lo recuperado

- Priorización por urgencia.
- Badges de estado.
- Vistas de pendientes y atrasos.
- Ordenación por fecha prometida y criticidad.

### 9.3 Lo que sigue faltando

- Una vista dedicada y única que reproduzca el flujo semáforo histórico como pantalla principal de operación.
- Menos clics para pasar de recepción a seguimiento técnico.
- Mayor persistencia del contexto operativo entre vista de recepción, tarjeta y detalle.

## 10. Dependencias importantes

- Variables de entorno para URLs públicas y backend.
- Helpers de autenticación compartida.
- Resolver de tenant y sucursal activa.
- Cliente API real.
- Supabase browser/session helpers.

## 11. Qué debe conservarse

- Flujo real de órdenes con detalle editable.
- Recepción con checklist y confirmación.
- Estados operativos visibles.
- Portal público por folio.
- Puente de autenticación entre público y admin.

## 12. Qué debe eliminarse

- Placeholders visuales.
- Copy ambiguo no operativo.
- Rutas duplicadas que hagan el flujo menos predecible.
- Cualquier dependencia de datos simulados para operación diaria.

## 13. Matriz de conservación por versión

Esta matriz resume qué conviene conservar, corregir o descartar de cada candidato de historial. No describe preferencia visual, sino valor operativo real para reactivar el flujo de taller.

| Módulo | `HEAD` | `2c54f4e9` | `71f3fe59` |
| --- | --- | --- | --- |
| Login | Conservar fixes de `web-public`, auth bridge, proxy y onboarding | Conservar base de auth del admin si ya está conectada | Conservar la intención de login simple para operación diaria |
| Dashboard | No usar como base principal del admin | Conservar la estructura más completa del panel | Conservar la shell compacta orientada a trabajo |
| Órdenes | Conservar solo lo que no dependa del sidebar roto | Conservar el listado más completo y la cobertura funcional | Conservar el enfoque de tarjetas y flujo operativo |
| Recepción | Conservar el puente hacia flujo público y captura | Conservar la base más sólida de recepción/admin | Conservar el flujo tipo semáforo y priorización |
| Semáforo | Conservar la integración con acceso público si existe | Conservar estados, listados y cobertura operativa | Conservar casi todo lo conceptual del semáforo |
| Técnico | Conservar solo si no rompe navegación | Conservar la vista de trabajo y acciones | Conservar la mejor intención de operación diaria |
| Clientes | Conservar solo mejoras de portal y acceso | Conservar listado/consulta más completa | Conservar navegación simple si existe |
| Inventario | Conservar fixes generales del frontend | Conservar cobertura administrativa | Conservar el flujo operativo si está presente |
| Portal cliente | Conservar casi todo lo de `web-public` | Conservar solo si no interfiere con admin | Conservar únicamente si aporta navegación clara |

### 13.1 Lectura práctica

- `HEAD` conserva mejor la capa pública.
- `2c54f4e9` conserva mejor la base interna del admin.
- `71f3fe59` conserva mejor el criterio operativo del taller, especialmente semáforo y técnico.

### 13.2 Decisión técnica

- No conviene tomar un único commit como base total.
- La combinación más razonable sigue siendo:
  - `HEAD` para `web-public`
  - `2c54f4e9` para `web-admin`
  - `71f3fe59` para la lógica operativa de taller
