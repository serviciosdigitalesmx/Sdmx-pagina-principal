# T17 IMPLEMENTATION RESULT

## 1. Decision final

- T17 se implemento como backend-only MVP sin migracion.
- No se creo UI.
- No se creo tabla `platform_admin_users`.
- No se implemento impersonacion.
- No se tocaron T19/T20.

## 2. Archivos tocados

- `apps/api/src/index.ts`
- `apps/api/src/routes/admin.ts`
- `apps/api/src/controllers/admin.ts`
- `apps/api/src/middleware/requireSuperAdmin.ts`
- `apps/api/src/services/platform-admin.ts`
- `docs/ai-packets/T17-packet.md`
- `docs/implementation-bundles/T17/README.md`
- `docs/implementation-bundles/T17/verify.sh`
- `docs/implementation-results/T17-result.md`

## 3. Endpoints agregados

- `GET /api/admin/health`
- `GET /api/admin/tenants?search=&limit=`
- `GET /api/admin/tenants/:tenantId/audit?limit=&action=`
- `PATCH /api/admin/tenants/:tenantId/billing-exempt`

## 4. Permisos super-admin

`requireSuperAdmin` exige:

- `requireAuth` ejecutado previamente.
- Usuario autenticado.
- Rol efectivo `owner`.
- Email incluido en `PLATFORM_ADMIN_EMAILS` o fallback `MASTER_ACCOUNT_EMAIL`.
- Tenant del usuario igual al tenant maestro por `MASTER_TENANT_SLUG`.
- Si `tenants.require_admin_mfa = true`, `users.mfa_enabled = true` y `users.mfa_verified_at` presente.

No usa email como control unico.

## 5. Mutacion billing_exempt

Unica mutacion permitida:

- `tenants.billing_exempt`.

Reglas:

- `tenantId` UUID obligatorio.
- `billingExempt` boolean obligatorio.
- `supportReason` obligatorio, minimo 10 caracteres, maximo 500.
- `supportTicketId` opcional, maximo 120.
- Prohibe mutar tenant maestro.
- No toca `organizations`.
- No toca `subscription_status`.
- No llama MercadoPago ni proveedores externos.

## 6. Auditoria

- La mutacion usa `writeAuditLog` de `apps/api/src/services/security-backoffice.ts`.
- La metadata de soporte se guarda en `data_after` porque T17 no crea columnas nuevas.
- La auditoria incluye `supportAction`, `supportReason`, `supportTicketId`, `targetTenantId`, `changedField`, `before`, `after` y `requestId`.
- Si auditoria falla, el servicio intenta revertir `billing_exempt` al valor anterior y falla cerrado.

## 7. Datos protegidos

T17 no devuelve:

- secretos;
- tokens;
- public tokens completos;
- MFA secrets;
- service role keys;
- datos de clientes;
- payloads completos de `data_before` o `data_after`.

La auditoria del backoffice solo devuelve resumen seguro y metadata de soporte sanitizada.

## 8. Que NO se toco

- No se creo migracion.
- No se ejecuto `supabase db push`.
- No se tocaron `apps/web-admin`, `apps/web-clientes` ni `apps/web-public`.
- No se tocaron `package.json` ni `pnpm-lock.yaml`.
- No se instalaron dependencias.
- No se tocaron WhatsApp, `message_queue`, PWA ni `notification_events`.
- No se tocaron inventario, pagos, caja, work logs, productivity reports, portal cliente ni autorizacion publica.
- No se implemento impersonacion.
- No se llamaron proveedores externos.

## 9. Validacion

Ejecutar:

```bash
pnpm --dir apps/api typecheck
bash docs/implementation-bundles/T17/verify.sh
```

## 10. Riesgos restantes

- Validacion runtime requiere `.env` seguro con Supabase, `MASTER_TENANT_SLUG`, `MASTER_ACCOUNT_EMAIL` o `PLATFORM_ADMIN_EMAILS`.
- T17 no crea columnas canonicas de soporte en `audit_logs`; usa `data_after`.
- T17 no crea UI; consumo inicial debe ser por API/herramienta controlada.
- T19 aun debe resolver enforcement de planes y mismatch `plans` canonico vs `PLAN_REGISTRY`.

## 11. Siguiente recomendado

- Review snapshot T17.
- Commit T17.
- Luego preparar T19 packet.
