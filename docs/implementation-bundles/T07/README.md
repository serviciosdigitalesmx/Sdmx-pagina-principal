# T07

Reserva automática de refacciones por orden.

## Alcance
- Tabla nueva `inventory_reservations`.
- RPCs `reserve_inventory_for_order` y `release_inventory_reservation`.
- Endpoints de listado, creación y liberación de reservas.

## Fuera de alcance
- Consumo físico de inventario.
- Cambios de frontend.
- Renombres de tablas existentes.
