# Cash / POS / Finance UI Modernization

## Scope

Modernización de la vista financiera de `apps/web-admin` usando únicamente contratos reales ya existentes. No se añadió backend nuevo, no se tocaron políticas de Supabase y no se inventó flujo POS.

## Validación previa

- `docs/implementation/inventory-kardex-ui.md` existe.
- Inventario sigue cargando desde su endpoint real.
- Órdenes siguen cargando con sus contratos actuales.
- No se agregaron mocks.
- No se modificó tenant/sucursal ni aislamiento multi-tenant.

## Archivos modificados

- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/finanzas/page.tsx`

## Qué cambió

- La pantalla de finanzas pasó de una tabla básica a una vista de caja/finanzas más completa y legible.
- Se incorporaron tarjetas de resumen reales:
  - ingresos
  - egresos
  - balance
  - órdenes con cobro validado visualmente
- Se añadieron estados visuales de pago a partir de datos reales de órdenes:
  - `Cobro validado`
  - `Pendiente de validación`
  - `Pendiente`
  - `Sin cobro`
- Se mantuvo el uso de `fixService.getBalance()` y `fixService.getCashflow()`.
- Se cargan también órdenes reales con `fixService.getOrders()` para cruzar importes y estado de cobro sin simular pagos.

## Antes / Después funcional

### Antes

- La pantalla mostraba balance y flujo por sucursal en una tabla simple.
- No había validación visual de cobros de órdenes.
- No había una lectura clara de cobros relacionados a órdenes.

### Después

- La pantalla muestra una lectura más clara de caja y finanzas con contexto de órdenes.
- Los estados de cobro se derivan de campos reales de órdenes.
- No hay botones de cobro porque no existe un endpoint confirmado para operar caja sin inventar lógica.

## Gaps comprobados

- No existe un módulo POS/caja separado con contratos confirmados para:
  - crear cobros
  - registrar movimientos de caja manuales
  - emitir tickets nuevos
- No se implementó una acción de doble cobro porque no hay endpoint real validado para cobro.
- No se creó ticket falso.

## Riesgos

- La validación visual de cobro depende de `receipt_url` y de los importes reales que entrega la API.
- Si el backend no expone un contrato de POS/caja, la UI solo puede mostrar y auditar, no operar.
- La pantalla no altera saldos y no registra movimientos paralelos.

## Cómo validar localmente

1. Levantar `apps/api` con el tenant real.
2. Levantar `apps/web-admin`.
3. Abrir `/dashboard/finanzas`.
4. Verificar que:
   - cargan ingresos, egresos y balance reales
   - el flujo por sucursal aparece solo si hay sucursal activa
   - las órdenes muestran estado visual de cobro
   - no hay acciones de cobro sin endpoint real

## Qué no se tocó

- Backend
- Auth
- Supabase policies
- Inventario
- Órdenes
- Portal cliente
- Ticketing
- POS operativo
- Movimientos de caja manuales
- Cualquier cálculo o saldo hardcodeado

