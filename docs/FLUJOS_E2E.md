# Flujos E2E del SaaS

Fecha de auditoría: 2026-04-29

Este documento describe los flujos completos que hoy existen en el sistema, con sus pasos, backend involucrado y puntos de salida.

## 1. Registro y bootstrap de tenant

### Flujo

1. Usuario entra a `/register`.
2. Captura nombre, negocio, correo y contraseña.
3. Opcionalmente inicia con Google.
4. Supabase Auth crea la sesión.
5. El frontend llama `POST /api/setup/init`.
6. El backend ejecuta `rpc(initialize_tenant)`.
7. Se crea o resuelve tenant.
8. Se crea el rol de usuario y la suscripción inicial.
9. El usuario aterriza en `/dashboard`.

### Backend involucrado

- Supabase Auth.
- `POST /api/setup/init`.
- `rpc(initialize_tenant)`.
- Tablas: `tenants`, `user_roles`, `subscriptions`, `usage_counters`.

### Resultado

- Tenant multitenant operativo.
- Sesión usable.
- Acceso al SaaS sin datos falsos.

## 2. Login y entrada al dashboard

### Flujo

1. Usuario entra a `/login`.
2. Ingresa correo y contraseña o usa Google.
3. Supabase devuelve session token.
4. El frontend navega a `/dashboard`.
5. `apiFetch` usa bearer token en cada request.

### Backend involucrado

- Supabase Auth.
- Middleware `requireAuth`.
- Middleware `resolveTenant`.
- Middleware `requireActiveSubscription`.

### Resultado

- Dashboard protegido.
- Consultas con `tenant_id`.

## 3. Navegación operativa

### Flujo

1. Usuario entra a `/hub`.
2. Elige módulo:
   - `/recepcion`
   - `/tecnico`
   - `/clientes`
   - `/billing`
   - `/auditoria`
   - `/portal`
   - `/dashboard`
   - `/pricing`

### Backend involucrado

- No escribe datos.
- Solo guía a los módulos vivos.

### Resultado

- Acceso rápido a la operación del SaaS.

## 4. Recepción y alta de orden

### Flujo

1. Usuario entra a `/recepcion`.
2. Abre `/dashboard/orders/new`.
3. Selecciona cliente.
4. Captura placa, tipo de dispositivo, marca, modelo, accesorios y descripción.
5. Elige checklist template.
6. Hace submit.
7. Backend crea folio con `increment_repair_sequence`.
8. Crea `service_orders`.
9. Crea `order_checklist_items` desde plantilla.
10. Genera `portal_url`.
11. Genera `whatsapp_url`.
12. El usuario entra al detalle de la orden.

### Backend involucrado

- `GET /v1/customers`
- `GET /v1/checklist-templates`
- `POST /v1/orders`
- `rpc(increment_repair_sequence)`
- `rpc(increment_usage_counter)`
- Tablas: `service_orders`, `order_checklist_items`, `order_events`.

### Resultado

- Orden real con folio, portal y WhatsApp.
- Checklist normalizado.

## 5. Detalle y operación de orden

### Flujo

1. Usuario abre `/dashboard/orders/[folio]`.
2. Backend lee orden por folio.
3. Usuario cambia status.
4. Usuario edita falla, diagnóstico, notas internas y públicas.
5. Usuario asigna técnico.
6. Usuario marca checklist.
7. Usuario carga fotos.
8. Usuario descarga PDF.
9. El sistema guarda eventos en timeline.

### Backend involucrado

- `GET /v1/orders/:folio`
- `PATCH /v1/orders/:folio`
- `POST /v1/orders/:folio/photos`
- `GET /v1/orders/:folio/events`
- `GET /v1/orders/pdf/:folio`
- Tablas: `service_orders`, `order_checklist_items`, `order_events`.

### Resultado

- Gestión rica de la orden.
- Evidencia y PDF.
- Timeline de negocio.

## 6. Portal público del cliente

### Flujo

1. Cliente abre `/portal` o `/consultar`.
2. Escribe folio.
3. Frontend llama backend público.
4. Ve estado, falla, diagnóstico, notas públicas, checklist.
5. Abre WhatsApp con mensaje prellenado.

### Backend involucrado

- `GET /v1/public/repair-orders/:folio`
- Tablas: `service_orders`, `order_checklist_items`, `customers`.

### Resultado

- Seguimiento público real.
- Comunicación con cliente vía WhatsApp.

## 7. Billing / monetización

### Flujo

