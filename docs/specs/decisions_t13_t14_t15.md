# Decisions T13 / T14 / T15

Estado: decision tecnica oficial aterrizada contra repo real.  
Fecha: 2026-06-20.  
Alcance: T13 WhatsApp automatizado con cola y bitacora, T14 tiempos/productividad/comisiones, T15 reportes operativos confiables.

Este documento no implementa codigo, no reabre T04 y no modifica decisiones previas T01-T12.

## Evidencia Real Encontrada

### Documentacion y dependencias

- [docs/canonical/especificacion_aprobada.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/canonical/especificacion_aprobada.md) define que T13 debe evitar duplicados, registrar reintentos y dejar bitacora por mensaje.
- [docs/canonical/especificacion_aprobada.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/canonical/especificacion_aprobada.md) define que T14 debe registrar inicio, pausa, fin, responsable y posible comision por trabajo tecnico.
- [docs/canonical/especificacion_aprobada.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/canonical/especificacion_aprobada.md) define que T15 debe mostrar datos consistentes por periodo, sucursal, estado, tecnico, finanzas e inventario.
- [docs/specs/dependencies.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/specs/dependencies.md) mantiene T13 despues de consentimiento, autorizacion y portal; T14 antes de reportes completos; T15 despues de caja, inventario y tiempos.
- [docs/specs/implementation_order.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/specs/implementation_order.md) coloca T13, T14 y T15 despues de las bases legales, portal, caja e inventario.
- [docs/specs/spec_04_plataforma.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/specs/spec_04_plataforma.md) usa terminos canonicos como `repair_orders`, `payments`, `parts`, `stock_movements`, `timesheets` y `commissions`; en el repo real estos nombres no siempre existen fisicamente.
- [docs/specs/decisions_t11_t12.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/specs/decisions_t11_t12.md) congela que el portal seguro usa `service_orders.public_token` y que no debe haber lookup publico sensible por folio plano.
- [docs/specs/decisions_t07_t08.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/specs/decisions_t07_t08.md) congela que el inventario fisico vive en `sucursal_inventory.stock_current` y el ledger en `inventory_movements`.

### Tablas reales

- `service_orders` existe y es la orden fisica real. Incluye `tenant_id`, `sucursal_id`, `customer_id`, `folio`, `status`, `assigned_user_id`, `estimated_cost`, `final_cost`, `public_token`, fechas operativas y campos de dispositivo.
- `service_order_events` existe y es la fuente normalizada de eventos/timeline de orden.
- `service_order_documents` existe y es la fuente normalizada de documentos/evidencias de orden.
- `notification_events` existe desde el baseline con `tenant_id`, `channel`, `event_type`, `recipient`, `payload_json`, `status`, `sent_at`, `created_at`.
- `pwa_push_subscriptions` existe para notificaciones push internas, no para WhatsApp.
- `tasks` existe con `tenant_id`, `sucursal_id`, `service_order_id`, `service_request_id`, `title`, `description`, `status`, `priority`, `assigned_user_id`, `due_date`, `created_by`, `updated_by`, timestamps.
- `task_history` existe con `tenant_id`, `task_id`, `event_type`, `comment`, `changed_by`, `created_at`.
- `products`, `sucursal_inventory`, `inventory_movements`, `stock_alerts`, `purchase_orders` y `purchase_order_items` existen para inventario.
- `finances` existe y se usa para gastos/resumen financiero actual. Tambien existen `customer_payments` y `expenses` en migraciones, pero el reporte actual consulta `finances`.
- No existe tabla fisica `message_queue`, `message_logs`, `work_logs`, `timesheets` ni reglas fisicas de comisiones tecnicas para reparaciones.
- No existen RPCs analiticos para reportes T15.

### Rutas y controladores reales

- [apps/api/src/index.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/index.ts) monta rutas con patron `/api/:tenantSlug/...` y fallback `/api/...`. No existe convencion de rutas API versionadas.
- [apps/api/src/routes/orders.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/orders.ts) expone ordenes bajo `/orders`, incluyendo `PATCH /:id/status`, `POST /:id/notes`, `POST /:id/messages`, `PATCH /:id/financials`, checklist y attachments.
- [apps/api/src/controllers/orders.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/orders.ts) escribe `service_order_events`, usa `service_orders.evidence_metadata` como puente legacy y dispara `sendTenantPushNotification` en eventos de orden.
- [apps/api/src/routes/tasks.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/tasks.ts) expone `GET /tasks`, `POST /tasks`, `GET /tasks/:id`, `PUT /tasks/:id`, `PATCH /tasks/:id/status`, `GET /tasks/:id/history`, `DELETE /tasks/:id`.
- [apps/api/src/controllers/tasks.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/tasks.ts) implementa gestion de tareas y `task_history`, pero no mide horas ni calcula comisiones.
- [apps/api/src/routes/reports.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/reports.ts) expone `GET /reports/summary` solo para `owner` y `manager`, con modulo `reports` activo.
- [apps/api/src/controllers/reports.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/reports.ts) consulta `service_orders`, `customers`, `sucursal_inventory`, `finances`, `service_requests`, `users` e `inventory_movements` y agrega en memoria.
- [apps/api/src/routes/pwa.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/pwa.ts) expone push PWA, no WhatsApp.
- No existen rutas ni controladores reales de WhatsApp automatizado.

