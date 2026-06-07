# BUSINESS_FLOW_REPORT

## Summary
All core business modules are wired to real API and Supabase-backed flows in the inspected source. No module was proven non-functional from repository evidence alone.

## Module status

| module | status | evidence |
|---|---|---|
| `Ordenes` | FUNCIONA CON OBSERVACIONES | `apps/api/src/controllers/orders.ts`, `apps/web-admin/src/app/dashboard/ordenes/page.tsx` |
| `Clientes` | FUNCIONA CON OBSERVACIONES | `apps/api/src/controllers/customers.ts`, `apps/web-admin/src/app/dashboard/clientes/page.tsx` |
| `Inventario` | FUNCIONA CON OBSERVACIONES | `apps/api/src/controllers/inventory.ts`, `apps/api/src/controllers/purchase-orders.ts` |
| `Compras` | FUNCIONA CON OBSERVACIONES | `apps/api/src/controllers/purchase-orders.ts`, `apps/api/src/controllers/suppliers.ts` |
| `Finanzas` | FUNCIONA CON OBSERVACIONES | `apps/api/src/controllers/finance.ts`, `apps/web-admin/src/app/dashboard/finanzas/page.tsx` |
| `Solicitudes` | FUNCIONA CON OBSERVACIONES | `apps/api/src/controllers/requests.ts`, `apps/web-admin/src/app/dashboard/solicitudes/page.tsx` |
| `Usuarios` | FUNCIONA CON OBSERVACIONES | `apps/api/src/controllers/users.ts`, `apps/web-admin/src/app/dashboard/usuarios/page.tsx` |
| `Sucursales` | FUNCIONA CON OBSERVACIONES | `apps/api/src/controllers/sucursales.ts`, `apps/web-admin/src/app/dashboard/sucursales/page.tsx` |
| `Portal cliente` | FUNCIONA CON OBSERVACIONES | `apps/web-public/src/app/[tenant]/tracking/page.tsx`, `apps/web-public/src/app/t/[tenantSlug]/portal/page.tsx` |

## Observations
- The codebase uses real backend routes and tenant-scoped queries.
- No mocked business layer was found in the inspected paths.
- Some flows rely on URL and token handoff between apps, so operational correctness depends on correct deployment configuration.

## Not found
- No module was proven broken end-to-end from repository evidence alone.
