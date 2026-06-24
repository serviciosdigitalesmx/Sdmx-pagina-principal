# T08 PACKET PARA GPT-5.5

## 1. Objetivo

T08 debe consumir físicamente refacciones reservadas por orden sin romper el contrato de T07. El flujo debe descontar `sucursal_inventory.stock_current`, registrar el consumo en `inventory_movements`, actualizar la reserva y auditar cada operación con `request_id`. No debe crear otra capa de reservas ni redefinir el modelo canónico ya cerrado.

## 2. Estado Git

- Rama actual: `main...origin/main`
- Últimos 8 commits:
  - `96e8835 feat(t07): add inventory reservations`
  - `266c362 docs: define T00 canonical foundations strategy`
  - `5912caf chore: add supabase cli dependency`
  - `6935a29 feat(t02): add consent and evidence visibility controls`
  - `343b0bb feat(t06): add order payment refunds`
  - `327c375 feat(t05): register order payments`
  - `0c7fef5 feat(t03): enforce configurable serial number`
  - `9afcada feat(t01): enforce legal intake checklist`
- Cambios locales antes de crear el packet: el repo estaba limpio salvo el propio packet T08 que se va a crear.
- Archivos creados por esta tarea: `docs/ai-packets/T08-packet.md`.

## 3. Dependencia Directa de T07

- T07 creó `inventory_reservations`, la RPC `reserve_inventory_for_order`, la RPC `release_inventory_reservation` y los endpoints `/inventory/reservations`.
- T08 debe reutilizar ese contrato, especialmente `tenant_id`, `service_order_id`, `product_id`, `sucursal_id`, `reserved_quantity`, `consumed_quantity`, `released_quantity`, `status` e `idempotency_key`.
- No debe duplicar la tabla de reservas ni inventar otra reserva paralela.
- La reserva abierta de T07 es la base sobre la que T08 registra el consumo físico.

## 4. Documentación Revisada

- `AGENTS.md`
  - Decisión relevante: no renombrar tablas físicas y respetar el mapeo canónico ↔ físico.
  - Impacto: T08 debe operar sobre `service_orders`, `products`, `sucursal_inventory` e `inventory_movements`.
- `docs/specs/decisions_t00_fundaciones_canonicas.md`
  - Decisión relevante: la base canónica se resuelve por compatibilidad progresiva.
  - Impacto: T08 debe alinearse con el contrato ya publicado, no con un rediseño destructivo.
- `docs/specs/spec_03_inventario_cliente.md`
  - Decisión relevante: el stock físico vive en `sucursal_inventory.stock_current`, el ledger en `inventory_movements`, y el consumo debe ser atómico.
  - Impacto: T08 debe descontar stock real y escribir el ledger.
- `docs/specs/decisions_t07_t08.md`
  - Decisión relevante: T07 reserva, T08 consume, y la liberación no toca stock físico.
  - Impacto: T08 es el primer punto donde sí se descuenta inventario físico.
- `docs/specs/implementation_order.md`
  - Decisión relevante: T08 sigue después de T07.
  - Impacto: T08 depende del cierre de reservas.
- `docs/specs/dependencies.md`
  - Decisión relevante: T08 depende de T07 y del modelo de inventario vigente.
  - Impacto: no puede implementarse sin el contrato de reserva publicado.
- `docs/ai-packets/T07-packet.md`
  - Decisión relevante: explica el contrato de reserva y el patrón de RPC/backoffice.
  - Impacto: T08 debe consumir sobre esa capa.
- `docs/implementation-results/T07-result.md`
  - Decisión relevante: T07 quedó validado y publicado.
  - Impacto: T08 parte de una base real, no hipotética.

## 5. Decisiones Técnicas Ya Cerradas para T08

- T08 consume inventario real.
- T08 descuenta `sucursal_inventory.stock_current`.
- T08 actualiza `inventory_reservations.consumed_quantity`.
- T08 registra `inventory_movements`.
- T08 audita con `request_id`.
- T08 debe ser atómico.
- T08 no debe permitir stock negativo.
- T08 no debe permitir doble consumo.

