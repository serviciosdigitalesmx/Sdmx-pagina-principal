# T19 IMPLEMENTATION RESULT

## 1. Decision final

- T19 se implemento como backend-only MVP sin migracion.
- `PLAN_REGISTRY` queda como source of truth temporal para planes y limites.
- No se implemento cambio administrativo de plan.
- No se implementaron counters atomicos ni SQL.
- No se tocaron pagos reales, MercadoPago, caja, inventario, WhatsApp, portal cliente ni autorizacion publica.

## 2. Archivos tocados

- `apps/api/src/controllers/admin.ts`
- `apps/api/src/routes/admin.ts`
- `apps/api/src/services/platform-admin.ts`
- `apps/api/src/services/tenant-plan-limits.ts`
- `apps/api/src/controllers/users.ts`
- `docs/ai-packets/T19-packet.md`
- `docs/implementation-bundles/T19/README.md`
- `docs/implementation-bundles/T19/verify.sh`
- `docs/implementation-results/T19-result.md`

## 3. Endpoints agregados

- `GET /api/admin/plans`
- `GET /api/admin/tenants/:tenantId/limits`
- `POST /api/admin/tenants/:tenantId/limits/validate`

Los endpoints usan el router admin existente protegido por `requireAuth` y `requireSuperAdmin`.

## 4. Source of truth temporal

- Fuente: `PLAN_REGISTRY` en `apps/api/src/services/tenant-capabilities.ts`.
- Planes reales: `basic`, `pro`, `scale`.
- No existe tabla fisica `plans` confirmada en migraciones.
- No existe `tenants.plan_id` fisico confirmado.

## 5. Diagnostico de limites

`apps/api/src/services/tenant-plan-limits.ts` calcula diagnostico live por tenant:

- `users`: conteo live de usuarios activos con `users.is_active = true`.
- `sucursales`: conteo live de `sucursales`.
- `monthly_orders`: conteo live de `service_orders` del mes actual; se documenta sin counter atomico.
- `storage_mb`: `unknown` porque no hay columna confiable tenant-wide.
- `whatsapp_templates`: `not_implemented`.
- `document_templates`: `not_implemented`.

Estados permitidos:

- `ok`
- `exceeded`
- `unlimited`
- `unknown`
- `not_implemented`

## 6. Enforcement agregado

`/api/:tenantSlug/users/invite` ahora ejecuta `assertTenantPlanLimit` con:

- `resource = users`
- `increment = 1`

La validacion ocurre antes de llamar a Supabase Auth para crear o invitar credenciales.

## 7. Errores y HTTP

- Limite excedido responde `403`.
- Codigo estable: `PLAN_LIMIT_EXCEEDED`.
- Payload seguro:
  - `error`
  - `code`
  - `resource`
  - `limit`
  - `used`
  - `requested`
  - `requestId`
- Billing bloqueado sigue siendo `402` por `requireTenantBillingActive`.

## 8. Que NO se toco

- No se creo migracion T19.
- No se ejecuto `supabase db push`.
- No se tocaron `apps/web-admin`, `apps/web-clientes` ni `apps/web-public`.
- No se tocaron `package.json` ni `pnpm-lock.yaml`.
- No se instalaron dependencias.
- No se tocaron `billing.ts`, `billing-adapter.ts`, checkout ni webhook.
- No se tocaron pagos reales, MercadoPago, refunds ni caja.
- No se tocaron inventario, WhatsApp, `message_queue`, PWA ni `notification_events`.
- No se tocaron portal cliente ni autorizacion publica.
- No se implemento impersonacion.
- No se implemento T20.

## 9. Validacion

Ejecutar:

```bash
pnpm --dir apps/api typecheck
bash docs/implementation-bundles/T19/verify.sh
```

## 10. Riesgos restantes

- No hay counters atomicos; los conteos live pueden tener carrera en solicitudes concurrentes.
- No hay plan persistido fisico; se usa `PLAN_REGISTRY` como fuente temporal.
- `monthly_orders` es diagnostico live mensual, no bloqueo atomico.
- `storage_mb` queda `unknown` hasta cerrar una fuente confiable tenant-wide.
- `whatsapp_templates` y `document_templates` quedan `not_implemented` hasta existir modelo/endpoint real.
- Validacion runtime requiere Supabase y env de billing/tenant correctos.

## 11. Siguiente recomendado

- Review snapshot T19.
- Commit T19 si el review pasa.
- Despues preparar T20 packet.
