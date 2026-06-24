# T10 PACKET PARA GPT-5.5

## 1. Objetivo
T10 debe completar garantías como compromisos formales, claros y consultables.
Debe mantener la compatibilidad con `service_orders.warranty_until` y extender trazabilidad con reclamos si se autoriza.
No debe crear `devices` ni romper T09.
Debe aislar todo por `tenant_id` y preservar evidencias, eventos, finanzas e inventario.

## 2. Estado Git
- Rama actual: `main`.
- Estado antes de crear packet: limpio, `## main...origin/main`.
- Últimos 10 commits:
  - `312b8b5 feat(t09): add device history by serial`
  - `43d962e feat(t08): consume reserved inventory atomically`
  - `96e8835 feat(t07): add inventory reservations`
  - `266c362 docs: define T00 canonical foundations strategy`
  - `5912caf chore: add supabase cli dependency`
  - `6935a29 feat(t02): add consent and evidence visibility controls`
  - `343b0bb feat(t06): add order payment refunds`
  - `327c375 feat(t05): register order payments`
  - `0c7fef5 feat(t03): enforce configurable serial number`
  - `9afcada feat(t01): enforce legal intake checklist`
- Archivos creados por esta tarea: `docs/ai-packets/T10-packet.md`.

## 3. Dependencias previas
- T00 Fundaciones: obliga a usar mapeo `repair_orders` / `orders` -> `service_orders` y evitar renombres físicos.
- T03 Serial/IMEI configurable: `service_orders.serial_number` permite detectar historial y garantías por equipo.
- T09 historial clínico: expone `GET /orders/device-history` y agrupa por `tenant_id + lower(btrim(serial_number))`.
- T02 evidencias/documentos: `service_order_documents` y `service_order_events` son la fuente normalizada de evidencia/timeline.
- T07/T08 inventario: consumos quedan en `inventory_movements` con `movement_type = 'service_order_consumed'`.
- Modelo actual de órdenes: la garantía simple ya vive en `service_orders.warranty_until`.

## 4. Decisiones heredadas de T00/T09
- `devices` canónico existe como concepto, pero el repo usa campos inline en `service_orders`.
- El identificador práctico vigente es `service_orders.serial_number`.
- T10 no debe crear `devices` salvo decisión explícita, porque T00 prohíbe separar dispositivos y reescribir T09/T10 sin ticket dedicado.
- T10 debe apoyarse en T09 para consultar historial previo del equipo dentro del mismo tenant.
- El historial no debe cruzar tenants ni depender de sucursal como identidad del dispositivo.

## 5. Documentación revisada
- `AGENTS.md`
  - Decisión: mapeo oficial `repair_orders` -> `service_orders`, documentos -> `service_order_documents`, eventos -> `service_order_events`, auditoría -> `audit_logs`.
  - Impacto: T10 debe usar físico vivo actual.
- `docs/specs/decisions_t00_fundaciones_canonicas.md`
  - Decisión: compatibilidad progresiva, no destructiva; prohibido separar `devices` y reescribir T09/T10.
  - Impacto: no crear entidad dispositivo en T10.
- `docs/specs/spec_01_fundaciones.md`
  - Decisión: dispositivos viven en `repair_orders` / `service_orders`; `devices` es cambio futuro alto impacto.
  - Impacto: garantía debe relacionarse con orden y serial inline.
- `docs/specs/spec_02_recepcion_finanzas.md`
  - Decisión: evidencias nuevas viven en `service_order_documents`; timeline en `service_order_events`; T04 audita acciones críticas.
  - Impacto: garantía debe preservar documentos/eventos y auditoría.
- `docs/specs/spec_03_inventario_cliente.md`
  - Decisión: T10 canónico se asienta en `warranty_claims`; exige orden base entregada.
  - Impacto: evaluar tabla formal para reclamos.
- `docs/specs/implementation_order.md`
  - Decisión: T10 sigue a T09.
  - Impacto: no avanzar sin respetar historial por dispositivo.
- `docs/specs/dependencies.md`
  - Decisión: T10 depende de T03 y T09; desbloquea T12.
  - Impacto: serial e historial son base de garantía y portal futuro.
- `docs/specs/decisions_t09_t10.md`
  - Decisión: `service_orders.warranty_until` permanece; `warranty_claims` es necesaria para reclamos formales.
  - Impacto: opción más alineada es extender, no reemplazar.
- `docs/ai-packets/T09-packet.md`
  - Decisión: T09 no crea `devices`; usa `service_orders.serial_number`.
  - Impacto: T10 debe heredar esa identidad.