Evidencia:
- `docs/specs/decisions_t07_t08.md` define que T08 es consumo atómico y que la reserva abierta se mide contra `stock_current`.
- `docs/specs/spec_03_inventario_cliente.md` dice que el consumo debe escribir en `inventory_movements` y que el stock base vive en `sucursal_inventory.stock_current`.
- `supabase/migrations/20260624120000_t07_inventory_reservations.sql` ya guarda `consumed_quantity`, `released_quantity`, `status` e `request_id` en auditoría.

## 6. Tablas Físicas Reales Involucradas

- `inventory_reservations`
  - Confirmado en: `supabase/migrations/20260624120000_t07_inventory_reservations.sql`
  - Columnas relevantes: `tenant_id`, `sucursal_id`, `service_order_id`, `product_id`, `reserved_quantity`, `consumed_quantity`, `released_quantity`, `status`, `idempotency_key`, `reserved_by`, `consumed_by`, `released_by`, `reserved_at`, `consumed_at`, `released_at`, `expires_at`, `created_at`, `updated_at`
  - Uso previsto: reservar y cerrar consumo parcial o total.
- `sucursal_inventory`
  - Confirmado en: `supabase/migrations/20260528001442_cutover_branches_to_sucursales.sql`
  - Columnas relevantes: `tenant_id`, `sucursal_id`, `product_id`, `stock_current`, `created_at`, `updated_at`
  - Uso previsto: stock físico a descontar en T08.
- `inventory_movements`
  - Confirmado en: `supabase/migrations/20260424_baseline_schema.sql`, `supabase/migrations/20260527093000_migrate_branch_fks_to_sucursales.sql`
  - Columnas relevantes: `tenant_id`, `sucursal_id`, `product_id`, `service_order_id`, `purchase_order_id`, `movement_type`, `quantity`, `unit_cost`, `reference`, `notes`, `created_by`, `created_at`
  - Uso previsto: registrar consumo físico y su traza.
- `service_orders`
  - Confirmado en: `supabase/migrations/20260528001652_migrate_branch_fks_to_sucursales.sql`
  - Columnas relevantes: `sucursal_id`, `branch_id` compat, `tenant_id`, `folio`, `status`, `created_at`, `updated_at`
  - Uso previsto: ancla de consumo por orden.
- `products`
  - Confirmado en: `supabase/migrations/20260424_baseline_schema.sql`, `supabase/migrations/20260525012000_restore_inventory_purchase_products.sql`
  - Columnas relevantes: `tenant_id`, `sku`, `name`, `cost`, `minimum_stock`, `is_active`
  - Uso previsto: producto consumido y costo/valuación.
- `audit_logs`
  - Confirmado en: `supabase/migrations/20260530132000_security_backoffice_tables.sql`
  - Columnas relevantes: `tenant_id`, `user_id`, `action`, `data_after`, `created_at`
  - Uso previsto: auditoría de consumo.
- `users`
  - Confirmado en: `supabase/migrations/20260424_baseline_schema.sql`
  - Columnas relevantes: `tenant_id`, `branch_id`, `sucursal_id` compat, `auth_user_id`, `role`, `is_active`
  - Uso previsto: actor que consume.
- `tenants`
  - Confirmado en: `supabase/migrations/20260424_baseline_schema.sql`
  - Columnas relevantes: `id`, `slug`, `status`, `plan`, `created_at`, `updated_at`
  - Uso previsto: aislamiento de consumo.

## 7. Constraint de `inventory_movements.movement_type`

- Sí existe una columna `movement_type` en `inventory_movements`.
- El repositorio muestra movimientos ya usados con valores como `purchase_received`, `adjustment`, `transfer_out` y `transfer_in`.
- No hay evidencia en lo leído de un valor `consume` ya validado por constraint explícita en el mismo archivo T08; por eso debe confirmarse antes de usarlo.
- T08 podría necesitar un valor real existente o una extensión aditiva de constraint, pero no debe asumirse `consume` sin validarlo.
- Riesgo si se inventa un valor: la migración o la inserción RPC puede fallar por constraint o dejar el ledger incoherente.