### Servicios, capabilities y frontend real

- [apps/api/src/services/tenant-capabilities.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/services/tenant-capabilities.ts) registra modulo `whatsapp` como modulo publico y limites de `whatsapp_templates` por plan.
- [apps/api/src/services/tenant-config.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/services/tenant-config.ts) contiene plantillas `whatsapp` y reglas de semaforo con acciones como reenviar cotizacion por WhatsApp.
- [apps/api/src/services/pwa-push.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/services/pwa-push.ts) envia push interno y escribe `notification_events` con `channel = 'push'`.
- [apps/api/src/services/audit.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/services/audit.ts) existe como servicio central de auditoria T04. T04 permanece cerrado.
- No existe proveedor externo WhatsApp configurado como decision definitiva.
- No existe worker/cron/dispatcher real de mensajeria WhatsApp.
- [apps/web-admin/src/components/dashboard/orders/order-intake-modal.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-intake-modal.tsx), [apps/web-admin/src/components/operativo/success.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/operativo/success.tsx), [apps/web-admin/src/components/dashboard/orders/order-detail-drawer.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-detail-drawer.tsx) y [apps/web-admin/src/components/solicitudes/quote-modal.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/solicitudes/quote-modal.tsx) generan links manuales de WhatsApp.
- [apps/web-admin/src/app/dashboard/tareas/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/tareas/page.tsx) consume tareas actuales; no muestra cronometro ni comisiones.
- [apps/web-admin/src/app/dashboard/reportes/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/reportes/page.tsx) consume `reportsService.getReportsSummary()` y espera la forma actual de respuesta.
- [apps/web-admin/src/services/apiGateway.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/services/apiGateway.ts) llama `this.apiPath('/reports/summary')` y normaliza respuesta camel/snake case.

### Riesgos reales encontrados

- T13 no puede considerarse implementable como envio real hasta elegir proveedor y canal de dispatch; el repo solo tiene plantillas, links manuales, capabilities y push interno.
- T13 no debe enviar links por folio. Todo mensaje hacia cliente debe usar `service_orders.public_token`, conforme T11/T12.
- T14 no puede usar `task_history` como fuente de horas porque `task_history` describe cambios de tarea, no intervalos laborales.
- T15 presenta riesgo de datos falsos: `reports.ts` limita a 500 filas en varias tablas y a 1000 movimientos de inventario antes de agregar en memoria.
- T15 calcula balance con `service_orders.final_cost` y `finances.expense`; cuando T05/T06 consoliden dinero, el origen financiero del reporte debe alinearse a la fuente unica definida por esos tickets.

## Mapa Dominio A Fisico

| Dominio | Fisico actual | Estrategia |
| --- | --- | --- |
| `repair_orders` | `service_orders` | Mantener como tabla viva de ordenes. |
| `repair_order_events` | `service_order_events` | Usar para timeline y eventos de orden. |
| `repair_order_documents` | `service_order_documents` | Usar para documentos/evidencias visibles segun T02/T12. |
| portal publico | `service_orders.public_token` | Usar como unico valor seguro en enlaces cliente. |
| mensajes WhatsApp | No existe tabla dedicada; links manuales + plantillas en tenant config | Crear cola/bitacora nueva para automatizacion. |
| bitacora push interna | `notification_events` | Mantener para PWA push; no mezclar con cola transaccional WhatsApp. |
| tareas operativas | `tasks` | Mantener para gestion de tareas. No usar como timesheet. |
| historial de tarea | `task_history` | Mantener como bitacora de cambios de tarea. No usar como medicion de horas. |
| tiempos tecnicos / `timesheets` | No existe | Crear `work_logs` como fuente fisica de tiempos. |
| comisiones tecnicas | No existe | Crear reglas y snapshot de comision asociado al cierre de trabajo. |
| productos / refacciones | `products` | Mantener como catalogo fisico real. |
| inventario por sucursal | `sucursal_inventory` | Mantener `stock_current` como stock fisico. |
| movimientos inventario / `stock_movements` | `inventory_movements` | Mantener como ledger de movimientos. |
| finanzas visibles en reporte actual | `finances` + `service_orders.final_cost` | Mantener temporalmente; T15 debe quedar preparado para fuente financiera consolidada T05/T06. |
| reportes | `apps/api/src/controllers/reports.ts` | Mantener contrato HTTP, mover agregaciones a consultas agregadas/RPC. |

