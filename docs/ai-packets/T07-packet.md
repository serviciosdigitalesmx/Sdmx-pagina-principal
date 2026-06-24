# T07 PACKET PARA GPT-5.5

## 1. Objetivo

T07 debe reservar refacciones por orden sin romper el inventario físico actual. El repo ya tiene `products`, `sucursal_inventory` e `inventory_movements`, pero no una tabla de reservas abierta por orden. La meta de este packet es cerrar el contrato técnico antes de implementar. La ruta canónica sigue el mapeo T00 y no renombra nada.

## 2. Estado Git

- Rama actual: `main...origin/main`
- Últimos 8 commits:
  - `266c362 docs: define T00 canonical foundations strategy`
  - `5912caf chore: add supabase cli dependency`
  - `6935a29 feat(t02): add consent and evidence visibility controls`
  - `343b0bb feat(t06): add order payment refunds`
  - `327c375 feat(t05): register order payments`
  - `0c7fef5 feat(t03): enforce configurable serial number`
  - `9afcada feat(t01): enforce legal intake checklist`
  - `62d9c78 docs: finalize Fixi implementation decisions`
- Cambios locales antes de crear el packet: no había cambios locales; el repo estaba limpio.
- Archivos creados por esta tarea: `docs/ai-packets/T07-packet.md`.

## 3. Decisiones heredadas de T00

Mapeo oficial aplicable:

- `repair_orders` / `orders` → `service_orders`
- `parts` → `products`
- `stock_movements` → `inventory_movements`
- inventario por sucursal → `sucursal_inventory`
- sucursal → `sucursales` / compatibilidad `branches` según repo

Implicación: T07 debe hablar en canónico, pero operar sobre el físico vivo sin renombrar tablas.

## 4. Documentación revisada

- `AGENTS.md`
  - Decisión relevante: prohíbe renombrar tablas y obliga a usar el mapeo canónico ↔ físico.
  - Impacto: T07 debe apoyarse en `service_orders`, `products`, `sucursal_inventory` e `inventory_movements`.
- `docs/specs/decisions_t00_fundaciones_canonicas.md`
  - Decisión relevante: compatibilidad progresiva + capa canónica de documentación/contrato.
  - Impacto: T07 puede continuar sin migración destructiva completa.
- `docs/specs/spec_03_inventario_cliente.md`
  - Decisión relevante: `inventory_reservations` sí es necesaria; `inventory_movements` sola no basta; disponibilidad = stock físico menos reserva abierta.
  - Impacto: T07 necesita una tabla nueva de reservas.
- `docs/specs/decisions_t07_t08.md`
  - Decisión relevante: el inventario físico vive en `sucursal_inventory.stock_current`, el ledger en `inventory_movements`, y la relación orden-piezas no existe como tabla propia.
  - Impacto: confirma que T07 debe introducir reservas y no reutilizar solo el ledger.
- `docs/specs/implementation_order.md`
  - Decisión relevante: T07 va después de Fundaciones, T01, T03, T02, T05 y T06.
  - Impacto: T07 ya está habilitado por orden técnico, pero no debe saltarse el contrato de reserva.
- `docs/specs/dependencies.md`
  - Decisión relevante: T07 depende de Fundaciones y desbloquea T08.
  - Impacto: T07 es bloqueante directo para el consumo atómico posterior.

## 5. Decisiones técnicas ya cerradas para T07

- `inventory_reservations` debe existir.
- `inventory_movements` no basta porque no modela una reserva abierta, liberación idempotente ni estado parcial confiable.
- Disponibilidad = `sucursal_inventory.stock_current` menos suma de reservas activas pendientes.
- Tablas físicas reales para T07: `products`, `sucursal_inventory`, `inventory_movements`, `service_orders`, `audit_logs`, `users`, `tenants`, `sucursales`.
- No debe renombrarse ninguna tabla física.
- T07 cubre reservar, consultar y liberar; T08 cubre el consumo atómico final.

## 6. Tablas físicas reales involucradas

- `products`
  - Confirmado en: `supabase/migrations/20260424_baseline_schema.sql`, `supabase/migrations/20260525012000_restore_inventory_purchase_products.sql`
  - Columnas relevantes: `id`, `tenant_id`, `sku`, `name`, `category`, `brand`, `compatible_model`, `primary_supplier_id`, `cost`, `sale_price`, `minimum_stock`, `unit`, `location`, `notes`, `is_active`, `created_at`, `updated_at`
  - Uso previsto: catálogo de refacciones/productos.
- `sucursal_inventory`
  - Confirmado en: `supabase/migrations/20260528001442_cutover_branches_to_sucursales.sql`
  - Columnas relevantes: `id`, `tenant_id`, `sucursal_id`, `product_id`, `stock_current`, `created_at`, `updated_at`
  - Uso previsto: stock físico por sucursal.
- `inventory_movements`
  - Confirmado en: `supabase/migrations/20260424_baseline_schema.sql`, `supabase/migrations/20260527093000_migrate_branch_fks_to_sucursales.sql`
  - Columnas relevantes: `id`, `tenant_id`, `branch_id`/`sucursal_id`, `product_id`, `service_order_id`, `purchase_order_id`, `movement_type`, `quantity`, `unit_cost`, `reference`, `notes`, `created_by`, `created_at`
  - Uso previsto: ledger físico de entradas/salidas/transferencias/ajustes y, más adelante, movimientos de reserva/consumo/liberación.