- `docs/implementation-results/T09-result.md`
  - Decisión: T09 agregó índice/RPC por serial normalizado y metadata segura.
  - Impacto: T10 puede consultar historial sin tocar frontend.

## 6. Modelo físico real encontrado
- `service_orders`
  - Confirmado en `supabase/migrations/20260424_baseline_schema.sql` y `20260514133525_remote_schema.sql`.
  - Columnas relevantes: `id`, `tenant_id`, `customer_id`, `folio`, `status`, `device_info`, `serial_number`, `problem_description`, `estimated_cost`, `final_cost`, `completed_at`, `delivered_at`, `created_at`, `warranty_until`, `evidence_metadata`.
  - Uso T10: orden origen, orden reclamo/reingreso, vigencia simple, serial para historial.
- `service_order_events`
  - Confirmado en `supabase/migrations/20260523190000_order_documents_events.sql`.
  - Columnas relevantes: `id`, `tenant_id`, `service_order_id`, `event_type`, `previous_status`, `new_status`, `note`, `actor_name`, `created_by`, `created_at`.
  - Uso T10: timeline de garantía, reclamo creado/resuelto.
- `service_order_documents`
  - Confirmado en `supabase/migrations/20260523190000_order_documents_events.sql` y T02.
  - Columnas relevantes: `id`, `tenant_id`, `service_order_id`, `file_name`, `file_type`, `mime_type`, `source`, `is_customer_visible`, `retention_expires_at`, `created_at`.
  - Uso T10: evidencias de garantía como metadata segura.
- `service_order_status_history`
  - Confirmado en `supabase/migrations/20260530193000_audit_hardening_multitenant.sql`.
  - Columnas relevantes: `id`, `tenant_id`, `service_order_id`, `previous_status`, `new_status`, `comment`, `changed_by`, `created_at`.
  - Uso T10: historial de transición si se reabre/crea reclamo.
- `inventory_reservations`
  - Confirmado en `supabase/migrations/20260624120000_t07_inventory_reservations.sql`.
  - Columnas relevantes: `tenant_id`, `service_order_id`, `product_id`, `reserved_quantity`, `consumed_quantity`, `released_quantity`, `status`.
  - Uso T10: referencia de reservas de orden si GPT-5.5 decide consultar piezas, no bloquear.
- `inventory_movements`
  - Confirmado en `supabase/migrations/20260424_baseline_schema.sql` y T08.
  - Columnas relevantes: `tenant_id`, `product_id`, `service_order_id`, `movement_type`, `quantity`, `unit_cost`, `reference`, `created_at`.
  - Uso T10: leer consumos de piezas ligados a la orden original.
- `customers`
  - Confirmado en `supabase/migrations/20260424_baseline_schema.sql`.
  - Columnas relevantes: `id`, `tenant_id`, `name`, `full_name`, `phone`, `email`.
  - Uso T10: contexto de cliente para garantía y portal futuro.
- `audit_logs`
  - Confirmado en `supabase/migrations/20260530132000_security_backoffice_tables.sql`, `20260531110000_fix_security_backoffice_schema.sql` y T07/T08.
  - Columnas relevantes: `tenant_id`, `user_id`, `action`, `request_id`, `data_before`, `data_after`, `created_at`.
  - Uso T10: auditoría de creación/resolución de reclamos.
- Tabla real de garantía
  - No se encontró tabla física `warranty_claims` en migraciones.
  - Solo existe `service_orders.warranty_until` como garantía simple.

## 7. Garantía existente en el repo
- Ruta existente: `apps/api/src/routes/orders.ts` monta `PATCH /:id/warranty` con `requireTenantModule('warranty')`.
- Controller existente: `apps/api/src/controllers/orders.ts` define `updateOrderWarranty`.
- Lógica actual: valida `warrantyUntil` o `warrantyDays`, actualiza `service_orders.warranty_until`, inserta `service_order_events` con `event_type = 'warranty_updated'` y agrega `evidence_metadata`.
- Columna actual: `service_orders.warranty_until`, agregada en `supabase/migrations/20260514133525_remote_schema.sql`.
- UI existente: `apps/web-admin/src/services/apiGateway.ts` tiene `updateOrderWarranty`; `apps/web-admin/src/types.ts` incluye `warranty_until`.
- Gaps actuales: no existe reclamo formal, no hay relación orden origen -> orden reclamo, no hay estado/resolución de claim, no hay unicidad por `claim_order_id`, no hay RLS específica para reclamos.