---

# T13 Decision Tecnica Final

## EXISTE EN REPO

- Modulo `whatsapp` en capabilities de tenant.
- Limites de `whatsapp_templates` por plan.
- Plantillas WhatsApp en configuracion de tenant.
- Acciones de semaforo que sugieren reenviar por WhatsApp.
- Links manuales de WhatsApp en recepcion, detalle de orden y cotizacion.
- `notification_events` para bitacora simple de push interno.
- Servicio PWA push interno que escribe `notification_events`.
- `service_orders.public_token` para portal seguro.
- `service_order_events` para eventos de orden.
- Auditoria central T04 disponible.
- No existe cola WhatsApp, worker/dispatcher, controlador/rutas WhatsApp, proveedor definitivo, bitacora por intento ni estado idempotente por evento origen.

## CAMBIO DE ESQUEMA PROPUESTO

Crear `message_queue` como fuente primaria de verdad para mensajes automatizados de WhatsApp. La tabla cumple doble funcion: cola operativa y bitacora auditable de estado.

Campos propuestos:

- `id`, `tenant_id`, `sucursal_id`, `service_order_id`, `service_order_event_id`, `customer_id`.
- `channel`: `whatsapp` para T13.
- `recipient_phone`: telefono normalizado.
- `template_key`, `template_version`, `template_payload`.
- `portal_public_token`: token publico usado para link cliente; nunca folio plano como secreto.
- `idempotency_key`: llave deterministica por tenant, evento origen, canal, destinatario y plantilla.
- `status`: `pending`, `processing`, `sent`, `failed`, `cancelled`.
- `attempts`, `max_attempts`, `next_attempt_at`, `locked_at`, `locked_by`.
- `provider_key`, `provider_message_id`, `last_error`.
- `created_by`, `created_at`, `updated_at`, `sent_at`, `cancelled_at`.

Restricciones e indices propuestos:

- Indice unico por `(tenant_id, idempotency_key)`.
- Indice para drenado por `(status, next_attempt_at, created_at)` filtrado a `pending`.
- Indice por `(tenant_id, service_order_id, created_at desc)` para bitacora por orden.
- Check constraints para `channel`, `status`, `attempts >= 0` y `max_attempts >= 1`.
- RLS obligatoria por `tenant_id`.
- Escritura desde backend con contexto de tenant; lectura por owner/manager y usuarios con acceso a la orden.

No se propone `message_logs` separado para el MVP de T13. Si mas adelante se requiere auditoria por cada intento individual con payload externo, se agregara tabla de intentos sin cambiar `message_queue` como fuente primaria del mensaje.

## DECISION TECNICA FINAL

- La fuente de verdad para mensajes WhatsApp automatizados sera `message_queue`.
- `notification_events` se mantiene para push interno existente y no sustituye `message_queue`.
- Las plantillas siguen viniendo de configuracion de tenant, no de codigo hardcodeado.
- El proveedor WhatsApp queda como decision pendiente de integracion, no como decision de producto.
- El esquema debe soportar cualquier proveedor mediante `provider_key` y `provider_message_id`.
- No se debe asumir ningun proveedor externo como definitivo en T13.
- La operacion de usuario que cambia estado de orden no debe esperar al proveedor externo.
- El backend debe encolar mensaje idempotente en `message_queue`.
- El proceso de dispatch debe tomar filas `pending`, marcarlas `processing`, llamar al proveedor configurado y persistir `sent` o `failed`.
- La infraestructura concreta del dispatcher queda pendiente: worker de backend, cron externo o proceso administrado. T13 no queda cerrado sin dispatcher real en produccion.
- No se deben documentar ni implementar rutas API versionadas inexistentes. La convencion real es `/api/:tenantSlug/...` y `/api/...`.

Rutas finales propuestas bajo la convencion real:

- `GET /api/:tenantSlug/orders/:id/messages`: listar bitacora de mensajes de una orden.
- `POST /api/:tenantSlug/orders/:id/messages`: encolar mensaje manual controlado desde orden.
- `POST /api/:tenantSlug/notifications/dispatch`: drenar mensajes pendientes, protegido para uso interno/admin.
- Fallback sin tenant slug solo si se conserva compatibilidad actual del router.

Reglas finales:

