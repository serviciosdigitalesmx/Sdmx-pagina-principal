# T08 Result

Validación completada con éxito.

## Archivos tocados
- `apps/api/src/controllers/inventory-reservations.ts`
- `apps/api/src/routes/inventory.ts`
- `supabase/migrations/20260624133000_t08_consume_inventory_reservations.sql`
- `docs/implementation-bundles/T08/README.md`
- `docs/implementation-bundles/T08/verify.sh`
- `docs/implementation-results/T08-result.md`

## Migración creada
- `supabase/migrations/20260624133000_t08_consume_inventory_reservations.sql`

## Endpoint agregado
- `POST /inventory/reservations/:id/consume`

## Valor final de movement_type
- `service_order_consumed`

## Regla final de quantity
- Se usa cantidad positiva en la RPC y en el movimiento.

## Evidencia de constraint o ausencia de constraint
- No se encontró constraint explícita de `movement_type` en las migraciones revisadas.

## Typecheck
- `pnpm --dir apps/api typecheck` pasó.

## Verify
- `bash docs/implementation-bundles/T08/verify.sh` pasó.

## Riesgos restantes
- Confirmar en una base real que `inventory_movements.reference` se comporta como idempotency key del consumo.
- Revisar impacto del nuevo `movement_type` en reportes históricos.

## Siguiente ticket recomendado
- T09
