# SDMX Endpoint Contracts

This document maps the production screens to the backend routes and Supabase tables they consume.

## Portal Cliente

- Frontend route: `/t/[tenantSlug]/portal`
- Backend route: `GET /api/public/tenant/:tenantSlug/orders/:folio`
- Supabase tables:
  - `tenants`
  - `service_orders`
- Operation:
  - Read
- Tenant isolation:
  - Resolved by `tenantSlug`, converted to tenant id on the server.
- States:
  - `loading`
  - `error`
  - `empty` when the folio does not exist
  - `success` with order, status label, timeline and attachments placeholder only when real data exists

## Órdenes

- Frontend route: `/dashboard/ordenes`
- Backend routes:
  - `GET /api/:tenantId/orders`
  - `POST /api/:tenantId/orders`
- Supabase table:
  - `service_orders`
- Operation:
  - Read / Create
- Tenant isolation:
  - Applied by authenticated tenant context and `tenant_id`
- States:
  - `loading`
  - `error`
  - `empty`
  - drag/drop status transitions in the UI

## Clientes

- Frontend route: `/dashboard/clientes`
- Backend routes:
  - `GET /api/:tenantId/customers`
  - `POST /api/:tenantId/customers`
- Supabase table:
  - `customers`
- Operation:
  - Read / Create
- Tenant isolation:
  - Applied by authenticated tenant context and `tenant_id`

## Inventario

- Frontend route: `/dashboard/stock`
- Backend routes:
  - `GET /api/:tenantId/inventory`
  - `POST /api/:tenantId/inventory`
- Supabase table:
  - `inventory`
- Operation:
  - Read / Create
- Tenant isolation:
  - Applied by authenticated tenant context and `tenant_id`

## Compras

- Frontend route: `/dashboard/compras`
- Backend route:
  - `GET /api/:tenantId/procurement/summary`
- Supabase tables:
  - `inventory`
- Operation:
  - Read summary derived from real inventory
- Tenant isolation:
  - Applied by authenticated tenant context and `tenant_id`

## Gastos

- Frontend route: `/dashboard/gastos`
- Backend routes:
  - `GET /api/:tenantId/finance/cashflow/:sucursalId`
  - `POST /api/:tenantId/finance/expense`
  - `GET /api/:tenantId/finance/expense/:id`
  - `DELETE /api/:tenantId/finance/expense/:id`
- Supabase tables:
  - `finances`
  - `expenses`
- Operation:
  - Read / Create / Delete
- Tenant isolation:
  - Applied by authenticated tenant context and finance scope

## Finanzas

- Frontend route: `/dashboard/finanzas`
- Backend route:
  - `GET /api/:tenantId/finance/balance`
  - `GET /api/:tenantId/finance/cashflow/:sucursalId`
- Supabase table:
  - `finances`
- Operation:
  - Read
- Tenant isolation:
  - Applied by authenticated tenant context and role/sucursal scope

## Reportes

- Frontend route: `/dashboard/reportes`
- Backend route:
  - `GET /api/:tenantId/reports/summary`
- Supabase tables:
  - `service_orders`
  - `customers`
  - `inventory`
  - `finances`
- Operation:
  - Read summary derived from real operational tables
- Tenant isolation:
  - Applied by authenticated tenant context and `tenant_id`

## Archivo

- Frontend route: `/dashboard/archivo`
- Backend route:
  - Pending dedicated endpoint
- Supabase tables:
  - `service_orders`
  - `order_events` when available
  - `order_documents` when available
- Operation:
  - Read
- Tenant isolation:
  - Required

## Proveedores

- Frontend route: `/dashboard/proveedores`
- Backend route:
  - Pending dedicated endpoint
- Supabase tables:
  - Pending supplier catalog table
- Operation:
  - Read / Create / Update / Delete when backend exists

## Seguridad

- Frontend route: `/dashboard/seguridad`
- Backend route:
  - Pending dedicated endpoint
- Supabase tables:
  - Auth and role sources to be defined explicitly
- Operation:
  - Read / Invite / Update when backend exists

## Notes

- If a screen lacks a backend route, it must be marked as not delivered rather than showing fake content.
- All production routes must preserve tenant isolation and real error handling.