- Todo link enviado al cliente debe incluir `service_orders.public_token`, nunca depender de folio plano para datos sensibles.
- El `folio` puede aparecer solo como texto informativo, no como credencial de acceso.
- La llave idempotente debe derivarse de `tenant_id`, `service_order_event_id` o evento equivalente, `channel`, `recipient_phone` y `template_key`.
- Reintentar una fila fallida no debe crear otra fila de mensaje.
- Errores permanentes como telefono invalido terminan en `failed`; errores temporales programan `next_attempt_at`.
- Antes de encolar WhatsApp debe validarse consentimiento aplicable definido por T02.
- Los mensajes no deben incluir notas internas, diagnosticos privados ni URLs enumerables.
- Encolar mensaje manual y reenvio manual deben generar auditoria central con `request_id`.
- Cambios de estado de mensaje por dispatcher pueden auditarse best-effort si no afectan dinero, rol, seguridad o estado critico de orden.

Permisos:

- Owner y manager pueden ver bitacora de mensajes y reintentar si el modulo esta activo.
- Recepcionista/tecnico solo pueden disparar mensajes permitidos desde ordenes a las que tienen acceso.
- El dispatcher interno no debe usar permisos de usuario final.
- Todo acceso debe validar `tenant_id` y scope de sucursal cuando exista.

Archivos exactos a modificar cuando se implemente:

- `supabase/migrations/*_create_message_queue.sql`
- `apps/api/src/controllers/orders.ts`
- `apps/api/src/routes/orders.ts`
- `apps/api/src/controllers/notifications.ts` nuevo.
- `apps/api/src/routes/notifications.ts` nuevo.
- `apps/api/src/services/notifications.ts` nuevo.
- `apps/api/src/services/tenant-config.ts`
- `apps/api/src/services/tenant-capabilities.ts` solo si se refuerzan limites de plantillas/envios.
- `apps/api/src/index.ts`
- `apps/web-admin/src/services/apiGateway.ts`
- `apps/web-admin/src/components/dashboard/orders/order-detail-drawer.tsx`
- `apps/web-admin/src/types.ts`
- `packages/types/index.ts`

Pruebas requeridas:

- Encolar mensaje con tenant valido crea una sola fila por idempotency key.
- Repetir el mismo evento no duplica mensaje.
- Tenant A no puede ver mensajes de tenant B.
- Usuario sin permiso no puede listar ni reintentar mensajes.
- Orden sin consentimiento aplicable no encola WhatsApp.
- Mensaje generado desde orden usa `public_token` y no folio como credencial.
- Dispatcher marca `sent` con `provider_message_id` en exito.
- Dispatcher marca `failed` y programa `next_attempt_at` en fallo temporal.
- Telefono invalido queda bloqueado como fallo permanente.
- Auditoria se genera en reenvio/manual enqueue.

Rollback:

- Desactivar modulo `whatsapp` o bandera de automatizacion para detener nuevos encolados.
- Mantener links manuales actuales como fallback operativo.
- No borrar `message_queue`; conservar bitacora historica.
- Si el dispatcher falla, pausar proceso y dejar filas `pending`/`failed` para reintento controlado.
- Revertir rutas nuevas sin afectar ordenes, portal ni push PWA existente.

Definition of Done:

- Existe cola/bitacora persistente con RLS por tenant.
- Hay encolado idempotente desde eventos de orden configurados.
- Hay dispatcher real de produccion conectado a proveedor configurado.
- Hay bitacora visible por orden.
- No se duplican mensajes por el mismo evento.
- Los mensajes cliente usan `public_token`.
- Se respeta consentimiento.
- Permisos y scope tenant/sucursal estan validados.
- Reintentos quedan trazados.
- Auditoria central cubre acciones manuales/reenvios.
- Pruebas de idempotencia, permisos y fallo de proveedor pasan contra entorno real.

---

# T14 Decision Tecnica Final

## EXISTE EN REPO

- `tasks` para seguimiento interno.
- `task_history` para historial de cambios de tarea.
- Rutas reales de tareas bajo `/api/:tenantSlug/tasks` y `/api/tasks`.
- Estados actuales de tarea: `pendiente`, `en_proceso`, `bloqueada`, `hecha`.
- Tareas pueden vincularse a `service_orders` o `service_requests`.
- Tareas pueden asignarse a `assigned_user_id`.
- `service_orders.assigned_user_id` existe para responsable de orden.
- Reportes actuales cuentan ordenes por tecnico usando `assigned_user_id`.
- No existe cronometro por tecnico, pausas laborales reales, `work_logs`, `timesheets`, reglas de comision por reparacion, snapshot de comision ni reporte confiable de horas trabajadas.

