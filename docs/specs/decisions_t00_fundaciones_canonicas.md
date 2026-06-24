# Decisions T00 / Fundaciones Canónicas

## 1. Estado

- Decisión técnica oficial: compatibilidad progresiva + capa canónica de documentación/contrato.
- Fecha actual: 2026-06-23.
- Alcance: Fundaciones antes de continuar T07.

## 2. Source of truth

- [docs/README.md](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/docs/README.md)
- [docs/canonical/especificacion_aprobada.md](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/docs/canonical/especificacion_aprobada.md)
- [docs/canonical/spec_00_modelo_datos_maestro.md](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/docs/canonical/spec_00_modelo_datos_maestro.md)
- [docs/canonical/index_documentacion_canonica.md](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/docs/canonical/index_documentacion_canonica.md)
- [docs/specs/implementation_order.md](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/docs/specs/implementation_order.md)
- [docs/specs/dependencies.md](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/docs/specs/dependencies.md)
- [docs/specs/spec_01_fundaciones.md](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/docs/specs/spec_01_fundaciones.md)

## 3. Decisión final

- Estrategia B + A.
- Compatibilidad progresiva.
- No migración destructiva.
- No renombrado físico inmediato.

## 4. Mapa canónico ↔ físico oficial

| Canónico | Físico vivo actual |
| --- | --- |
| `repair_orders` / `orders` | `service_orders` |
| solicitudes públicas | `service_requests` |
| evidencias/documentos | `service_order_documents` |
| timeline/eventos | `service_order_events` |
| checklist legal | `service_order_checklists` |
| usuarios | `users` tenant-scoped actual |
| roles/membresías | `users.role`, `users.roles`, `tenant_id`, `sucursal_id` actuales |
| sucursal | `sucursales` / compatibilidad `branches` según repo |
| productos/refacciones | `products` |
| inventario por sucursal | `sucursal_inventory` |
| movimientos inventario | `inventory_movements` |
| auditoría | `audit_logs` |

## 5. Qué queda prohibido sin ticket dedicado

- Migrar `users`.
- Renombrar `service_orders`.
- Crear `repair_orders` como sustituto físico.
- Separar `devices` y reescribir T09/T10.
- Reescribir auth.
- Reescribir portal.
- Reescribir billing.

## 6. Qué sí queda permitido para tickets siguientes

- Usar `service_orders` como físico vivo cuando la documentación diga `repair_orders`.
- Usar `products`, `sucursal_inventory`, `inventory_movements` para T07/T08.
- Mantener `service_order_documents` como evidencia normalizada.
- Mantener `service_order_events` como timeline.
- Crear migraciones aditivas por ticket cuando el workpack lo autorice.

## 7. Fases futuras

- T00A: decisión/mapeo/documentación.
- T00B: `tenant_memberships` y `user_roles` aditivos con backfill.
- T00C: capa de dispositivos/historial.
- T00D: contratos canónicos de órdenes o vistas/adaptadores.
- T00E: migración física real solo con plan de datos, rollback y pruebas.

## 8. Impacto en T07

- T07 puede continuar después de T00A usando mapeo oficial:
  - `repair_orders` → `service_orders`
  - `branches` / sucursal → `sucursales`
  - `parts` → `products`
  - `stock_movements` → `inventory_movements`
- T07 no debe esperar migración destructiva completa.

## 9. Criterios de aceptación

- Existe decisión T00 documentada.
- Existe `AGENTS.md`.
- Codex tiene reglas permanentes.
- T07 ya no queda ambiguo respecto al modelo físico.
- No se modificó código productivo.
- No se modificaron migraciones.

## 10. Rollback

- Borrar documentos creados.
- Borrar `AGENTS.md` si solo fue creado en este ticket.
- No hay rollback de DB porque no se toca DB.
