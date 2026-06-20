# Decisions T09 / T10

Fecha de resolución: 2026-06-20

Alcance:

- T09 Historial clínico por dispositivo.
- T10 Garantías completas.

Este documento congela el diseño aterrizado ya propuesto para T09/T10 y lo valida contra la realidad del repositorio. No introduce una arquitectura nueva ni redefine el negocio.

## Evidencia Encontrada En El Repo

### Órdenes y garantía real

- [supabase/migrations/20260424_baseline_schema.sql](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/supabase/migrations/20260424_baseline_schema.sql) define `service_orders` con `serial_number` y la tabla `service_order_status_history`.
- [supabase/migrations/20260514133525_remote_schema.sql](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/supabase/migrations/20260514133525_remote_schema.sql) agrega `service_orders.warranty_until`.
- [apps/api/src/controllers/orders.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/orders.ts) ya implementa `updateOrderWarranty` sobre `service_orders.warranty_until`.
- [apps/api/src/routes/orders.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/orders.ts) monta la ruta real `PATCH /api/:tenantSlug/orders/:id/warranty` y su alias sin tenant.
- [apps/api/src/index.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/index.ts) confirma que el backend no usa `/api/v1`; las rutas reales están montadas bajo `/api/:tenantSlug/...` y `/api/...`.

### Evidencia, eventos y documentos

- [supabase/migrations/20260523190000_order_documents_events.sql](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/supabase/migrations/20260523190000_order_documents_events.sql) define `service_order_documents` y `service_order_events`.
- [apps/api/src/controllers/orders.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/orders.ts) ya carga `service_order_documents`, `service_order_events` y `service_order_checklists` en `GET /orders/:id`.
- [apps/api/src/services/evidence-adapter.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/services/evidence-adapter.ts) usa `service_order_events` y `service_order_documents` como fuente normalizada de evidencia.
- [apps/web-admin/src/components/dashboard/orders/order-detail-drawer.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-detail-drawer.tsx) ya consume `events`, `documents` e historial de la orden.

### Historial existente por estado

- [supabase/migrations/20260530193000_audit_hardening_multitenant.sql](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/supabase/migrations/20260530193000_audit_hardening_multitenant.sql) crea y alimenta `service_order_status_history` con un trigger sobre cambios de estado de `service_orders`.

### Garantías y módulos reales

- [apps/api/src/services/tenant-config.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/services/tenant-config.ts) expone el módulo `warranty` y ya define `warranty_days` como campo de orden.
- [apps/web-admin/src/services/apiGateway.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/services/apiGateway.ts) ya llama `updateOrderWarranty`.

## Mapa Dominio -> Tabla Física

| Dominio | Tabla física actual | Estrategia de compatibilidad |
| --- | --- | --- |
| `repair_orders` | `service_orders` | Mantener `service_orders` como la tabla viva de órdenes. |
| `device` / historial de equipo | `service_orders.serial_number` + campos inline de `service_orders` | No crear `devices` para este bloque. El historial se agrupa por serial/IMEI dentro del tenant. |
| `order_status_history` | `service_order_status_history` | Usar el historial de estados ya existente como ledger temporal de la orden. |
| `order_events` | `service_order_events` | Usar como evidencia y bitácora de eventos de orden. |
| `order_documents` | `service_order_documents` | Usar como repositorio físico de adjuntos y documentos. |
| `warranty` | `service_orders.warranty_until` | Mantener la vigencia como columna de la orden. |
| `warranty_claims` | No existe | Crear tabla nueva solo para reclamos formales de garantía. |

## Decisión Final Por Bloqueante

### 1. T09 Historial clínico por dispositivo

#### Decisión

- La fuente de verdad para identificar el dispositivo sigue siendo `service_orders.serial_number`.
- El historial clínico se construye consultando todas las órdenes del mismo `tenant_id` con el mismo `serial_number`.
- No se introduce `devices` ni `device_categories` para este ticket.
- La consulta de historial no debe aplicar filtro por sucursal; debe devolver la línea completa del dispositivo dentro del tenant.
- `service_order_status_history` aporta el timeline de estados.
- `service_order_events` y `service_order_documents` siguen siendo evidencia complementaria y ya existen en el repo.

#### Bloqueante resuelto

- Sí. El historial puede implementarse sobre el esquema real existente sin refactorizar el modelo de dispositivo.

### 2. T10 Garantías completas

#### Decisión

- `service_orders.warranty_until` permanece como la vigencia simple de garantía.
- `warranty_claims` sí es necesaria para formalizar el reclamo de garantía entre una orden original y una orden de reclamo/reingreso.
- El flujo no reemplaza la columna de vigencia; la extiende con trazabilidad formal.
- La resolución del reclamo vive en `warranty_claims.resolution_status` y `warranty_claims.resolution_notes`.
- La garantía aprobada no debe implicar cobro automático; el impacto financiero queda desacoplado.

#### Bloqueante resuelto

- Sí. El repo soporta la vigencia simple hoy y el reclamo formal puede añadirse como tabla nueva sin romper lo existente.

## Esquema Final Propuesto

### Índice para historial por serie

```sql
CREATE INDEX IF NOT EXISTS service_orders_tenant_serial_idx
ON public.service_orders (tenant_id, serial_number)
WHERE serial_number IS NOT NULL;
```

### Tabla `warranty_claims`

- `id` uuid PK
- `tenant_id` uuid FK `tenants.id` not null
- `original_order_id` uuid FK `service_orders.id` not null
- `claim_order_id` uuid FK `service_orders.id` not null
- `claim_date` timestamptz not null default `timezone('utc', now())`
- `resolution_status` text not null default `pending`
- `resolution_notes` text null
- `created_by` uuid FK `users.id` not null
- `created_at` timestamptz not null default `timezone('utc', now())`
- `updated_at` timestamptz not null default `timezone('utc', now())`

