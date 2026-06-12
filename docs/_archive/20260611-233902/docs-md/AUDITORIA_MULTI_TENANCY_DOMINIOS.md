# Auditoría Multi-Tenant y Dominios Operativos

## Resumen
Auditoría realizada sobre el stack real del repositorio: Next.js en `apps/web-admin`, API Express en `apps/api` y Supabase/Postgres en `supabase/migrations`. No existe un backend ASP.NET Core en este código base, así que el contexto de tenant se audita sobre `apps/api/src/middleware/auth.ts`, los JWT emitidos por `apps/api/src/controllers/auth.controller.ts` y las políticas RLS de Supabase.

## Diagnóstico Multi-Tenant

| Tabla afectada | tenant_id presente (SI/NO) | índice presente (SI/NO) | riesgo detectado (SI/NO) |
|---|---|---:|---:|
| `customers` | SI | SI | SI |
| `service_requests` | SI | SI | SI |
| `service_orders` | SI | SI | SI |
| `service_order_checklists` | SI | SI | NO |
| `service_order_status_history` | SI | SI | NO |
| `users` | SI | SI | SI |
| `sucursales` | SI | SI | NO |
| `products` | SI | SI | NO |
| `sucursal_inventory` / `branch_inventory` | SI | SI | NO |
| `purchase_orders` | SI | SI | NO |
| `purchase_order_items` | SI | NO | SI |
| `inventory_movements` | SI | SI | NO |
| `stock_alerts` | SI | SI | NO |
| `suppliers` | SI | SI | SI |
| `expenses` | SI | SI | NO |
| `customer_payments` | SI | NO | SI |
| `tasks` | SI | SI | SI |
| `audit_logs` | SI | SI | NO |
| `security_sessions` | SI | SI | NO |

## Hallazgos y correcciones

### CRM
- `customers` tenía índices por tenant pero no unicidad compuesta por `tenant_id + phone/email`.
- Corrección aplicada: migración [`20260530193000_audit_hardening_multitenant.sql`](../supabase/migrations/20260530193000_audit_hardening_multitenant.sql) agrega índices únicos parciales.

### Órdenes
- `service_order_status_history` dependía de inserciones desde API.
- Corrección aplicada: trigger `trg_service_orders_status_audit_and_payment` inserta historia de estado automáticamente.
- La lógica pública excluye `internal_diagnosis`; el portal no lo expone en DTOs.

### Portal público
- El acceso público por `folio` es predecible si no se usa `public_token`.
- El repo ya añadió `public_token` para consulta pública no secuencial.

### Inventario y compras
- `inventory_movements` y stock por sucursal están indexados y filtrados por `tenant_id`/`sucursal_id`.
- Falta índice compuesto en `purchase_order_items`; se deja como riesgo hasta agregarlo.

### Finanzas
- Se agregó `source` a `customer_payments` y un trigger automático de cobro al pasar una orden a `entregado`.
- Esto evita que el pago dependa solo de la acción manual del frontend.

### Seguridad
- `audit_logs` y `security_sessions` ahora tienen RLS explícita.
- La inyección de tenant no depende de headers del cliente: `apps/api/src/middleware/auth.ts` verifica el JWT firmado con secreto del tenant y extrae `tenant_id`, `role` y `sucursal_id` desde claims validados.

## SQL correctivo relevante
- Migración completa: [`supabase/migrations/20260530193000_audit_hardening_multitenant.sql`](../supabase/migrations/20260530193000_audit_hardening_multitenant.sql)

## Notas
- Este informe es de auditoría estática contra el repo. Cualquier `EXPLAIN ANALYZE` requiere una base live conectada.
- Donde el esquema actual ya cubre el flujo, se documenta como sin riesgo crítico.
