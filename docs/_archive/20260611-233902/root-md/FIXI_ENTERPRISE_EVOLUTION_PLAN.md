# Fixi Enterprise Evolution Plan

## Objetivo

Convertir el sistema actual en una plataforma dirigida por:

- `Event Store`
- `Workflow Engine`
- `Rules Engine`

sin reemplazar módulos existentes y con el menor riesgo posible.

## No-goals

- No reescribir órdenes, inventario, compras, finanzas ni portal.
- No sustituir `service_orders.status` como contrato actual.
- No introducir Camunda, ERPNext, Mayan o Zammad dentro del producto.
- No romper flujos productivos existentes.

## Principio de evolución

El repos actual ya tiene módulos funcionales. La evolución debe convertirlos en consumidores de una capa común de reglas, eventos y proyecciones.

La dirección es:

`Command -> Rule Engine -> Event Store -> Projections -> UI`

## 1. Mapeo ACTUAL -> OBJETIVO

### 1.1 Entidades que ya existen

| Dominio | Entidad actual | Estado |
|---|---|---|
| Órdenes | `service_orders` | Fuente de verdad actual |
| Solicitudes | `service_requests` | Fuente de entrada para conversión |
| Eventos de orden | `service_order_events` | Stream parcial actual |
| Historial de orden | `service_order_status_history` | Historial legado / paralelo |
| Evidencias | `service_order_documents`, `evidence_metadata` | Proyección híbrida |
| Tareas | `tasks`, `task_history` | Dominio activo |
| Auditoría | `audit_logs` | Auditoría de seguridad / backoffice |
| Workflow configurable | `tenant_workflow_statuses` | Configuración actual de estados |
| Reglas semáforo | `tenant_semaphore_rules` | Reglas operativas parciales |
| Config tenant | `tenant_industry_profiles`, `tenant_enabled_modules`, `tenant_label_overrides` | Configuración runtime |
| Inventario | `inventory_movements`, `inventory`, `branch_inventory`, `sucursal_inventory` | Ledger parcial ya funcional |
| Compras | `purchase_orders`, `purchase_order_items` | Dominio activo |
| Finanzas | `customer_payments`, `finances`, `expenses` | Dominio activo |

### 1.2 Entidades que faltan

| Dominio | Entidad faltante | Propósito |
|---|---|---|
| Event Store | `event_log` | Registro canónico append-only |
| Workflow runtime | `workflow_instances` | Ejecución concreta de un workflow |
| Rules runtime | `rule_evaluations` | Resultado de reglas aplicadas |
| Rules runtime | `rule_definitions` | Reglas versionadas y reutilizables |
| Proyecciones | `service_order_projection` | Vista materializada opcional sobre eventos |
| Proyecciones | `task_projection` | Vista materializada opcional sobre tareas |

### 1.3 Entidades que deben convertirse en proyección

| Entidad actual | Debe pasar a ser | Motivo |
|---|---|---|
| `service_order_status_history` | Proyección derivada | Ya duplica lo que puede quedar en `event_log` |
| `task_history` | Proyección derivada | Debe consumir eventos, no ser el origen final |
| `audit_logs` | Proyección de seguridad y administración | Mantenerla, pero derivarla también del event stream |
| `evidence_metadata` | Proyección de compatibilidad | Mantener solo como fallback temporal |
| `service_order_events` | Proyección operativa + bridge | No se elimina; se vuelve compatibilidad / stream especializado |

## 2. Event Store

### 2.1 Tabla propuesta

`public.event_log`

Campos recomendados:

| Campo | Tipo | Uso |
|---|---|---|
| `id` | `uuid` | Identificador del evento |
| `tenant_id` | `uuid` | Aislamiento multi-tenant |
| `aggregate_type` | `text` | `service_order`, `service_request`, `task`, `purchase_order`, etc. |
| `aggregate_id` | `uuid` | Id de la entidad afectada |
| `event_name` | `text` | Nombre canónico del evento |
| `event_version` | `int` | Versionado del esquema |
| `payload` | `jsonb` | Datos del evento |
| `actor_user_id` | `uuid` nullable | Usuario que ejecutó el cambio |
| `actor_role` | `text` nullable | Rol al momento del evento |
| `source_table` | `text` nullable | Tabla origen de compatibilidad |
| `source_row_id` | `uuid` nullable | Id de la fila origen |
| `correlation_id` | `uuid` nullable | Seguimiento entre eventos |
| `causation_id` | `uuid` nullable | Cadena causal |
| `created_at` | `timestamptz` | Tiempo del evento |

