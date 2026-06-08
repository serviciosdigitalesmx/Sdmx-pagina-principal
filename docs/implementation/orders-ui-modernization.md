# Fixi Orders UI Modernization

Fecha: 2026-06-08

## Archivos modificados

- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/ordenes/page.tsx`

## Dependencias visuales existentes

- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/base/app-shell.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/base/cards.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/base/badges.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/base/states.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/header.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/sidebar.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/ui/button.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/ui/dialog.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/ui/input.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/ui/tabs.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/styles/globals.css`

## Antes / Después funcional

### Antes
- `/dashboard/ordenes` solo reexportaba la pantalla de recepción.
- No había una vista específica para explorar órdenes ya creadas.
- La experiencia de búsqueda, filtros y agrupación estaba dispersa entre módulos.

### Después
- `/dashboard/ordenes` ahora es una vista real de órdenes.
- Incluye búsqueda por folio, cliente, equipo y teléfono.
- Incluye filtro por estado real detectado en los datos.
- Incluye vista `kanban` y vista `list`.
- Permite abrir detalle de una orden existente.
- Usa APIs reales existentes vía `fixService`.
- Mantiene el flujo operativo existente sin reemplazar `service_orders.status`.

## Qué se implementó

- Lista de órdenes basada en datos reales.
- Filtros por estado sin inventar nuevos estados.
- Búsqueda textual sobre campos operativos reales.
- Agrupación tipo kanban por estado existente.
- KPI cards de órdenes activas, visibles, estados y valor estimado.
- Acciones rápidas para abrir detalle y volver al flujo operativo.
- Estados de carga y error usando componentes base.
- Empty state cuando no hay resultados.

## Qué no se tocó

- Backend.
- Auth.
- Supabase policies.
- `tenant_slug`.
- Lógica de `service_orders`.
- Lógica de inventario.
- Lógica de finanzas.
- Portal cliente.
- Rutas del backend.
- Contratos API.
- Mocks.
- Datos falsos.

## Riesgos

- El detalle de orden usa el modal existente para no duplicar lógica; si en el futuro se decide convertirlo en drawer, debe hacerse sin cambiar contratos.
- La agrupación kanban depende de los estados reales ya presentes en los datos.
- Si aparece un estado nuevo desde backend, la vista lo mostrará como estado real, pero puede requerir ajuste visual de etiqueta/tono.

## Gap real detectado

- No hubo necesidad de crear un endpoint nuevo para esta modernización.
- Si más adelante se requiere un listado paginado o server-side filtering, ese cambio deberá documentarse y hacerse en backend antes de consumirlo en UI.

## Cómo validar localmente

1. Iniciar `apps/web-admin`.
2. Entrar por `/login` con una sesión real.
3. Abrir `/dashboard/ordenes`.
4. Confirmar que carga órdenes reales.
5. Buscar por folio, cliente o equipo.
6. Cambiar entre `kanban` y `list`.
7. Abrir una orden existente y verificar que el detalle carga.
8. Confirmar que la sesión y el resto de rutas siguen funcionando.

## Validaciones ejecutadas

- `apps/web-admin` `typecheck` pasó.
- Se confirmó que `docs/implementation/ui-shell.md` existe antes de tocar órdenes.
- Se mantuvieron las rutas existentes.
- No se agregaron mocks.
- No se tocó auth.

## Observación final

Esta fase moderniza exclusivamente la UI del módulo de órdenes sobre contratos ya existentes. La siguiente fase puede seguir con clientes e inventario sin depender de cambios adicionales en este módulo.
