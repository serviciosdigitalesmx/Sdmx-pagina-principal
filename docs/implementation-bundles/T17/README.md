# T17 Implementation Bundle

## Alcance

T17 implementa un MVP backend-only para backoffice interno FIXI sin migracion y sin UI.

Agrega rutas internas:

- `GET /api/admin/health`
- `GET /api/admin/tenants`
- `GET /api/admin/tenants/:tenantId/audit`
- `PATCH /api/admin/tenants/:tenantId/billing-exempt`

## Seguridad

- Todas las rutas usan `requireAuth`.
- Todas las rutas usan `requireSuperAdmin`.
- `requireSuperAdmin` exige tenant maestro por `MASTER_TENANT_SLUG`.
- `requireSuperAdmin` exige email permitido por `PLATFORM_ADMIN_EMAILS` o `MASTER_ACCOUNT_EMAIL`.
- `requireSuperAdmin` exige rol efectivo `owner`.
- Si el tenant maestro tiene `require_admin_mfa = true`, exige `mfa_enabled` y `mfa_verified_at`.
- No usa email como control unico.

## Mutacion Permitida

Solo se permite cambiar `tenants.billing_exempt`.

La mutacion exige:

- `tenantId` UUID.
- `billingExempt` boolean.
- `supportReason` obligatorio.
- `supportTicketId` opcional.
- No mutar tenant maestro.
- Auditoria fail-closed usando `writeAuditLog`.

## Fuera De Alcance

- Migraciones.
- UI.
- Impersonacion.
- `platform_admin_users`.
- Pagos/refunds.
- Caja.
- Inventario.
- WhatsApp real.
- Portal cliente.
- Autorizacion publica.
- T19/T20.

## Validacion

```bash
bash docs/implementation-bundles/T17/verify.sh
```
