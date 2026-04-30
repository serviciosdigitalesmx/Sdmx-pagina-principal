# Samii vs SDMX

## Criterio

- `SUPERIOR`: SDMX ya lo hace mejor o con mayor cobertura.
- `IGUAL`: SDMX cubre el mismo alcance con calidad comparable.
- `INFERIOR`: SDMX existe pero está menos completo.
- `FALTANTE`: SDMX no lo tiene de forma funcional.

## Comparación por feature

| Módulo | Feature | Samii | SDMX | Estado |
|---|---|---|---|---|
| Dashboard | KPIs operativos | Sí | Sí | IGUAL |
| Órdenes | Crear orden con checklist | Sí | Sí | IGUAL |
| Órdenes | Editar orden completa | Sí | Sí | IGUAL |
| Órdenes | Cambio de estado con eventos | Sí | Sí | IGUAL |
| Órdenes | Fotos de evidencia | Sí | Sí | IGUAL |
| Órdenes | PDF de orden | Sí | Sí | IGUAL |
| Órdenes | WhatsApp link automático | Sí | Sí | IGUAL |
| Clientes | CRUD | Sí | Sí | IGUAL |
| Técnicos | CRUD | Sí | Sí | IGUAL |
| Inventario | Productos + stock | Sí | Sí | IGUAL |
| Inventario | Movimientos y alertas | Sí | Sí | IGUAL |
| Proveedores | CRUD | Sí | Sí | IGUAL |
| Compras | OC + recepción | Sí | Sí | IGUAL |
| Gastos | Egresos | Sí | Sí | IGUAL |
| Reportes | Resumen + CSV | Sí | Sí | IGUAL |
| Configuración | Branding tenant | Sí | Sí | IGUAL |
| Portal | Tracking público | Sí | Sí | IGUAL |
| Landing | Página pública por tenant | Sí | Sí | IGUAL |
| Billing | Checkout + reconciliación | Sí | Sí | IGUAL |
| Multi-tenant | `tenant_id` + RLS | Sí | Sí | IGUAL |
| Deep links | Abrir rutas directas | Frágil | Frágil | INFERIOR |
| E2E routing | Refresh en rutas profundas | Frágil | Frágil | INFERIOR |

## Lectura práctica

Samii y SDMX están muy cerca en cobertura funcional base. El diferencial no está en tener módulos “existentes”, sino en:
- estabilidad de navegación directa
- consistencia de render al refrescar
- robustez de onboarding y deep links

Si SDMX corrige routing/deployment y mantiene el mismo catálogo funcional, el competidor principal deja de ser funcionalmente superior en core ERP.

## Diferencias relevantes

### SDMX fuerte o equivalente
- arquitectura explícita `Next.js + API Render + Supabase`
- separación frontend/backend
- control de tenancy más explícito en backend

### Samii fuerte o equivalente
- UX de tablero operativa ya integrada
- flujo de compra/inventario/finanzas visible en una sola app
- branding público y portal del tenant muy expuestos al usuario final

## Riesgo comparativo

El mayor riesgo de SDMX frente a Samii no parece ser la ausencia de módulos, sino la operatividad real del despliegue y el deep-linking estable en producción.

