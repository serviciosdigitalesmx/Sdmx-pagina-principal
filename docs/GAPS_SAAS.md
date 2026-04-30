# Gaps del SaaS frente a Sr. Fix

Fecha de auditoría: 2026-04-29

Este documento lista lo que todavía falta para igualar o superar al legado Sr. Fix en producto, experiencia y operación.

## Gaps críticos

| Gap | Impacto | Pantallas afectadas | Backend | Severidad |
|---|---|---|---|---|
| Automatización por estado | El taller sigue dependiendo de acciones manuales | `/dashboard/orders/[folio]`, `/portal`, `/auditoria` | Falta job/dispatcher de notificaciones | Alta |
| Timeline público más rico | El cliente no ve una línea de tiempo tan clara como en un producto premium | `/portal` | Ya existe `order_events`, falta UI pública | Alta |
| PDF de entrega/presupuesto | Falta un artefacto comercial completo | `/dashboard/orders/[folio]`, `/portal` | `order-pdf` cubre ingreso, no entrega/presupuesto | Alta |
| Recepción parcial de compras | No se puede recibir solo una parte de la OC | `/dashboard/purchase-orders` | `POST /v1/purchase-orders/:id/receive` es todo-o-nada | Alta |
| Kardex / movimientos de inventario | No hay trazabilidad de entradas/salidas por artículo | `/dashboard/inventory` | Falta modelo `inventory_movements` | Alta |
| Reportes por técnico | No hay KPI operativo fino por técnico | `/dashboard/reports`, `/tecnico` | `reportsRouter` solo da agregado operacional | Media |
| Estado de suscripción visible | El usuario no ve claramente trial/active/past_due/canceled | `/billing`, `/dashboard` | Backend sí lo sabe, UI no lo muestra completo | Media |
| Firma/aceptación de ingreso | Falta evidencia formal de recibido | `/dashboard/orders/new`, `/dashboard/orders/[folio]` | No existe endpoint ni campo de firma | Media |
| Fotos estructuradas por evento | Las fotos son evidencia, pero no están amarradas a hitos visuales | `/dashboard/orders/[folio]`, `/portal` | Ya existen `photos_urls`, falta eventing de media | Media |
| Admin de plantillas más robusto | El checklist funciona, pero falta una administración premium más clara | `/dashboard/checklist-templates` | `checklist_templates` existe, falta UX avanzada | Media |
| Gestión avanzada de técnicos | Falta asignación/carga/KPI por técnico | `/tecnico`, `/dashboard/orders/[folio]` | Existe `technicians`, faltan métricas y cola por técnico | Media |
| Portal cliente comercial | Falta descarga de documentos y mejores acciones del cliente | `/portal` | Endpoint público existe, falta más superficie | Media |

## Features que existen en Sr. Fix y están cubiertas

- Alta de orden.
- Folio secuencial.
- Checklist de ingreso.
- Fotos de evidencia.
- Portal público por folio.
- WhatsApp al cliente.
- Clientes.
- Técnicos.
- Inventario.
- Proveedores.
- Compras.
- Gastos.
- Reportes.
- Billing y prueba gratuita.
- Auditoría interna.

## Features de Sr. Fix que están parcialmente cubiertas

- Recepción guiada.
- Seguimiento técnico.
- Portal cliente.
- Automatización operacional.
- Semáforo de estado.
- PDF de orden.

## Features que todavía son faltantes o débiles

1. **Notificaciones automáticas**
   - Requiere disparo por evento, probablemente jobs/queue.
   - Hoy solo hay generación manual de WhatsApp URL.

2. **Panel de cliente premium**
   - El portal actual informa, pero todavía no se siente como producto premium completo.

3. **Documentos operativos adicionales**
   - Entrega.
   - Presupuesto.
   - Formato de entrada con firma.

4. **Operación de inventario avanzada**
   - Movimientos.
   - Trazabilidad.
   - Consumo por orden.

5. **Compras avanzadas**
   - Recepción parcial.
   - Estado por línea de compra.
   - PDF / factura de proveedor.

6. **Analítica de taller**
   - Productividad por técnico.
   - Tiempos por estado.
   - Aging de órdenes.

## Riesgos si se dejan así

- El SaaS vende la base, pero no la experiencia de taller diferenciada.
- El equipo operativo seguirá trabajando con hojas mentales fuera del sistema.
- El cliente final verá un seguimiento correcto, pero no una experiencia sobresaliente.
- El inventario y compras no cerrarán del todo la cadena de suministro.

## Prioridad recomendada

1. Automatización por estado y notificaciones.
2. Portal cliente premium con timeline.
3. PDF de entrega/presupuesto.
4. Kardex y movimientos de inventario.
5. Reportes por técnico.
6. Recepción parcial de compras.
7. Mejora de gestión de técnicos.

