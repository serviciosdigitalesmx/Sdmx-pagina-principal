# Auditoría funcional de Sr. Fix vs Servicios Digitales MX

Fecha de auditoría: 2026-04-29

Objetivo: mapear las pantallas vivas, acciones de usuario, flujos, endpoints reales, aislamiento multi-tenant y brechas funcionales del SaaS actual respecto al legado Sr. Fix.

## Criterios

- **OK**: feature implementada con flujo real E2E, backend real, Supabase y tenant_id.
- **Parcial**: la feature existe, pero le faltan subflujos, UX completa o automatización.
- **Faltante**: existe solo como idea o no existe en la superficie auditada.
- **Roto**: existe en UI o contrato, pero el flujo falla o no completa.

## Inventario funcional

| Módulo | Feature | Acción usuario | Flujo | Backend involucrado | Estado SaaS | Multitenant OK | Gap |
|---|---|---|---|---|---|---|---|
| Hub | Navegación operativa | Entrar a `/hub` y abrir módulos | Punto de entrada al SaaS | Frontend estático con enlaces a `/recepcion`, `/tecnico`, `/clientes`, `/billing`, `/auditoria`, `/portal`, `/dashboard`, `/pricing` | OK | Sí | Falta personalización por rol |
| Recepción | Alta guiada | Ver pasos, ir a crear orden | Recepción de equipo y onboarding de orden | Link a `/dashboard/orders/new`, `/dashboard/checklist-templates`, `/consultar` | Parcial | Sí | Es guía, no toma datos en esa pantalla |
| Técnico | Cola operativa | Ver órdenes activas y técnicos | Seguimiento interno de trabajo | `GET /v1/orders`, `GET /v1/technicians` | OK | Sí | Falta asignación/gestión profunda de carga por técnico |
| Clientes | Directorio | Ver clientes del tenant | CRM del taller | `GET /v1/customers` | OK | Sí | Falta CRUD completo desde esta pantalla legacy |
| Billing | Checkout | Seleccionar plan y pagar | Alta/upgrade de suscripción | `POST /v1/billing/checkout` | OK | Sí | Falta estado visual de suscripción y portal de cliente de billing |
| Auditoría | Eventos internos | Ver eventos por tenant | Trazabilidad de negocio | `GET /v1/admin/audit-events` | OK | Sí | Falta filtros avanzados y exportación |
| Portal | Rastreo público | Buscar folio, revisar avance, abrir WhatsApp | Seguimiento del cliente por orden | `GET /v1/public/repair-orders/:folio` | OK | No aplica por tenant visible | Falta timeline visual más rico y acciones de cliente |
| Register | Onboarding | Capturar nombre, negocio, correo, password, Google | Crear cuenta y bootstrap de tenant | Supabase Auth + `POST /api/setup/init` | OK | Sí | Falta revalidación visual de errores por campo |
| Dashboard | Panel principal | Ver órdenes recientes y entrar a módulos | Centro operativo del tenant | `GET /v1/orders` | OK | Sí | Falta métricas SaaS más completas |
| Dashboard > Nueva orden | Intake | Crear orden, elegir cliente, checklist, dispositivo | Alta operativa con folio, portal y WhatsApp | `POST /v1/orders`, `POST /v1/checklist-templates`, `rpc(increment_repair_sequence)` | OK | Sí | Falta firma de recibido y accesorios como checklist normalizable aparte |
| Dashboard > Detalle orden | Edición rica | Cambiar status, checklist, técnico, fotos, PDF | Operación completa de la orden | `GET /v1/orders/:folio`, `PATCH /v1/orders/:folio`, `POST /v1/orders/:folio/photos`, `GET /v1/orders/:folio/events`, `GET /v1/orders/pdf/:folio` | OK | Sí | Falta automatización por cambio de estado y timeline público más visual |
| Dashboard > Checklist templates | Plantillas | Crear/editar plantillas | Normalización del intake | `GET/POST/PATCH /v1/checklist-templates` | OK | Sí | Falta pantalla más robusta de administración avanzada |
| Dashboard > Inventario | Stock | Crear, editar, ajustar stock, low stock | Inventario del taller | `GET/POST/PATCH /v1/inventory`, `POST /v1/inventory/:id/stock`, `GET /v1/inventory/alerts/low-stock` | OK | Sí | Falta kardex/movimientos históricos |
| Dashboard > Proveedores | Abastecimiento | Ver proveedores y abrir módulo | Catálogo de proveedores | `GET/POST/PATCH /v1/suppliers` | OK | Sí | Falta relación más visible con compras y cuentas por pagar |
| Dashboard > Compras | OC y recepción | Crear OC, recibir, actualizar stock | Abastecimiento y entrada a inventario | `GET/POST /v1/purchase-orders`, `POST /v1/purchase-orders/:id/receive` | OK | Sí | Falta recepción parcial y PDF de compra |
| Dashboard > Gastos | Finanzas | Crear/editar/borrar gasto, filtrar y resumir | Control financiero operativo | `GET /summary`, `/categories/list`, `GET/POST/PATCH/DELETE /v1/expenses` | OK | Sí | Falta adjuntos/recibos y gastos recurrentes |
| Dashboard > Reportes | KPIs | Ver resumen y descargar CSV | Analytics operativo | `GET /v1/reports/operational`, `GET /v1/reports/operational/csv` | OK | Sí | Falta reporte por técnico, aging y métricas de negocio más avanzadas |