1. Usuario entra a `/billing` o desde pricing.
2. Selecciona plan.
3. Frontend llama `POST /v1/billing/checkout`.
4. Stripe crea sesión de checkout.
5. Webhook recibe `checkout.session.completed`.
6. Backend hace upsert de `subscriptions`.
7. Suscripción queda `active`.
8. `requireActiveSubscription` habilita el tenant.

### Backend involucrado

- `POST /v1/billing/checkout`
- `POST /v1/billing/reconcile`
- `POST /v1/webhooks/stripe`
- Tablas: `subscriptions`, `plans`, `webhook_events`.

### Resultado

- SaaS cobrable.
- Trial y plan activo compatibles.

## 8. Auditoría interna

### Flujo

1. Usuario abre `/auditoria`.
2. Frontend llama `GET /v1/admin/audit-events`.
3. Ve eventos creados por tenant.
4. Puede inspeccionar cambios de órdenes, clientes, inventario, compras, gastos, billing y bootstrap.

### Backend involucrado

- `GET /v1/admin/audit-events`
- Tabla: `audit_events`.

### Resultado

- Trazabilidad operacional básica real.

## 9. Clientes / CRM

### Flujo

1. Usuario entra a `/clientes`.
2. Ve el directorio del tenant.
3. Abre el CRM completo en `/dashboard/customers`.
4. Crea o edita cliente desde backend.

### Backend involucrado

- `GET /v1/customers`
- `POST /v1/customers`
- `PATCH /v1/customers/:id`
- Tabla: `customers`.

### Resultado

- CRM básico real.

## 10. Técnico / cola operativa

### Flujo

1. Usuario entra a `/tecnico`.
2. Frontend consulta órdenes activas y técnicos.
3. Visualiza carga de trabajo.
4. Abre detalle de la orden.

### Backend involucrado

- `GET /v1/orders`
- `GET /v1/technicians`
- Tabla: `technicians`, `service_orders`.

### Resultado

- Seguimiento técnico operativo.

## 11. Inventario

### Flujo

1. Usuario entra al módulo de inventario en dashboard.
2. Ve productos.
3. Crea o edita producto.
4. Ajusta stock manual.
5. Revisa alertas low-stock.

### Backend involucrado

- `GET /v1/inventory`
- `POST /v1/inventory`
- `PATCH /v1/inventory/:id`
- `POST /v1/inventory/:id/stock`
- `GET /v1/inventory/alerts/low-stock`
- Tabla: `products`.

### Resultado

- Inventario funcional con control básico de stock.

## 12. Proveedores y compras

### Flujo

1. Usuario ve proveedores.
2. Crea orden de compra.
3. Agrega items.
4. Recibe la compra.
5. El stock se incrementa.

### Backend involucrado

- `GET/POST/PATCH /v1/suppliers`
- `GET/POST /v1/purchase-orders`
- `GET /v1/purchase-orders/:id`
- `POST /v1/purchase-orders/:id/receive`
- Tablas: `suppliers`, `purchase_orders`, `purchase_order_items`, `products`.

### Resultado

- Abastecimiento operativo real.

## 13. Gastos y finanzas

### Flujo

1. Usuario crea gasto.
2. Puede editar o eliminar.
3. Consulta resumen de ingresos, gastos y utilidad.
4. Revisa categorías.

### Backend involucrado

- `GET /v1/expenses/summary`
- `GET /v1/expenses/categories/list`
- `GET/POST/PATCH/DELETE /v1/expenses`
- Tabla: `expenses`, y lectura de `service_orders.final_cost`.

### Resultado

- Finanzas operativas básicas.

## 14. Reportes

### Flujo

1. Usuario abre reportes.
2. Consulta resumen operativo.
3. Descarga CSV.

### Backend involucrado

- `GET /v1/reports/operational`
- `GET /v1/reports/operational/csv`
- Tabla: `service_orders`.

### Resultado

- KPI operativo básico.

## 15. Aislamiento multi-tenant y gating

### Flujo

1. El usuario envía bearer token.
2. `requireAuth` valida Supabase.
3. `resolveTenant` busca `tenant_id` en `user_roles`.
4. `requireActiveSubscription` valida status y plan.
5. `requireFeature` verifica límites del plan.
6. La query se ejecuta filtrando por `tenant_id`.

### Backend involucrado

- `requireAuth`
- `resolveTenant`
- `requireActiveSubscription`
- `requireFeature`
- Tablas: `user_roles`, `subscriptions`, `plans`.

### Resultado

- Multi-tenant real.
- SaaS listo para cobro.

