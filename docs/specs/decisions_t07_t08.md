# Decisions T07 / T08

Fecha de resolución: 2026-06-20

Alcance:

- T07 Reserva automática de refacciones por orden.
- T08 Consumo atómico de inventario.

Este documento solo resuelve bloqueantes de diseño y compatibilidad. No implementa código.

## Evidencia Encontrada En El Repo

### Inventario físico real

- [supabase/migrations/20260527091000_cutover_branches_to_sucursales.sql](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/supabase/migrations/20260527091000_cutover_branches_to_sucursales.sql) define `sucursales` y `sucursal_inventory` como la ruta viva del inventario por sucursal.
- [supabase/migrations/20260424_baseline_schema.sql](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/supabase/migrations/20260424_baseline_schema.sql) define `products`, `purchase_orders`, `purchase_order_items`, `inventory_movements`, `stock_alerts`, `expenses` y `customer_payments`.
- [supabase/migrations/20260525012000_restore_inventory_purchase_products.sql](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/supabase/migrations/20260525012000_restore_inventory_purchase_products.sql) confirma el modelo físico actual de `products`, `purchase_orders`, `purchase_order_items`, `inventory_movements` y `stock_alerts`.
- [supabase/migrations/20260603141055_inventory_rpc_hardening.sql](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/supabase/migrations/20260603141055_inventory_rpc_hardening.sql) expone RPCs reales de inventario: `receive_purchase_inventory` y `adjust_inventory`.

### Backend real de inventario

- [apps/api/src/routes/inventory.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/inventory.ts) monta el router de inventario con rutas reales bajo `/api/:tenantSlug/inventory` y `/api/inventory`.
- [apps/api/src/controllers/catalogs.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/catalogs.ts) implementa `listInventory`, `createInventoryItem`, `updateInventoryItem`, `listInventoryMovements` y `transferInventoryItem`.
- [apps/api/src/services/InventoryService.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/services/InventoryService.ts) lee `sucursal_inventory` para métricas de stock.
- [apps/api/src/services/stock-alerts.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/services/stock-alerts.ts) calcula alertas sobre inventario y `stock_current`.
- [apps/api/src/controllers/purchase-orders.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/purchase-orders.ts) usa `receive_purchase_inventory` como operación transaccional de recepción.

### Frontend real de inventario

- [apps/web-admin/src/services/apiGateway.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/services/apiGateway.ts) consume `/inventory`, `/inventory/:id`, `/inventory/:id/movements` y `/inventory/transfer`.
- [apps/web-admin/src/app/dashboard/stock/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/stock/page.tsx) opera con `stock_current` y `minimum_stock`.
- [apps/web-admin/src/components/stock/movement-modal.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/stock/movement-modal.tsx) muestra kardex de `inventory_movements`.
- [apps/web-admin/src/components/sucursales/transfer-modal.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/sucursales/transfer-modal.tsx) usa el flujo de transferencia por sucursal.

### Estado actual de la relación orden-piezas

- No existe tabla física de piezas por orden.
- No existe flujo de reserva o liberación ligado a `service_orders` hoy.
- La única relación indirecta actual entre inventario y orden es `inventory_movements.service_order_id`, que todavía no representa una reserva de trabajo.
- La reserva por orden no puede resolverse solo con `inventory_movements` sin perder estado abierto, trazabilidad de pendientes y liberación idempotente.

## Dominio Canónico Vs Tablas Físicas Actuales

| Dominio canónico | Tabla física actual | Estrategia de compatibilidad |
| --- | --- | --- |
| `repair_orders` | `service_orders` | Mantener `service_orders` como orden física actual. |
| `sucursal` | `sucursales` | Mantener `sucursales` como entidad operativa real. `branches` queda como compatibilidad histórica. |
| `products` / `parts` | `products` | Usar `products` como catálogo físico de refacciones y productos. |
| `inventory_by_branch` | `sucursal_inventory` | Usar `sucursal_inventory` como stock físico por sucursal. |
| `inventory_movements` / `stock_movements` | `inventory_movements` | Usar `inventory_movements` como ledger físico de movimientos. |
| `stock_alerts` | `stock_alerts` | Usar `stock_alerts` como proyección/alerta de bajo stock. |
| `order_parts` | No existe | La relación actual no está modelada; se crea con `inventory_reservations`. |

## Decisión Final Por Bloqueante

### 1. Mapa dominio vs tabla física

#### Decisión