- `service_orders`
  - Confirmado en: `supabase/migrations/20260424_baseline_schema.sql`
  - Columnas relevantes: `id`, `tenant_id`, `branch_id`, `customer_id`, `service_request_id`, `folio`, `status`, `priority`, `device_type`, `device_brand`, `device_model`, `serial_number`, `reported_issue`, `internal_diagnosis`, `estimated_cost`, `final_cost`, `promised_date`, `received_at`, `completed_at`, `delivered_at`, `archived_at`, `caso_resolucion_tecnica`, `created_by`, `updated_by`, `created_at`, `updated_at`
  - Uso previsto: ancla de reserva por orden.
- `audit_logs`
  - Confirmado en: `supabase/migrations/20260530132000_security_backoffice_tables.sql`
  - Columnas relevantes: `id`, `tenant_id`, `user_id`, `action`, `entity_type`, `entity_id`, `request_id`, `metadata`, `created_at`
  - Uso previsto: trazabilidad de reserva/consumo/liberación.
- `users`
  - Confirmado en: `supabase/migrations/20260424_baseline_schema.sql`
  - Columnas relevantes: `id`, `tenant_id`, `branch_id`, `auth_user_id`, `full_name`, `email`, `phone`, `role`, `is_active`, `last_login_at`, `created_at`, `updated_at`
  - Uso previsto: actor de stock y autorización.
- `tenants`
  - Confirmado en: `supabase/migrations/20260424_baseline_schema.sql`
  - Columnas relevantes: `id`, `name`, `slug`, `status`, `plan`, `contact_name`, `contact_email`, `contact_phone`, `created_at`, `updated_at`
  - Uso previsto: aislamiento por tenant.
- `sucursales`
  - Confirmado en: `supabase/migrations/20260528001442_cutover_branches_to_sucursales.sql`
  - Columnas relevantes: `id`, `tenant_id`, `name`, `code`, `address`, `city`, `state`, `phone`, `is_active`, `created_at`, `updated_at`
  - Uso previsto: aislamiento por sucursal.

## 7. Código real relacionado

- `apps/api/src/routes/inventory.ts`
  - Función relevante: monta `/inventory`, `/transfer`, `/:id/movements`.
  - Importancia: es la entrada real de inventario.
  - Candidato: referencia para endpoints nuevos de reservas; no tocar todavía.
- `apps/api/src/controllers/catalogs.ts`
  - Funciones relevantes: `listInventory`, `createInventoryItem`, `updateInventoryItem`, `listInventoryMovements`, `transferInventoryItem`.
  - Importancia: contiene el inventario operativo actual.
  - Candidato: referencia principal si luego se conecta reserva, pero hoy solo evidencia.
- `apps/api/src/services/InventoryService.ts`
  - Función relevante: `getInventoryMetrics`.
  - Importancia: calcula métricas sobre `sucursal_inventory`.
  - Candidato: solo referencia.
- `apps/api/src/services/stock-alerts.ts`
  - Funciones relevantes: `syncStockAlertForInventoryRow`, `listStockAlerts`, `acknowledgeStockAlert`.
  - Importancia: muestra el patrón de stock bajo y alertas.
  - Candidato: solo referencia.
- `apps/api/src/controllers/purchase-orders.ts`
  - Función relevante: `receivePurchaseOrder`.
  - Importancia: usa `receive_purchase_inventory` y confirma el patrón RPC transaccional.
  - Candidato: referencia de integración.
- `apps/api/src/controllers/reports.ts`
  - Función relevante: `getReportsSummary`.
  - Importancia: agrega `sucursal_inventory` e `inventory_movements` y detecta uso de `service_order_id`.
  - Candidato: referencia para validar métricas post-T07.

## 8. Patrón RPC existente

- `receive_purchase_inventory`: RPC `security definer` que bloquea la compra, actualiza `sucursal_inventory`, inserta `inventory_movements` y devuelve payload consolidado.
- `adjust_inventory`: RPC real mencionada en `docs/specs/decisions_t07_t08.md` como el otro patrón transaccional de servidor.
- Patrón reutilizable para T07: bloqueo de fila, validación de tenant/sucursal, escritura atómica y respuesta consolidada desde backend, no desde cliente.

## 9. Riesgos reales

- Stock negativo si se reserva más de lo disponible.
- Reservas duplicadas si no hay `idempotency_key`.
- Doble reserva si una orden se procesa dos veces.
- Ruptura de aislamiento tenant si se omite `tenant_id` en filtros o RLS.
- Sucursal incorrecta si se reserva contra una sucursal distinta a la orden.
- Riesgo para T04 si la auditoría no es append-only y consistente.
- Concurrencia: dos procesos podrían intentar reservar el mismo stock.
- Migraciones Supabase pendientes o desalineadas: el repo sigue usando compatibilidad `branch_id`/`sucursal_id` en varias tablas.

## 10. Preguntas para GPT-5.5

1. ¿`inventory_reservations` entra como tabla nueva aditiva en T07 o se difiere?
2. ¿La reserva debe crearse al asignar piezas a la orden o solo cuando el técnico confirma trabajo?
3. ¿La liberación automática de reservas depende del estado terminal de `service_orders` o de una acción manual?
4. ¿Se autoriza usar RPC SQL nueva para reservar/liberar, siguiendo el patrón de `receive_purchase_inventory`?
5. ¿Se autoriza exponer un endpoint de lectura de reservas por orden desde el arranque de T07?

## 11. Lo que GPT-5.5 debe devolver

- T07 WORKPACK cerrado.
- Archivos autorizados.
- SQL exacto de migración.
- Endpoints exactos.
- Contratos request/response.
- Reglas de autorización.
- Pasos para Codex Mini.
- Comandos de validación.
- Rollback.
- Criterios de aceptación.