### 2.2 Eventos iniciales

| Evento | Origen actual | Consumidor |
|---|---|---|
| `service_order.created` | `orders.createOrder` | Timeline, portal, reportes |
| `service_order.status_changed` | `orders.updateOrderStatus` | Workflow, semáforos, portal |
| `service_order.document_uploaded` | `orders.uploadOrderAttachments` | Evidencias, portal, auditoría |
| `service_order.note_added` | `orders.addOrderNote` | Timeline, seguimiento |
| `service_order.message_added` | `orders.addOrderMessage` | Portal, comunicaciones |
| `service_order.financials_updated` | `orders.updateOrderFinancials` | Cobranza, alertas |
| `service_request.created` | `requests` create flow | Funnel comercial |
| `service_request.converted` | `requests.convertServiceRequestToOrder` | Trazabilidad comercial |
| `task.created` | `tasks.createTask` | Bandeja de trabajo |
| `task.status_changed` | `tasks.updateTaskStatus` | Workflow interno |
| `task.deleted` | `tasks.deleteTask` | Auditoría |
| `purchase_order.created` | `purchase-orders` | Compras |
| `purchase_order.received` | `purchase-orders` receive flow | Inventario |
| `customer.payment_received` | `finance` / `orders` payment flows | Cobranza |
| `audit.security_action` | `security` / `billing` / `users` | Auditoría |

### 2.3 Integración con `service_order_events`

`service_order_events` no se elimina.

Debe quedar como:

- stream especializado de orden
- fuente de compatibilidad para vistas existentes
- proyección derivada desde `event_log`

Regla de integración:

- cuando se escribe una orden, se escribe `event_log`
- en paralelo, por compatibilidad, se sigue escribiendo `service_order_events`
- el lector del portal y del dashboard puede seguir consultando `service_order_events` hasta que el nuevo stream esté validado

### 2.4 Integración con `audit_logs`

`audit_logs` tampoco se elimina.

Debe usarse como:

- auditoría de seguridad, administración y billing
- proyección especial del `event_log`

Eventos candidatos:

- login / logout
- MFA
- cambio de rol
- cambio de configuración de tenant
- acción de billing
- acciones sensibles de seguridad

### 2.5 Integración con `task_history`

`task_history` debe evolucionar a:

- historial de compatibilidad
- proyección derivada de `event_log`

No se cambia el contrato actual de la UI.
Se agrega el evento canónico y se mantiene el historial actual para lectura.

## 3. Workflow Engine

### 3.1 Cómo reutilizar `tenant_workflow_statuses`

`tenant_workflow_statuses` ya resuelve:

- estados configurables por tenant
- labels
- tonos
- estado por defecto
- terminalidad

Eso debe seguir siendo la fuente de configuración del workflow visible.

La evolución consiste en:

- tratar `tenant_workflow_statuses` como catálogo de estados
- introducir runtime de instancias y transiciones
- no depender de hardcode en controllers para decidir la validez de una transición

### 3.2 Cómo introducir `workflow_instances`

Tabla propuesta:

`public.workflow_instances`

Campos sugeridos:

- `id`
- `tenant_id`
- `workflow_key`
- `aggregate_type`
- `aggregate_id`
- `current_status_key`
- `current_status_label`
- `is_terminal`
- `context`
- `started_at`
- `ended_at`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

Uso:

- una orden, solicitud o tarea puede tener una instancia activa
- `service_orders.status` sigue existiendo
- `workflow_instances.current_status_key` se vuelve la representación runtime del estado

### 3.3 Sin romper `service_orders.status`

`service_orders.status` debe seguir siendo el contrato de lectura y compatibilidad.

La migración correcta es:

1. la API valida la acción con `requireRole`, `validateTenant`, `requireTenantModule`, `requireTenantBillingActive` y la capa de reglas
2. si la acción es válida, publica el evento canónico en `event_log`
3. un proyector consume ese evento
4. el proyector actualiza `service_orders.status`, `workflow_instances`, `service_order_events` y `audit_logs` cuando aplique

Esto permite coexistencia entre:

- código legado
- UI actual
- lectura de compatibilidad
- workflow runtime nuevo

## 4. Rules Engine

### 4.1 Reutilización de reglas existentes

Estas funciones ya forman parte del contrato actual y se deben reutilizar:

- `requireRole`
- `validateTenant`
- `requireTenantModule`
- `requireTenantBillingActive`
- reglas de scope de sucursal

### 4.2 Evolución del Rules Engine

La idea no es borrar esas funciones.
La idea es encapsularlas como políticas del motor de reglas:

