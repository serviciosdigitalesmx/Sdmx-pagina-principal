# Historical: Web Admin vs SrFix Integration Map

## Objetivo

Este documento marca qué parte del dominio de `SrFix` ya está absorbida por `web-admin`, qué parte está parcial y qué parte sigue pendiente de backend dedicado.

## Estado por módulo

| Módulo | Ruta | Estado | Observación |
| :--- | :--- | :--- | :--- |
| Resumen | `/dashboard` | Listo | Centro operativo real con órdenes y métricas del tenant. |
| Órdenes | `/dashboard/ordenes` | Listo | Flujo principal del taller. |
| Solicitudes | `/dashboard/solicitudes` | Listo | Inbox público y conversión a orden. |
| Landing | `/dashboard/landing` | Listo | Editor comercial por tenant. |
| Clientes | `/dashboard/clientes` | Listo | CRM ligero conectado a API real. |
| Stock | `/dashboard/stock` | Listo | Inventario, movimientos y alertas. |
| Tareas | `/dashboard/tareas` | Listo | Seguimiento operativo real. |
| Compras | `/dashboard/compras` | Listo | Órdenes de compra con recepción. |
| Gastos | `/dashboard/gastos` | Listo | Egresos reales por tenant. |
| Finanzas | `/dashboard/finanzas` | Listo | Balance y cashflow reales. |
| Reportes | `/dashboard/reportes` | Listo | KPIs agregados desde tablas reales. |
| Sucursales | `/dashboard/sucursales` | Listo | Gestión por tenant y sucursal activa. |
| Archivo | `/dashboard/archivo` | Listo | Vista histórica derivada de órdenes reales. |
| Proveedores | `/dashboard/proveedores` | Listo | CRUD real, filtros y historial de compras por proveedor. |
| Usuarios | `/dashboard/usuarios` | Listo | Invitación, roles, estado y último acceso con backend real. |
| Seguridad | `/dashboard/seguridad` | Listo | Auditoría, sesiones activas, MFA y rotación de secretos. |

## Brechas que siguen abiertas

- Endpoints dedicados para gestión de seguridad y permisos más allá del resumen actual.
- Normalización completa de catálogos/estados para que todas las rutas dependan de contratos formales y no de supuestos de UI.

## Criterio operativo

- Si un módulo no tiene backend real, se debe mostrar como parcial o pendiente.
- No se debe introducir contenido simulado para cubrir huecos de integración.