## 8. Código Real Relacionado

- `apps/api/src/controllers/inventory-reservations.ts`
  - Funciones: `listInventoryReservations`, `createInventoryReservation`, `releaseInventoryReservation`
  - Importancia: contrato ya publicado que T08 debe leer y cerrar.
  - Candidato: referencia para consumo, no necesariamente modificar todavía.
- `apps/api/src/routes/inventory.ts`
  - Funciones: monta `/reservations`, `/transfer`, `/:id/movements`
  - Importancia: punto de entrada del inventario.
  - Candidato: probablemente modificable para exponer consumo, pero hoy solo referencia.
- `apps/api/src/controllers/catalogs.ts`
  - Funciones: `listInventory`, `updateInventoryItem`, `listInventoryMovements`, `transferInventoryItem`
  - Importancia: muestra el flujo vivo de stock e historial.
  - Candidato: referencia y posible integración.
- `apps/api/src/services/InventoryService.ts`
  - Función: `getInventoryMetrics`
  - Importancia: usa `sucursal_inventory` y puede depender de stock actualizado.
  - Candidato: referencia.
- `apps/api/src/controllers/purchase-orders.ts`
  - Función: `receivePurchaseOrder`
  - Importancia: usa RPC `receive_purchase_inventory` y el patrón transaccional.
  - Candidato: referencia de RPC.
- `apps/api/src/controllers/reports.ts`
  - Función: `getReportsSummary`
  - Importancia: consulta `inventory_movements`, `sucursal_inventory` y reporta top productos.
  - Candidato: referencia; puede verse afectado por nuevos tipos de movimiento.

## 9. Patrón RPC Requerido para T08

La RPC nueva de consumo debe:
- bloquear la reserva con `for update`;
- bloquear la fila de `sucursal_inventory` con `for update`;
- validar `tenant_id`;
- validar la sucursal de la orden;
- validar la cantidad restante de la reserva;
- validar stock físico suficiente;
- descontar `stock_current`;
- actualizar `consumed_quantity`;
- cambiar `status` a `consumed` o `partial`;
- insertar `inventory_movements`;
- insertar `audit_logs`;
- devolver JSON consolidado.

El patrón debe ser transaccional, idempotente y compatible con el contrato ya publicado por T07.

## 10. Riesgos Reales

- Stock negativo.
- Doble consumo.
- Consumo mayor a reserva.
- Consumo cross-tenant.
- Sucursal incorrecta.
- Movimiento con `movement_type` inválido.
- Auditoría incompleta.
- Concurrencia entre consumo y liberación.
- Interacción con reportes que agregan `inventory_movements`.
- Interacción futura con garantías/T09/T10 si consumos no quedan bien cerrados.
- Migraciones Supabase pendientes o desalineadas si se intenta inventar un valor nuevo en el ledger.

## 11. Preguntas para GPT-5.5

1. ¿T08 debe exponer un endpoint propio `POST /inventory/reservations/:id/consume` o reutilizar otro contrato?
2. ¿Qué valor exacto debe usar `inventory_movements.movement_type` para consumo?
3. ¿El consumo parcial debe dejar la reserva en `partial` o pasarla a `consumed` solo al completar la cantidad total?
4. ¿La RPC de consumo debe aceptar `quantity` explícita o consumir el remanente reservado?
5. ¿Se autoriza actualizar `inventory_reservations.consumed_by` y `consumed_at` en la misma operación?

## 12. Lo que GPT-5.5 Debe Devolver

- T08 WORKPACK cerrado.
- Archivos autorizados.
- SQL exacto de migración/RPC.
- Endpoint exacto.
- Contratos request/response.
- Regla exacta de `movement_type`.
- Reglas de autorización.
- Pasos para Codex Mini.
- Comandos de validación.
- Rollback.
- Criterios de aceptación.
