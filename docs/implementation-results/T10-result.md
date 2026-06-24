# T10 IMPLEMENTATION RESULT

## 1. Archivos modificados
- `apps/api/src/controllers/orders.ts`
- `apps/api/src/routes/orders.ts`
- `supabase/migrations/20260624170000_t10_service_order_warranties.sql`
- `docs/implementation-bundles/T10/README.md`
- `docs/implementation-bundles/T10/verify.sh`
- `docs/implementation-results/T10-result.md`

## 2. Migración creada
- Tabla aditiva `service_order_warranties`.
- Indices por claim order, orden original y status.
- RLS habilitado sin grants a `anon`/`authenticated`.
- RPCs `create_service_order_warranty_claim` y `update_service_order_warranty_claim_status`.

## 3. Endpoints agregados
- `GET /orders/:id/warranty`
- `POST /orders/:id/warranty/claims`
- `PATCH /orders/:id/warranty/claims/:claimId/status`

## 4. Endpoint existente preservado
- Se mantiene `PATCH /orders/:id/warranty`.
- No se reemplazo `updateOrderWarranty`.

## 5. Reglas de garantía vigente
- Se conserva `service_orders.warranty_until`.
- El reclamo calcula `eligibility_status` como `no_warranty`, `active` o `expired`.

## 6. Auditoría
- Creación: `warranty.claim.created`.
- Cambio de estado: `warranty.claim.status_updated`.
- Ambas acciones usan `request_id`.

## 7. Privacidad/documentos
- El resumen devuelve metadata segura de documentos.
- No genera signed URLs.

## 8. Relación con T09/T08
- T09 se usa para resumen opcional de historial por serial.
- T08 se consulta solo como metadata de consumos `service_order_consumed`.
- No modifica inventario ni finanzas.

## 9. Typecheck
- OK.

## 10. Verify
- OK.

## 11. Diff stat
- `apps/api/src/controllers/orders.ts | 282 +++++++++++++++++++++++++++++++++++++`
- `apps/api/src/routes/orders.ts | 5 +-`

## 12. Estado Git
- El trabajo sigue sin commit.
- Hay archivos T10 modificados/nuevos locales.

## 13. Riesgos restantes
- La migración no se aplicó a Supabase remoto en esta tarea.
- El frontend aún no consume los endpoints nuevos.

## 14. Recomendación
- LISTO PARA REVIEW