| Regla actual | Rol en el Rules Engine |
|---|---|
| `requireRole` | Política de autorización por actor |
| `validateTenant` | Política de pertenencia a tenant |
| `requireTenantModule` | Política de capacidad / feature gating |
| `requireTenantBillingActive` | Política de facturación activa |
| scope por sucursal | Política de alcance operativo |

### 4.3 Reglas de scope

Las reglas de scope ya viven en:

- `apps/api/src/middleware/scope.ts`
- `apps/api/src/lib/resolve-scope.ts`
- `apps/web-admin/src/lib/scope.ts`

Deben pasar a ser una política común con estas entradas:

- tenant
- rol
- sucursal
- módulo
- capacidad del plan

### 4.4 Reglas nuevas recomendadas

Para cubrir el workflow enterprise sin romper el sistema:

- transición permitida
- requerimiento de checklist
- requerimiento de evidencia
- requerimiento de aprobación
- bloqueo por billing
- bloqueo por módulo
- bloqueo por sucursal
- bloqueo por rol
- bloqueo por terminalidad

## 5. Plan de ejecución

### Sprint 1

Objetivo:

- introducir `event_log`
- introducir `feature_flags`
- crear el bridge de escritura
- no cambiar el comportamiento de lectura

Alcance:

- nueva migración Supabase
- helper de escritura de eventos
- primer set de eventos de `service_orders`
- primer set de eventos de `tasks`
- backfill inicial desde `service_order_events`, `task_history` y `audit_logs`
- lectura de flags por tenant desde datos reales

Entregable:

- cada mutación crítica escribe `event_log`
- `service_order_events`, `task_history` y `audit_logs` siguen funcionando

### Sprint 2

Objetivo:

- introducir `workflow_instances`
- introducir `workflow service`
- conectar el update de estados con la nueva capa runtime

Alcance:

- migración Supabase adicional
- lectura de estados desde `tenant_workflow_statuses`
- escritura de instancia workflow

Entregable:

- el sistema ya sabe qué transiciones están permitidas
- `service_orders.status` no cambia de contrato

### Sprint 3

Objetivo:

- introducir `rules engine` de lectura
- introducir `policy engine`
- convertir middleware actual en políticas reutilizables
- derivar proyecciones desde eventos

Alcance:

- evaluación de reglas por transición
- evaluación de reglas por módulo
- evaluación de reglas por billing
- evaluación de reglas por scope

Entregable:

- el sistema deja de depender de lógica dispersa en controllers
- los flujos críticos se validan por políticas comunes

### Sprint 4

Objetivo:

- introducir `workflow_transitions`, `workflow_rules` y `workflow_actions` cuando `event_log` y `workflow_instances` ya estén estables

Alcance:

- migración Supabase para transiciones
- reglas explícitas de `from -> to`
- acciones de workflow declarativas
- validaciones más estrictas por workflow

Entregable:

- transiciones declarativas sin duplicar la lógica base antes de tiempo

## 6. Migraciones Supabase

### Migración 1

Archivo sugerido:

- `supabase/migrations/YYYYMMDDHHMMSS_add_event_log.sql`

Contenido:

- crear `event_log`
- índices por `tenant_id`, `aggregate_type`, `aggregate_id`, `created_at`
- RLS por `tenant_id`
- políticas select/insert restringidas

### Migración 2

Archivo sugerido:

- `supabase/migrations/YYYYMMDDHHMMSS_add_workflow_runtime.sql`

Contenido:

- crear `workflow_instances`
- índices por `tenant_id`, `workflow_key`, `aggregate_type`, `aggregate_id`
- RLS por tenant

### Migración 3

Archivo sugerido:

- `supabase/migrations/YYYYMMDDHHMMSS_add_rule_runtime.sql`

Contenido:

- crear `rule_definitions`
- crear `rule_evaluations`
- índices por `tenant_id`, `rule_key`, `created_at`
- RLS por tenant

### Migración 4

Archivo sugerido:

- `supabase/migrations/YYYYMMDDHHMMSS_add_workflow_transitions.sql`

Contenido:

- crear `workflow_transitions`
- crear `workflow_rules`
- crear `workflow_actions`
- índices por `tenant_id`, `workflow_key`, `from_status_key`, `to_status_key`
- RLS por tenant

### Migración 5

Archivo sugerido:

- `supabase/migrations/YYYYMMDDHHMMSS_backfill_event_log.sql`

Contenido:

- backfill desde `service_order_events`
- backfill desde `task_history`
- backfill desde `audit_logs` cuando aplique
- no modificar las tablas originales

