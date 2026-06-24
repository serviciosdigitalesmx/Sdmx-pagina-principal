# T08

Consumo atómico de inventario reservado.

## Alcance
- RPC `consume_inventory_reservation`.
- Endpoint `POST /inventory/reservations/:id/consume`.
- Idempotencia de consumo por `inventory_movements.reference`.

## Fuera de alcance
- Reservas nuevas.
- Liberación de reservas.
- Cambios de frontend.
