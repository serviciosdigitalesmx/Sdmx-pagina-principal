# Migracion branches -> sucursales

Estado final:
- `public.branches` ya fue retirado del esquema operativo.
- `branch_id` ya fue retirado de las tablas de operacion.
- El backend ya opera con `sucursales` y `sucursal_inventory`.
- La documentacion visible ya usa `stock` y `sucursal_inventory`.

Historico:
- Las migraciones antiguas permanecen en `supabase/migrations/` solo como auditoria.
- Cualquier referencia a `branch_*` que siga existiendo ahi es legado tecnico, no contrato vigente.