## Validación contra backend

### Features con endpoint real y persistencia en Supabase

- Órdenes de servicio: `service_orders`, `order_events`, `order_checklist_items`, `photos_urls`.
- Clientes: `customers`.
- Técnicos: `technicians`.
- Inventario: `products`.
- Proveedores: `suppliers`.
- Compras: `purchase_orders`, `purchase_order_items`.
- Gastos: `expenses`.
- Plantillas de checklist: `checklist_templates`, `checklist_template_items`.
- Billing: `subscriptions`, `plans`, `webhook_events`.
- Auditoría: `audit_events`.
- Onboarding: `user_roles`, `tenants`.

### Garantías multi-tenant observadas

- `requireAuth` resuelve usuario Supabase real.
- `resolveTenant` deriva `tenant_id` desde `user_roles`.
- `requireActiveSubscription` bloquea sin suscripción activa o trial.
- `requireFeature` limita módulos por `plans.limits`.
- Las queries críticas filtran siempre por `tenant_id`.

## Lectura por pantalla

### `/hub`

- Acciones: entrar a recepción, técnico, clientes, billing, auditoría, portal, dashboard, pricing.
- Flujo: índice operativo del SaaS.
- Backend: no escribe datos.
- Estado: **OK**.
- Gap: no personaliza por rol ni por etapa del negocio.

### `/recepcion`

- Acciones: ir a crear orden, administrar checklists, abrir portal público.
- Flujo: pre-ingreso y orientación de operación.
- Backend: no escribe datos; dispara navegación a flujos reales.
- Estado: **Parcial**.
- Gap: la recepción no captura datos ahí mismo; solo guía.

### `/tecnico`

- Acciones: ver cola operativa, ver técnicos, abrir orden.
- Flujo: coordinación técnica diaria.
- Backend: consume `GET /v1/orders` y `GET /v1/technicians`.
- Estado: **OK**.
- Gap: falta gestión más fina de asignación/carga por técnico.

### `/clientes`

- Acciones: ver directorio, abrir CRM completo.
- Flujo: CRM rápido / acceso legacy.
- Backend: consume `GET /v1/customers`.
- Estado: **OK**.
- Gap: falta CRUD completo desde esta pantalla legacy.

### `/billing`

- Acciones: elegir plan, iniciar checkout.
- Flujo: monetización.
- Backend: `POST /v1/billing/checkout`, Stripe checkout, webhook activa suscripción.
- Estado: **OK**.
- Gap: falta estado visual de suscripción en esta vista.

### `/auditoria`

- Acciones: ver eventos, saltar a dashboard/billing/portal.
- Flujo: trazabilidad interna.
- Backend: `GET /v1/admin/audit-events`.
- Estado: **OK**.
- Gap: filtros/exportación/retención.

### `/portal`

- Acciones: buscar folio, ver avance, abrir WhatsApp.
- Flujo: portal del cliente.
- Backend: `GET /v1/public/repair-orders/:folio`.
- Estado: **OK**.
- Gap: falta timeline visual, documentos descargables y notificaciones.

### `/register`

- Acciones: crear cuenta, continuar con Google.
- Flujo: onboarding + bootstrap de tenant.
- Backend: Supabase Auth + `POST /api/setup/init`.
- Estado: **OK**.
- Gap: falta mejor UX de errores por campo y confirmación visual del bootstrap.

## Features del legado Sr. Fix que ya están cubiertas

- Alta de orden con folio.
- Checklist de ingreso normalizado.
- PDF de orden.
- Fotos de evidencia.
- Portal público por folio.
- WhatsApp con link al portal.
- Clientes.
- Técnicos.
- Inventario.
- Proveedores.
- Compras.
- Gastos.
- Reportes.
- Auditoría.
- Prueba gratuita / suscripción.

## Features del legado Sr. Fix que todavía no están al nivel esperado

- Recepción más rica con captura visual completa al mismo tiempo.
- Semáforo más presente en toda la navegación y portal.
- Timeline visual más trabajado.
- Automatización por cambio de estado.
- PDF de entrega/presupuesto más completo.
- Recepción parcial de compras.
- Kardex de inventario.
- Reportes por técnico y por productividad.
- Notificaciones automáticas por evento.