## CAMBIO DE ESQUEMA PROPUESTO

Crear `work_logs` como fuente fisica de tiempos tecnicos. El termino canonico `timesheets` se materializa en el repo como `work_logs` para alinearse con el borrador de Gemini y evitar confundirlo con `task_history`.

Campos propuestos para `work_logs`:

- `id`, `tenant_id`, `sucursal_id`, `service_order_id`, `task_id`, `technician_id`.
- `started_at`, `ended_at`, `paused_minutes`, `total_minutes`.
- `status`: `running`, `paused`, `completed`, `cancelled`.
- `pause_reason`, `notes`.
- `commission_rule_id`, `commission_rule_snapshot`, `commission_earned`, `commission_status`.
- `idempotency_key`, `created_by`, `updated_by`, `created_at`, `updated_at`.

Crear `technician_commission_rules`:

- `id`, `tenant_id`, `technician_id`, `sucursal_id`.
- `rule_type`: `fixed`, `percentage`, `per_minute`.
- `base_amount`, `percentage`, `applies_to`, `min_minutes`, `max_minutes`.
- `effective_from`, `effective_until`, `is_active`.
- `created_by`, `created_at`, `updated_at`.

Restricciones e indices propuestos:

- RLS por `tenant_id` en ambas tablas.
- Indices `work_logs(tenant_id, service_order_id, started_at desc)`, `work_logs(tenant_id, technician_id, started_at desc)`, `work_logs(tenant_id, sucursal_id, started_at desc)`.
- Constraint `ended_at > started_at` cuando `ended_at` no sea nulo.
- Constraint de status permitidos.
- Partial unique para impedir mas de un `work_logs` activo por `(tenant_id, technician_id, service_order_id)`.
- Indice de reglas activas por `(tenant_id, technician_id, sucursal_id, is_active)`.

## DECISION TECNICA FINAL

- `tasks` sigue siendo gestion de pendientes.
- `task_history` sigue siendo bitacora de cambios de tarea.
- `work_logs` sera la unica fuente de verdad para tiempos reales.
- Las comisiones se calculan al cierre del `work_log` usando una regla vigente y guardando snapshot.
- Un trabajo inicia cuando un tecnico crea un `work_log` `running` sobre una orden.
- Un trabajo termina cuando se cierra el `work_log` con `ended_at` y `status = completed`.
- `total_minutes` se calcula como minutos entre `started_at` y `ended_at`, menos pausas si el flujo de pausa queda dentro de T14.
- Los logs `running` no cuentan como tiempo cerrado para comisiones, solo para visibilidad operativa.
- Si el tecnico olvida cerrar, owner/manager puede cerrar con motivo, dejando auditoria.
- La especificacion canonica exige pausas como parte del estado final. Decision MVP: soportar pausa acumulada mediante `paused_minutes` y `pause_reason` si pausa entra en primera version.
- Si se requieren multiples pausas auditables, se debe crear tabla hija `work_log_segments` antes de vender comisiones avanzadas.
- No se comisiona sin regla activa.
- El resultado se guarda en `commission_earned` y `commission_rule_snapshot` para que cambios futuros de reglas no alteren historico.
- La comision queda `pending` hasta aprobacion owner/manager si el negocio requiere validacion.
- Trabajos cancelados o garantia/retrabajo no generan comision salvo regla explicita.

Fuera de alcance:

- Nomina legal.
- Dispersion de pagos.
- Contratos laborales.
- Geolocalizacion o monitoreo invasivo.
- Calculo automatico de rentabilidad si T05/T06 no consolidan fuente financiera.
- Comisiones sobre refacciones hasta que T07/T08 cierren consumo confiable.

Rutas finales propuestas bajo la convencion real:

- `POST /api/:tenantSlug/orders/:id/work-logs/start`
- `POST /api/:tenantSlug/orders/:id/work-logs/stop`
- `POST /api/:tenantSlug/orders/:id/work-logs/pause` si pausa entra en MVP.
- `POST /api/:tenantSlug/orders/:id/work-logs/resume` si pausa entra en MVP.
- `GET /api/:tenantSlug/orders/:id/work-logs`
- `GET /api/:tenantSlug/reports/technicians` cuando T15 lo incorpore.
- Fallback sin tenant slug solo si se conserva compatibilidad actual.

Permisos:

- Tecnico puede iniciar/pausar/reanudar/cerrar sus propios `work_logs` en ordenes a las que tiene acceso.
- Owner/manager puede ver, corregir y cerrar logs con motivo auditado.
- Owner define reglas de comision.
- Manager puede consultar productividad y aprobar comisiones si el tenant lo permite.
- Todo acceso respeta `tenant_id` y scope de sucursal.