### Migración 6

Archivo sugerido:

- `supabase/migrations/YYYYMMDDHHMMSS_event_log_projections.sql`

Contenido:

- vistas o tablas de proyección
- puente para `service_order_events`
- puente para `task_history`
- puente para `audit_logs`

## 7. Archivos exactos a tocar en `apps/api`

### Middleware / reglas

- `apps/api/src/middleware/requireRole.ts`
- `apps/api/src/middleware/validateTenant.ts`
- `apps/api/src/middleware/tenantBilling.ts`
- `apps/api/src/middleware/tenantCapabilities.ts`
- `apps/api/src/middleware/scope.ts`
- `apps/api/src/lib/resolve-scope.ts`

### Dominio nuevo

- `apps/api/src/domain/events/`
- `apps/api/src/domain/workflows/`
- `apps/api/src/domain/rules/`

### Servicios

- `apps/api/src/services/tenant-config.ts`
- `apps/api/src/services/evidence-adapter.ts`
- `apps/api/src/services/operational-risk.ts`
- `apps/api/src/services/security-backoffice.ts`
- `apps/api/src/services/billing.ts`

### Controladores

- `apps/api/src/controllers/orders.ts`
- `apps/api/src/controllers/requests.ts`
- `apps/api/src/controllers/tasks.ts`
- `apps/api/src/controllers/purchase-orders.ts`
- `apps/api/src/controllers/finance.ts`
- `apps/api/src/controllers/security.ts`
- `apps/api/src/controllers/reports.ts`
- `apps/api/src/controllers/public.ts`

### Rutas

- `apps/api/src/routes/orders.ts`
- `apps/api/src/routes/requests.ts`
- `apps/api/src/routes/tasks.ts`
- `apps/api/src/routes/purchase-orders.ts`
- `apps/api/src/routes/security.ts`
- `apps/api/src/routes/reports.ts`

### Entrada de aplicación

- `apps/api/src/index.ts`

### Tipos

- `packages/types/index.ts`

## 8. Impacto en producción

### Riesgo bajo

- agregar `event_log` sin reemplazar tablas existentes
- agregar escrituras paralelas
- mantener lectura actual

### Riesgo medio

- introducir validación de transitions en updates de estado
- ajustar reportes para leer proyecciones nuevas
- mover algunas reglas hardcoded a un servicio común

### Riesgo alto si se hace mal

- cambiar el contrato de `service_orders.status`
- reemplazar `service_order_events` de forma abrupta
- cambiar la forma en que portal, dashboard y reportes leen datos

### Mitigación

- ejecutar modo dual-write temporal
- mantener compatibilidad de lectura
- activar nuevas validaciones por feature flag o por tenant
- validar con tenants piloto antes de expandir

## 9. Reglas de implementación

- No eliminar módulos existentes.
- No cambiar el contrato de API sin compatibilidad.
- No depender de mocks.
- No introducir valores hardcodeados donde hoy existen variables de entorno.
- No mover todo a event sourcing completo de una vez.
- No romper el portal cliente.
- No leer directamente desde `event_log` para UI, portal o reportes.
- Toda UI debe leer desde proyecciones, nunca desde el stream bruto.

## 10. Feature Flags por tenant

La modernización debe activarse por tenant.

### Ubicación recomendada

- `feature_flags`
- o `tenant_settings` como JSON estructurado si se quiere minimizar tablas nuevas

### Flags mínimos

- `event_store_enabled`
- `workflow_engine_enabled`
- `rules_engine_enabled`

### Ejemplo de payload

```json
{
  "event_store_enabled": true,
  "workflow_engine_enabled": true,
  "rules_engine_enabled": false
}
```

### Reglas

- un tenant puede estar en arquitectura nueva mientras otro sigue en legacy
- las banderas deben vivir en datos reales, no en hardcode
- la API debe resolverlas por tenant antes de aplicar la nueva ruta

### Estrategia

1. habilitar primero en tenants piloto
2. mantener fallback al flujo actual
3. comparar resultados entre legacy y nueva proyección
4. expandir por cohorte cuando no haya divergencias

## 11. Resultado esperado

Al final de esta evolución:

- `service_orders`, `tasks`, `purchase_orders`, `finance` e `inventory` siguen vivos
- cada cambio importante emite evento
- los estados siguen siendo compatibles con la UI actual
- el workflow deja de estar disperso
- las reglas dejan de estar esparcidas entre controllers
- la auditoría se vuelve consistente

Ese es el punto de llegada correcto para Fixi Enterprise sin rehacer Fixi.