#### Constraints e índices

- `CHECK (resolution_status IN ('pending', 'approved', 'rejected'))`
- unique index sobre `claim_order_id`
- index sobre `original_order_id`
- RLS por `tenant_id`

## Contratos API Finales

### T09

- `GET /api/:tenantSlug/orders/history/device/:serial_number`
- Alias compatible sin tenant: `GET /api/orders/history/device/:serial_number`

#### Respuesta esperada

- Lista cronológica descendente de órdenes del mismo `tenant_id` y `serial_number`.
- Cada elemento debe incluir, como mínimo:
  - `id`
  - `folio`
  - `status`
  - `serial_number`
  - `created_at`
  - `updated_at`
  - `promised_date`
  - `device_type`
  - `device_brand`
  - `device_model`
  - `estimated_cost`
  - `final_cost`
  - `service_order_status_history`
  - `service_order_events`

### T10

- `PATCH /api/:tenantSlug/orders/:id/warranty`
- `POST /api/:tenantSlug/orders/:originalOrderId/warranty-claims`
- `PATCH /api/:tenantSlug/orders/:originalOrderId/warranty-claims/:claimId`

#### Reglas de contrato

- El `PATCH /warranty` solo ajusta `service_orders.warranty_until`.
- El `POST /warranty-claims` crea el reclamo formal ligado a la orden original y a la orden de reclamo.
- El `PATCH /warranty-claims/:claimId` resuelve el reclamo como `approved` o `rejected`.

## Permisos

- El repo hoy protege estas rutas con autenticación, contexto de tenant y módulo habilitado.
- `warranty` ya está habilitado como módulo del tenant en la configuración real.
- El historial por dispositivo no debe depender de la sucursal para ser visible dentro del tenant.
- La restricción fina por rol no está codificada hoy en la ruta de warranty; si se refuerza en implementación debe hacerse sin cambiar el contrato de negocio.

## Migraciones Necesarias

### T09

- índice `service_orders_tenant_serial_idx`.

### T10

- nueva migración para `warranty_claims`.
- RLS y políticas de lectura/escritura para `warranty_claims`.
- índices de tenant y orden original/reclamo.

### Compatibilidad existente

- no romper `service_order_status_history`.
- no romper `service_order_documents`.
- no romper `service_order_events`.
- no romper `PATCH /orders/:id/warranty`.

## Archivos Exactos A Modificar

### Backend

- [apps/api/src/controllers/orders.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/orders.ts)
- [apps/api/src/routes/orders.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/orders.ts)
- [apps/api/src/controllers/public.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/public.ts)
- [apps/api/src/services/evidence-adapter.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/services/evidence-adapter.ts)
- [apps/api/src/services/audit.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/services/audit.ts)

### Frontend

- [apps/web-admin/src/services/apiGateway.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/services/apiGateway.ts)
- [apps/web-admin/src/components/dashboard/orders/order-detail-drawer.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-detail-drawer.tsx)
- [apps/web-admin/src/components/tecnico/order-modal.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/tecnico/order-modal.tsx)
- [apps/web-admin/src/components/clientes/customer-history.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/clientes/customer-history.tsx)
- [apps/web-admin/src/types.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/types.ts)
- [packages/types/index.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/packages/types/index.ts)

### Supabase

- [supabase/migrations/20260530193000_audit_hardening_multitenant.sql](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/supabase/migrations/20260530193000_audit_hardening_multitenant.sql)
- nueva migración para `service_orders_tenant_serial_idx`
- nueva migración para `warranty_claims`

## Pruebas Requeridas

### T09

- el historial de un `serial_number` devuelve todas las órdenes del mismo tenant.
- la búsqueda no cruza tenants.
- la búsqueda no depende de sucursal.
- la búsqueda funciona con `serial_number` en distinto casing si la normalización de entrada así se decide.

### T10

- `PATCH /orders/:id/warranty` actualiza solo `service_orders.warranty_until`.
- crear un reclamo de garantía exige una orden original vigente o el criterio de negocio definido.
- `claim_order_id` no puede duplicarse.
- resolver un reclamo no borra historial.
- `approved` no debe disparar cobro automático.

### Auditoría T04

- toda acción crítica de garantía genera `audit_logs` con `request_id`.
- el reclamo de garantía debe quedar trazado sin depender de escritura destructiva.

## Rollback

- conservar `service_orders.warranty_until` sin cambios.
- conservar `service_order_status_history`, `service_order_documents` y `service_order_events`.
- si el endpoint de historial falla, no se bloquea la operación base de órdenes.
- si `warranty_claims` falla en producción, se puede desactivar el flujo de reclamos y seguir operando con vigencia simple.

## Definition Of Done

### T09

- puedo buscar el historial completo de una pieza/dispositivo por serie dentro del tenant.
- el historial no filtra por sucursal.
- el historial no expone información de otro tenant.

### T10

- puedo ver y editar la vigencia de garantía en la orden.
- puedo crear un reclamo formal de garantía ligado a una orden original.
- puedo resolver el reclamo como aprobado o rechazado.
- el histórico queda trazable sin borrados destructivos.

## Veredicto

**LISTO PARA IMPLEMENTAR T09/T10**

Motivo:

- el repo ya tiene la orden física (`service_orders`) y la vigencia de garantía (`warranty_until`)
- el repo ya tiene `service_order_status_history`, `service_order_documents` y `service_order_events`
- el backend ya expone la ruta de garantía real y usa `service_orders` como fuente viva
- T09 puede resolverse por serie dentro del tenant sin crear `devices`
- T10 solo requiere formalizar el reclamo de garantía con una tabla nueva, sin reemplazar la vigencia existente