Auditoria T04:

- Crear/cerrar/corregir `work_logs` debe auditarse porque afecta productividad y posible compensacion.
- Crear/modificar/desactivar reglas de comision debe ser auditoria critica y fail-closed.
- Aprobacion/anulacion de comision debe ser auditoria critica y fail-closed.
- Start/stop operativo puede ser critico cuando genera comision; si no genera dinero puede ser best-effort, pero debe quedar trazado en `work_logs`.

Frontend:

- Tecnico: controles de iniciar, pausar, reanudar y terminar trabajo desde orden asignada.
- Admin/owner: vista de productividad por tecnico, orden, sucursal y periodo.
- Owner: configuracion de reglas de comision.
- Drawer de orden: lista de logs de trabajo y comision calculada cuando aplique.
- Pagina de tareas: no se convierte en cronometro; puede enlazar tarea con `work_log` si aplica.

Archivos exactos a modificar cuando se implemente:

- `supabase/migrations/*_create_work_logs_commission_rules.sql`
- `apps/api/src/controllers/orders.ts`
- `apps/api/src/routes/orders.ts`
- `apps/api/src/controllers/tasks.ts` solo si se enlazan tareas existentes con work logs.
- `apps/api/src/routes/tasks.ts` solo si se expone relacion tarea-log.
- `apps/api/src/controllers/reports.ts`
- `apps/api/src/routes/reports.ts`
- `apps/api/src/services/audit.ts` solo para reutilizar contexto, sin modificar T04.
- `apps/web-admin/src/components/tecnico/order-modal.tsx`
- `apps/web-admin/src/app/dashboard/tecnico/page.tsx`
- `apps/web-admin/src/app/dashboard/tareas/page.tsx` solo para enlaces, no para reemplazar tareas.
- `apps/web-admin/src/app/dashboard/reportes/page.tsx`
- `apps/web-admin/src/services/apiGateway.ts`
- `apps/web-admin/src/types.ts`
- `packages/types/index.ts`

Pruebas requeridas:

- Tecnico inicia trabajo en orden de su tenant.
- Tecnico no puede iniciar trabajo en orden de otro tenant.
- Tecnico no puede tener dos logs activos duplicados para la misma orden.
- Owner/manager cierra log olvidado con motivo y auditoria.
- `ended_at` anterior a `started_at` se rechaza.
- Comision no se calcula si no hay regla activa.
- Comision se calcula con snapshot de regla vigente al cierre.
- Cambiar regla despues del cierre no cambia comision historica.
- Scope de sucursal impide ver/cambiar logs de otra sucursal.
- Reporte tecnico suma solo logs cerrados y respeta periodo.

Rollback:

- Ocultar controles de tiempos/comisiones en frontend.
- Desactivar endpoints de work logs por feature/module guard si se requiere.
- Conservar `work_logs` y reglas como historico; no borrar datos.
- Volver temporalmente a productividad por `service_orders.assigned_user_id` en reportes, marcandola como conteo de ordenes y no horas.
- No convertir `task_history` en fallback de horas.

Definition of Done:

- `work_logs` existe como fuente unica de tiempos.
- Tareas siguen funcionando sin regresion.
- Tecnico puede iniciar, pausar si aplica, reanudar si aplica y terminar trabajo.
- Owner/manager puede corregir logs con auditoria.
- Reglas de comision existen y se versionan por snapshot.
- Comisiones se calculan solo al cierre y no cambian historicamente.
- Permisos tenant/sucursal/rol estan validados.
- Reportes tecnicos usan `work_logs`, no `task_history`.
- Pruebas de permisos, tiempo coherente, comision y auditoria pasan.

---

# T15 Decision Tecnica Final

## EXISTE EN REPO

- `GET /api/:tenantSlug/reports/summary` y `GET /api/reports/summary` existen.
- El endpoint requiere auth, tenant valido, billing activo, modulo `reports` y rol `owner` o `manager`.
- El controlador consulta `service_orders`, `customers`, `sucursal_inventory`, `finances`, `service_requests`, `users` e `inventory_movements`.
- El endpoint calcula `ordersCount`, `customersCount`, `inventoryCount`, `lowStockCount`, `totalIncome`, `totalExpense`, `totalBalance`, `productivity`, `inventoryValuation`, `accountsReceivable`, `ordersByTechnician`, `ordersBySucursal`, `statusCounts`, `statusCountsToday`, `statusCountsWeek`, `topProductsUsed`, `overduePromisedOrders`, `lastUpdatedAt`.
- El frontend `reportes/page.tsx` consume la forma actual.
- `apiGateway.normalizeReportsSummary` ya acepta camelCase y snake_case.
- Riesgo confirmado: `service_orders`, `customers`, `sucursal_inventory`, `finances`, `service_requests` y `users` usan `.limit(500)` antes de agregar.
- Riesgo confirmado: `inventory_movements` usa `.limit(1000)` antes de agregar.
- No existe RPC analitico de resumen, vista/materializacion analitica, metricas server-side sin limite destructivo, reporte tecnico basado en `work_logs` ni validacion de periodo configurable en `/reports/summary`.

