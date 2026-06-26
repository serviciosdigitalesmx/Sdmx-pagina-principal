# T19 Implementation Bundle

## Alcance

T19 se implementa como MVP backend-only sin migracion. Usa `PLAN_REGISTRY` como source of truth temporal para planes, modulos y limites.

## Endpoints

- `GET /api/admin/plans`
- `GET /api/admin/tenants/:tenantId/limits`
- `POST /api/admin/tenants/:tenantId/limits/validate`

Todos viven bajo el router admin protegido por `requireAuth` y `requireSuperAdmin`.

## Enforcement

- `/api/:tenantSlug/users/invite` ahora valida `resource = users` antes de crear/invitar credenciales.
- Límite excedido responde `403` con `code = PLAN_LIMIT_EXCEEDED`.
- Billing bloqueado sigue siendo responsabilidad de `requireTenantBillingActive` y responde `402`.

## Fuera De Alcance

- No migracion.
- No tabla `plans`.
- No `tenants.plan_id`.
- No cambio administrativo de plan.
- No checkout, webhook, MercadoPago, refunds, caja ni pagos reales.
- No UI.
- No counters atomicos.
- No T20.

## Validacion

```bash
pnpm --dir apps/api typecheck
bash docs/implementation-bundles/T19/verify.sh
```