## 8. Relación con historial del dispositivo
- T10 debe consultar o reutilizar la lógica de T09 para ver órdenes previas del mismo serial.
- El serial ayuda a detectar garantías previas y posibles reclamos recurrentes dentro del tenant.
- Para evitar garantías duplicadas, una tabla de reclamos debe tener unicidad por `claim_order_id` si se crea.
- Riesgo: `serial_number` vacío impide historial confiable y no debe usarse como única prueba de garantía.
- Riesgo: serial duplicado entre clientes del mismo tenant requiere confirmar orden origen, no solo serial.

## 9. Relación con evidencias y documentos
- Una garantía debe poder referenciar evidencias/documentos de la orden original y de reclamo.
- `service_order_documents` ya soporta metadata segura y visibilidad cliente.
- No deben generarse signed URLs en endpoints internos de consulta salvo workpack explícito.
- Evidencias privadas deben permanecer privadas; `is_customer_visible` debe ser metadata o filtro según contrato.
- T02 dice que evidencia nueva vive en documentos/eventos, no solo en `evidence_metadata`.

## 10. Relación con inventario consumido
- T10 puede leer `inventory_movements` de T08 para saber piezas consumidas en la orden original.
- Una garantía puede necesitar referenciar pieza o servicio cubierto, pero eso no debe revertir inventario automáticamente.
- T10 no debe bloquear consumos ni modificar reservas salvo workpack explícito.
- Fuera de alcance: reversas de stock, consumo nuevo por garantía, impactos automáticos en caja o costos.

## 11. Opciones técnicas para T10

### Opción A — Garantía como campos en `service_orders`
- Ventajas: menor cambio; reutiliza `warranty_until`; compatible con UI actual.
- Riesgos: mezcla vigencia, reclamo y resolución en la orden; difícil reportar garantías.
- Archivos afectados: `orders.ts`, `routes/orders.ts`, quizá migración aditiva de columnas.
- Compatibilidad T00/T09: alta, pero incompleta para reclamos formales.

### Opción B — Tabla nueva `service_order_warranties`
- Ventajas: garantía explícita por orden; permite vigencia, estado, cobertura y relación con orden original.
- Riesgos: requiere migración, RLS, endpoints nuevos y contrato más preciso.
- Archivos afectados: migración nueva, `orders.ts`, `routes/orders.ts`, docs/bundle.
- Compatibilidad T00/T09: buena si usa `service_orders` y no crea `devices`; puede mapear al concepto canónico `warranty_claims`.

### Opción C — Garantía como evento/documento solamente
- Ventajas: mínimo cambio; usa `service_order_events` y `service_order_documents`.
- Riesgos: poca estructura para validación, reportes, vencimiento, reclamos y resolución.
- Archivos afectados: `orders.ts`, quizá ningún SQL nuevo.
- Compatibilidad T00/T09: parcial; no satisface bien `warranty_claims`.

## 12. Riesgos reales
- Garantía duplicada si no hay constraint sobre orden reclamo.
- Garantía sin orden origen si se permite crear reclamo sin `original_order_id`.
- Serial vacío o ambiguo puede enlazar historial equivocado.
- Orden de otro tenant si no se filtra `tenant_id` en original y claim.
- Garantía vencida mal calculada por timezone o por usar fecha actual en vez de entrega.
- Evidencia privada filtrada si se exponen URLs o documentos no visibles.
- Inventario consumido mal ligado si se asume cobertura por pieza sin relación explícita.
- Conflicto con T09 si se intenta crear `devices` o cambiar identidad del equipo.
- Conflicto con finanzas si garantía aprobada dispara cobro, reembolso o ajuste automático.
- Performance/reportes si no se indexan `tenant_id`, `original_order_id`, `claim_order_id` y estado.

## 13. Preguntas para GPT-5.5
1. ¿T10 debe crear tabla física `warranty_claims` o `service_order_warranties` como nombre físico compatible?
2. ¿La orden reclamo debe ser una nueva `service_orders` o puede reabrirse la original?
3. ¿Qué regla exacta define garantía vigente: `warranty_until`, `delivered_at + days`, o ambas?
4. ¿Qué roles pueden crear, aprobar, rechazar y editar reclamos de garantía?
5. ¿La garantía puede cubrir piezas específicas consumidas en T08 o solo la orden completa en esta fase?

## 14. Lo que GPT-5.5 debe devolver
- T10 WORKPACK cerrado.
- Decisión entre Opción A/B/C.
- Archivos autorizados.
- SQL exacto si hay migración.
- Endpoints exactos.
- Contrato request/response.
- Reglas de autorización.
- Reglas de privacidad.
- Reglas de vigencia de garantía.
- Pasos para Codex Mini.
- Comandos de validación.
- Rollback.
- Criterios de aceptación.
