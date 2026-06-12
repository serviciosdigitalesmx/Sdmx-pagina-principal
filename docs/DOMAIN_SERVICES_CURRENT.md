# Domain Services

## Conclusión

Los servicios de dominio son la capa obligatoria entre UI y API.

## Regla principal

`Componentes UI → Domain Service → ApiGateway → API`

## Prohibido

- `Componentes UI → fetch()`
- `Componentes UI → axios()`
- `Componentes UI → apiGateway` directo sin justificación
- `Componentes UI → Supabase` directo para datos de negocio

## Servicios

### `ordersService`

Responsable de órdenes, estados, timeline y operaciones de servicio.

### `inventoryService`

Responsable de inventario, stock, movimientos y validaciones de existencia.

### `procurementService`

Responsable de compras, recepción y proveedores.

### `financeService`

Responsable de caja, pagos, cobros, movimientos y auditoría financiera.

### `tenantSettingsService`

Responsable de configuración de tenant, vertical e `industry_key`.