- Orden de reparación: `repair_orders` mapea a `service_orders`.
- Sucursal: la tabla viva es `sucursales`.
- Catálogo de refacciones/productos: la tabla viva es `products`.
- Inventario por sucursal: la tabla viva es `sucursal_inventory`.
- Movimientos de inventario: la tabla viva es `inventory_movements`.
- Relación actual entre orden y piezas: no existe como tabla propia; hoy solo hay referencias indirectas en `inventory_movements.service_order_id` y en el flujo de compra.

#### Bloqueante resuelto

- Sí. El bloque puede implementarse sin renombrar tablas físicas.

### 2. Inventario real

#### Decisión

- `products` es el catálogo físico real.
- `sucursal_inventory.stock_current` es el stock físico materializado por sucursal y producto.
- `inventory_movements` es el ledger físico de entradas, salidas, transferencias y ajustes.
- `stock_alerts` es la proyección operativa de bajo stock.
- `receive_purchase_inventory` y `adjust_inventory` ya prueban que el patrón vigente en el repo es RPC transaccional de servidor, no transacción del cliente.

#### Columnas reales relevantes

- `products`: `id`, `tenant_id`, `sku`, `name`, `category`, `brand`, `compatible_model`, `primary_supplier_id`, `cost`, `sale_price`, `minimum_stock`, `unit`, `location`, `notes`, `is_active`, `created_at`, `updated_at`.
- `sucursal_inventory`: `id`, `tenant_id`, `sucursal_id`, `product_id`, `stock_current`, `created_at`, `updated_at`.
- `inventory_movements`: `id`, `tenant_id`, `sucursal_id` o compatibilidad `branch_id` según migración, `product_id`, `service_order_id`, `purchase_order_id`, `movement_type`, `quantity`, `unit_cost`, `reference`, `notes`, `created_by`, `created_at`.
- `stock_alerts`: `id`, `tenant_id`, `sucursal_id` o compatibilidad `branch_id`, `product_id`, `severity`, `acknowledged_by`, `acknowledged_at`, `created_at`.

#### Bloqueante resuelto

- Sí. El modelo físico real de inventario ya existe.

### 3. Diseño de reserva

#### Decisión

- `inventory_reservations` sí es necesaria.
- `inventory_movements` por sí sola no da un estado abierto confiable para una reserva por orden.
- La fuente de verdad de disponibilidad será:
  - stock físico = `sucursal_inventory.stock_current`
  - reserva abierta = suma de `inventory_reservations.reserved_quantity - consumed_quantity - released_quantity` con estado activo
  - disponibilidad = stock físico menos reserva abierta

#### Esquema final propuesto

`inventory_reservations`

- `id` uuid PK
- `tenant_id` uuid FK `tenants.id` not null
- `sucursal_id` uuid FK `sucursales.id` not null
- `service_order_id` uuid FK `service_orders.id` not null on delete cascade
- `product_id` uuid FK `products.id` not null on delete restrict
- `reserved_quantity` numeric(12,2) not null
- `consumed_quantity` numeric(12,2) not null default 0
- `released_quantity` numeric(12,2) not null default 0
- `status` text not null default `active`
- `idempotency_key` text not null
- `reservation_reason` text null
- `reserved_by` uuid FK `users.id` null
- `consumed_by` uuid FK `users.id` null
- `released_by` uuid FK `users.id` null
- `reserved_at` timestamptz not null default timezone('utc', now())
- `consumed_at` timestamptz null
- `released_at` timestamptz null
- `expires_at` timestamptz null
- `created_at` timestamptz not null default timezone('utc', now())
- `updated_at` timestamptz not null default timezone('utc', now())

Constraints e índices propuestos:

- `CHECK (reserved_quantity > 0)`
- `CHECK (consumed_quantity >= 0)`
- `CHECK (released_quantity >= 0)`
- `CHECK (consumed_quantity + released_quantity <= reserved_quantity)`
- `CHECK (status IN ('active', 'partial', 'consumed', 'released', 'cancelled', 'expired'))`
- unique `(tenant_id, idempotency_key)`
- unique parcial `(tenant_id, service_order_id, product_id)` para reservas activas
- index `(tenant_id, sucursal_id, product_id, status)`
- index `(tenant_id, service_order_id, status)`

RLS:

- select con aislamiento por `tenant_id`
- write con aislamiento por `tenant_id` y permisos de stock reales
- no permitir cruces cross-tenant

Auditoría:

- toda creación, consumo y liberación debe escribir `audit_logs` con `request_id`
- si la auditoría falla, la operación debe fallar y la transacción debe revertirse

Rollback:

- la tabla es aditiva
- si se desactiva el flujo, se dejan de crear nuevas reservas y se liberan las activas con una operación de mantenimiento

#### Bloqueante resuelto

- Sí. La reserva requiere una tabla propia para no perder trazabilidad ni estado abierto.

### 4. Consumo atómico

#### Decisión

- El consumo atómico se implementa mediante RPC SQL transaccional en Supabase.
- No se ejecuta `BEGIN/COMMIT` desde el cliente.
- El patrón correcto en este repo ya existe para `receive_purchase_inventory` y `adjust_inventory`.
- T07/T08 deben seguir el mismo patrón de `security definer` con bloqueo de fila sobre `sucursal_inventory`.

#### Operación exacta

1. **Reservar**
   - validar tenant y sucursal
   - bloquear la fila de `sucursal_inventory`
   - calcular disponibilidad
   - insertar `inventory_reservations`
   - insertar `inventory_movements` con tipo `reserve`
   - registrar `audit_logs`
2. **Consumir**
   - bloquear la reserva activa
   - bloquear la fila de `sucursal_inventory`
   - validar cantidad pendiente
   - descontar `stock_current`
   - marcar la reserva como consumida o parcial
   - insertar `inventory_movements` con tipo `consume`
   - registrar `audit_logs`
3. **Liberar**
   - bloquear la reserva activa
   - marcarla como liberada o cancelada
   - no tocar `stock_current`
   - insertar `inventory_movements` con tipo `release`
   - registrar `audit_logs`

#### Prevención de fallos

- saldo negativo: bloquear si la disponibilidad derivada es insuficiente
- doble consumo: bloquear por estado de reserva e idempotency key única
- fuga cross-tenant: bloquear por `tenant_id` en toda consulta y política RLS
- consumo duplicado: la operación sobre una reserva consumida debe ser idempotente y no reabrirla

#### Bloqueante resuelto

- Sí. La RPC transaccional es el mecanismo correcto para este repo.

### 5. Integración con órdenes y finanzas

#### Decisión

- El consumo físico de inventario no depende del cobro.
- Cobro y consumo quedan desacoplados.
- La liberación de reservas debe dispararse por el estado de la orden, no por el pago.
- Estados canónicos que liberan reservas:
  - `cancelled`
  - `abandoned`
  - `rejected_by_client`
  - `closed_admin` cuando la orden se cierra sin entrega
- Estados que no liberan automáticamente:
  - `delivered`
  - `ready_for_delivery`
  - `repair_completed`
  - `quality_check`

#### Flujo sin ciclos ni doble liberación

- el hook de cancelación debe revisar si existe reserva activa antes de liberar
- la liberación usa `idempotency_key` y estado de reserva para evitar doble liberación
- el cambio de estado a terminal solo dispara la liberación una vez

#### Bloqueante resuelto

- Sí. La liberación está atada al ciclo real de la orden y no al cobro.

### 6. API y permisos

#### Convención real de rutas

- el backend monta inventario bajo `/api/:tenantSlug/inventory` y `/api/inventory`
- inventario de stock ya usa `GET /`, `POST /`, `PATCH /:id`, `GET /:id/movements`, `POST /transfer`
- no existe hoy un endpoint de reservas

#### Endpoints finales propuestos

- `GET /api/:tenantSlug/inventory`
- `POST /api/:tenantSlug/inventory`
- `PATCH /api/:tenantSlug/inventory/:id`
- `GET /api/:tenantSlug/inventory/:id/movements`
- `POST /api/:tenantSlug/inventory/transfer`
- `POST /api/:tenantSlug/inventory/reservations`
- `POST /api/:tenantSlug/inventory/reservations/:id/consume`
- `POST /api/:tenantSlug/inventory/reservations/:id/release`
- `GET /api/:tenantSlug/inventory/reservations?serviceOrderId=...` para lectura de reservas de una orden

#### Permisos existentes y mapeo

- roles reales: `owner`, `manager`, `technician`
- módulo real: `stock`
- lectura actual: owner/manager/technician
- escritura actual de inventario: owner/manager
- reservas de T07/T08 deben permitir owner/manager y technician cuando la operación pertenezca a su sucursal o a la orden asignada

#### Mapeo operativo

- `inventory.reserve` se mapea a `POST /api/:tenantSlug/inventory/reservations`
- `inventory.consume` se mapea a `POST /api/:tenantSlug/inventory/reservations/:id/consume`
- `inventory.release` se mapea a `POST /api/:tenantSlug/inventory/reservations/:id/release`