## CAMBIO DE ESQUEMA PROPUESTO

Crear funciones SQL/RPC o vistas agregadas para reportes, ejecutadas desde backend, que agreguen en el motor de datos y no en memoria con limites arbitrarios.

Funciones propuestas:

- `get_reports_summary(p_tenant_id uuid, p_sucursal_id uuid default null, p_date_from date default null, p_date_to date default null)`: resumen operativo compatible con la forma actual de `/reports/summary`.
- `get_reports_finance(p_tenant_id uuid, p_sucursal_id uuid default null, p_date_from date, p_date_to date)`: resumen financiero cuando T05/T06 consoliden fuente unica de caja.
- `get_reports_inventory(p_tenant_id uuid, p_sucursal_id uuid default null)`: stock, valuacion, bajo minimo y top productos usados.
- `get_reports_technicians(p_tenant_id uuid, p_sucursal_id uuid default null, p_date_from date, p_date_to date)`: productividad por tecnico basada en `work_logs` cuando T14 exista.

Requisitos de seguridad:

- Parametrizar siempre `tenant_id`.
- Validar `sucursal_id` contra tenant antes de usarlo.
- No exponer funciones publicas a anon.
- Si se usan funciones con privilegios elevados, fijar `search_path` y restringir `EXECUTE` a rol de backend/controlado.
- Mantener RLS en tablas base.

Indices propuestos:

- `service_orders(tenant_id, created_at)`.
- `service_orders(tenant_id, sucursal_id, created_at)`.
- `service_orders(tenant_id, status, created_at)`.
- `service_orders(tenant_id, assigned_user_id, created_at)`.
- `customers(tenant_id, sucursal_id, created_at)`.
- `finances(tenant_id, sucursal_id, created_at)` mientras siga siendo fuente actual.
- `service_requests(tenant_id, created_at)`.
- Validar cobertura de `sucursal_inventory(tenant_id, sucursal_id, product_id)`.
- `inventory_movements(tenant_id, sucursal_id, created_at)`.
- `inventory_movements(tenant_id, service_order_id, created_at)`.
- `work_logs(tenant_id, technician_id, started_at)` cuando T14 exista.

## DECISION TECNICA FINAL

Fuente de verdad por metrica:

- Ordenes por estado: `service_orders`.
- Clientes: `customers`.
- Inventario: `sucursal_inventory.stock_current` con costos de `products`.
- Movimientos/top productos: `inventory_movements`.
- Cuentas por cobrar actuales: `service_requests.balance_amount` mientras T05/T06 no consoliden fuente unica.
- Balance actual: compatibilidad con `service_orders.final_cost` y `finances.expense`, pero debe migrar a la fuente financiera consolidada cuando T05/T06 esten cerrados.
- Productividad actual: conteo de ordenes por `service_orders.assigned_user_id`.
- Productividad final: tiempos cerrados en `work_logs` cuando T14 este implementado.

Debe moverse a agregacion en motor de datos:

- Conteo total de ordenes, clientes e inventario.
- Bajo stock.
- Ingresos, egresos y balance.
- Productividad.
- Valuacion de inventario.
- Cuentas por cobrar.
- Conteos por estado total, hoy y semana.
- Ordenes por tecnico.
- Ordenes por sucursal.
- Top productos usados.
- Ordenes vencidas por `promised_date`.

Puede quedarse temporalmente en backend:

- Normalizacion de nombres de campos camelCase/snake_case.
- Formateo de payload final para mantener compatibilidad frontend.
- Validacion de query params y permisos.
- Union de etiquetas pequeñas si la consulta agregada devuelve ids.

No debe quedarse en backend:

- Sumar totales despues de `limit(500)`.
- Calcular balances desde subconjuntos.
- Calcular top productos desde `limit(1000)`.

Estrategia de transicion:

- Mantener el contrato actual de `GET /reports/summary` para no romper dashboard.
- Cambiar internamente la fuente del controlador a funcion agregada/RPC.
- Conservar `apiGateway.normalizeReportsSummary` porque ya soporta camelCase/snake_case.
- Durante validacion, comparar resultados de RPC contra datos base en tenants controlados.
- El camino viejo con agregaciones en memoria no debe quedar activo en produccion para tenants reales porque genera datos falsos.
- Si se necesita rollback, debe ser por bandera temporal y solo para tenants de bajo volumen o modo diagnostico, nunca como resultado definitivo para owners.

