# Inventory / Kardex UI Modernization

## Scope

Modernización únicamente del módulo de inventario en `apps/web-admin`, sin tocar backend, auth, Supabase policies, órdenes, portal cliente o lógica de stock en servidor.

## Validación previa

- `docs/implementation/orders-ui-modernization.md` existe.
- No se modificó el módulo de órdenes en esta entrega.
- No se tocó autenticación ni tenant isolation.
- No se introdujeron mocks ni datos falsos.

## Archivos modificados

- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/stock/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/stock/movement-modal.tsx`

## Qué cambió

### Inventario

- Se añadió una capa visual de resumen con métricas reales:
  - productos activos
  - stock bajo
  - agotados
  - valoración estimada de inventario
- Se reforzó la navegación de inventario con filtros visibles y contenedor de tabla más consistente.
- Se mantuvo la lista de productos/refacciones basada en el endpoint real `/inventory`.
- Se conservaron búsqueda, filtro por categoría y filtro de alertas sin inventar datos.
- Se mejoró el empty state para dejar claro que la vista depende de datos reales.

### Kardex / movimientos

- Se corrigió el flujo de “registrar movimiento” que apuntaba a un endpoint inexistente.
- La UI ahora muestra un Kardex real de solo lectura usando `GET /inventory/:id/movements`.
- Se exponen en pantalla:
  - stock actual
  - entradas
  - salidas
  - lista cronológica de movimientos
  - referencia
  - notas
  - vínculo con orden de servicio si existe `service_order_id`
  - vínculo con compra si existe `purchase_order_id`
- No se permite crear movimientos falsos desde frontend.

## Antes / Después funcional

### Antes

- La pantalla de inventario listaba productos, pero el flujo de movimientos estaba orientado a crear registros desde frontend.
- Ese flujo dependía de un endpoint que no existe en el backend actual.
- No había una vista clara de Kardex real.

### Después

- Inventario sigue cargando datos reales del backend.
- Los movimientos se visualizan solo si existen en el backend.
- El Kardex ya no simula entradas ni salidas.
- El usuario puede abrir el historial de cada producto sin alterar stock desde frontend.

## Gaps comprobados

- No existe un endpoint backend para crear movimientos desde frontend con el contrato anterior de `POST /inventory/movements`.
- El ajuste de stock sigue dependiendo de los endpoints reales existentes en backend.
- Si se quiere una UI de captura de movimientos operativa, primero debe existir contrato backend explícito y validado.

## Riesgos

- El cálculo de “valoración estimada de inventario” depende de `stock_current` y `cost` que devuelve la API actual.
- Si el backend devuelve movimientos incompletos o sin relaciones, la UI solo mostrará lo que exista.
- La experiencia de Kardex queda limitada al contrato real actual; no se agregaron atajos paralelos.

## Cómo validar localmente

1. Iniciar `apps/api` con la configuración real del tenant.
2. Iniciar `apps/web-admin`.
3. Abrir `/dashboard/stock`.
4. Confirmar que:
   - la tabla carga productos reales
   - los filtros funcionan
   - el contador de stock bajo y agotados coincide con los datos
   - el modal de Kardex abre el historial real
   - no se muestra ningún formulario de movimiento falso

## Qué no se tocó

- Backend
- Auth
- Supabase policies
- `service_orders`
- Lógica de órdenes
- Portal cliente
- Tenant slug
- Multi-sucursal
- Endpoints de Supabase directos desde frontend
- Cualquier mock o dato simulado