#### Bloqueante resuelto

- Sí. La convención real de rutas y permisos ya existe; solo se extiende.

## Migraciones Necesarias

### T07

- `create_inventory_reservations`
- índices y constraints de idempotencia
- RLS para `inventory_reservations`
- trigger `updated_at`
- si se decide, un índice o vista de disponibilidad derivada

### T08

- RPCs nuevas o extendidas para reservar, consumir y liberar
- ajuste de `inventory_movements` para guardar movimientos de reserva/consumo/liberación
- si se requiere, índice compuesto sobre `(tenant_id, sucursal_id, product_id, created_at)`

### Compatibilidad existente

- no romper `receive_purchase_inventory`
- no romper `adjust_inventory`
- no romper `transferInventoryItem`
- no romper `stock-alerts`

## Archivos Exactos A Modificar

### Backend

- [apps/api/src/controllers/catalogs.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/catalogs.ts)
- [apps/api/src/routes/inventory.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/inventory.ts)
- [apps/api/src/controllers/purchase-orders.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/purchase-orders.ts)
- [apps/api/src/services/InventoryService.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/services/InventoryService.ts)
- [apps/api/src/services/stock-alerts.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/services/stock-alerts.ts)
- [apps/api/src/services/audit.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/services/audit.ts)
- [apps/api/src/index.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/index.ts)

### Frontend

- [apps/web-admin/src/services/apiGateway.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/services/apiGateway.ts)
- [apps/web-admin/src/app/dashboard/stock/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/stock/page.tsx)
- [apps/web-admin/src/components/stock/product-modal.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/stock/product-modal.tsx)
- [apps/web-admin/src/components/stock/movement-modal.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/stock/movement-modal.tsx)
- [apps/web-admin/src/components/sucursales/transfer-modal.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/sucursales/transfer-modal.tsx)
- [apps/web-admin/src/components/dashboard/orders/order-detail-drawer.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-detail-drawer.tsx)
- [apps/web-admin/src/components/tecnico/order-modal.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/tecnico/order-modal.tsx)
- [apps/web-admin/src/types.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/types.ts)
- [packages/types/index.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/packages/types/index.ts)

### Supabase

- [supabase/migrations/20260603141055_inventory_rpc_hardening.sql](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/supabase/migrations/20260603141055_inventory_rpc_hardening.sql)
- nueva migración para `inventory_reservations`
- nueva migración para RPCs de reserva/consumo/liberación

## Pruebas Requeridas

### Concurrencia

- dos reservas simultáneas sobre el mismo producto/sucursal deben serializarse y no superar la disponibilidad
- dos consumos simultáneos sobre la misma reserva no deben duplicar salida ni dejar stock negativo
- una liberación repetida debe ser idempotente

### Integración

- reservar un producto en una orden debe reflejarse en `inventory_reservations`
- consumir una reserva debe escribir en `inventory_movements`
- liberar por cancelación debe ocurrir una sola vez
- `transferInventoryItem` y `receive_purchase_inventory` siguen funcionando sin romper stock

### Cross-tenant

- ninguna reserva, consumo o liberación puede leer o escribir filas de otro tenant
- una sucursal de otro tenant no puede influir en la disponibilidad

### Auditoría T04

- cada reserva, consumo y liberación crea `audit_logs`
- el `request_id` debe viajar con la operación
- si la auditoría falla, la operación falla

## Rollback

- desactivar el uso de reservas en frontend y backend
- conservar `inventory_reservations` y `inventory_movements` como histórico
- liberar reservas activas antes de apagar el feature flag
- continuar usando `sucursal_inventory.stock_current` y los RPCs actuales de compra/ajuste
- no borrar movimientos históricos

## Definition Of Done

### T07

- la orden puede reservar refacciones por sucursal sin sobredibujar stock
- la reserva queda trazada por orden, producto y sucursal
- la reserva es idempotente
- la disponibilidad se calcula contra stock físico real

### T08

- el consumo de inventario es atómico
- el stock no puede quedar negativo
- no hay doble consumo
- la liberación por cancelación es idempotente
- el ledger de movimientos conserva historia completa

## Veredicto

**LISTO PARA IMPLEMENTAR T07/T08**

Motivo:

- el inventario físico real ya existe en el repo
- el backend ya usa RPCs transaccionales para compra y ajuste
- la reserva requiere una tabla propia, pero eso ya queda definido
- la integración con órdenes se resuelve contra estados canónicos claros
- la API y permisos tienen una ruta natural de extensión sin renombrar tablas