Periodos y filtros:

- El endpoint actual no expone periodo configurable; T15 debe definirlo antes de cierre final.
- Filtros obligatorios: tenant, sucursal si aplica, fecha inicio, fecha fin.
- Fecha inicio no puede ser posterior a fecha fin.
- Manager con scope de sucursal solo ve su sucursal.
- Owner puede ver tenant completo o filtrar por sucursal.

Auditoria T04:

- Lectura simple de dashboard no requiere auditoria critica.
- Exportaciones, reportes financieros descargables o vistas sensibles de dinero pueden generar auditoria best-effort o critica segun alcance T20/T05/T06.
- T15 no modifica reglas de T04.

Archivos exactos a modificar cuando se implemente:

- `supabase/migrations/*_create_reports_summary_rpc.sql`
- `supabase/migrations/*_add_reports_indexes.sql`
- `apps/api/src/controllers/reports.ts`
- `apps/api/src/routes/reports.ts` si se agregan endpoints nuevos.
- `apps/web-admin/src/app/dashboard/reportes/page.tsx`
- `apps/web-admin/src/services/reports/reportsService.ts`
- `apps/web-admin/src/services/apiGateway.ts`
- `apps/web-admin/src/types.ts`
- `packages/types/index.ts`

Pruebas requeridas:

- Tenant con mas de 500 ordenes devuelve conteo completo.
- Tenant con mas de 1000 movimientos devuelve top productos correcto.
- Manager de sucursal ve solo datos de su sucursal.
- Owner ve datos de todo tenant.
- Tenant A no ve datos de tenant B.
- Balance del reporte coincide con fuente financiera definida para el estado actual del producto.
- Bajo stock coincide con `sucursal_inventory.stock_current` y minimo del producto.
- Valuacion de inventario coincide con `stock_current * products.cost`.
- Ordenes por tecnico coinciden con `assigned_user_id` antes de T14 y con `work_logs` cuando T14 este activo.
- Periodos invalidos devuelven error validado.
- Performance aceptable con volumen mayor a 1,000 talleres y miles de ordenes mensuales por cohortes de tenant.

Rollback:

- Mantener forma de respuesta actual para poder revertir solo fuente de datos interna.
- Si una funcion agregada falla, devolver error claro en vez de mostrar datos parciales.
- No reactivar agregacion con `.limit(500)` como fallback silencioso para produccion.
- Las migraciones de indices son seguras de conservar.
- Las funciones/RPC pueden quedar desplegadas aunque el controlador revierta temporalmente.

Definition of Done:

- `/reports/summary` no usa limites destructivos para calcular metricas.
- Todas las metricas agregadas se calculan en motor de datos o vista agregada confiable.
- El contrato frontend actual sigue funcionando.
- Los filtros de tenant, sucursal y periodo son obligatorios/validados segun rol.
- Reportes no mezclan tenants ni sucursales fuera de scope.
- Finanzas, inventario y productividad usan la fuente de verdad vigente.
- Pruebas con volumen superior a los limites actuales pasan.
- Errores no muestran datos parciales como definitivos.

---

## Bloqueantes Reales

- T13: falta decision operativa de proveedor WhatsApp y mecanismo real de dispatch. El esquema puede implementarse antes, pero T13 no queda cerrado sin proveedor configurado y dispatcher productivo.
- T13: requiere que T02/T12 esten aplicados para consentimiento y links seguros por `public_token` antes de automatizar mensajes a clientes.
- T14: falta definir si pausa multiple es requerida en MVP. Si se exige pausa completa con multiples segmentos, `work_logs` solo no basta y debe agregarse tabla hija antes de cerrar T14.
- T14: comisiones reales dependen de reglas de negocio del tenant; sin reglas activas solo puede reportar tiempos, no comisiones.
- T15: el reporte actual no es confiable en alto volumen por `.limit(500)` y `.limit(1000)`; debe corregirse antes de considerar T15 productivo.
- T15: metricas financieras finales dependen de la fuente unica de caja definida por T05/T06.
- T15: metricas tecnicas finales dependen de `work_logs` de T14.

## Veredicto

LISTO PARA IMPLEMENTAR T13/T14/T15.

La implementacion puede iniciar con estas decisiones, respetando que T13 no se cierra sin proveedor/dispatcher real, T14 no cierra comisiones sin reglas auditadas, y T15 no cierra reportes productivos mientras existan agregaciones con limites destructivos.
