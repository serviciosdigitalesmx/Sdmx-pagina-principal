# T17 PACKET PARA GPT-5.5

## 1. Ticket recomendado

SIGUE T17 PACKET.

T17 sigue despues de T16 porque `docs/specs/implementation_order.md` coloca T17 inmediatamente despues de T16 y antes de T19/T20. `docs/specs/dependencies.md` dice que T17 depende de T04, Fundaciones y T18, y desbloquea T19/T20. T18 y T16 ya estan publicados.

## 2. Evidencia de orden

- `docs/specs/implementation_order.md`: orden definitivo: T18, T16, T17, T19, T20.
- `docs/specs/implementation_order.md`: sexto bloque recomendado: T17, T19, T20 como escalamiento SaaS.
- `docs/specs/dependencies.md`: T17 depende de T04, Fundaciones, T18; desbloquea T19 y T20.
- `docs/specs/dependencies.md`: T19 depende de T17; T20 depende de T17 y T19.
- `docs/specs/decisions_t17_t18_t19_t20.md`: T17 esta marcado "LISTO PARA IMPLEMENTAR".
- `docs/specs/spec_04_plataforma.md`: T17 es backoffice interno FIXI con super-admins, `tenants`, `plans`, `audit_logs` y auditoria dura.
- `docs/implementation-results/T16-result.md`: T16 quedo como smoke/API minimo sin cambios de apps/schema.
- `docs/implementation-results/T18-result.md`: T18 ya agrego observabilidad minima requerida antes de T16/T17.

## 3. Objetivo del ticket

Implementar backoffice interno FIXI para soporte global controlado. Debe permitir diagnosticar tenants, ver auditoria y hacer acciones administrativas acotadas con motivo obligatorio. Debe usar auditoria T04 fail-closed y proteger el tenant maestro. No debe convertirse en impersonacion ni en editor operativo de datos del taller.

## 4. Estado Git

- Rama actual: `## main...origin/main`.
- Cambios locales antes de crear este packet: solo cambio autogenerado de Next en `apps/web-admin/next-env.d.ts`; fue restaurado con `git restore`.
- Estado despues de limpieza: `## main...origin/main`.
- Archivo creado por esta tarea: `docs/ai-packets/T17-packet.md`.

Ultimos 35 commits:

```text
2915489 test(t16): add api smoke validation
9322ca6 feat(t18): add observability health and request ids
be8bcae feat(t15): add productivity reports
cfdfe8c feat(t14): add work logs and commission rules
6e5b565 feat(t13): add whatsapp message queue drafts
1f95c27 feat(t12): add secure customer portal by token
317ce2b feat(t11): add online order authorizations
50ffcf7 feat(t10): add service order warranty claims
312b8b5 feat(t09): add device history by serial
43d962e feat(t08): consume reserved inventory atomically
96e8835 feat(t07): add inventory reservations
266c362 docs: define T00 canonical foundations strategy
5912caf chore: add supabase cli dependency
6935a29 feat(t02): add consent and evidence visibility controls
343b0bb feat(t06): add order payment refunds
327c375 feat(t05): register order payments
0c7fef5 feat(t03): enforce configurable serial number
9afcada feat(t01): enforce legal intake checklist
62d9c78 docs: finalize Fixi implementation decisions
67b8e4f docs: add technical design and repo reality for T17 to T20
9f554e7 docs: add technical design and repo reality for T13, T14 and T15
7c71294 chore(docs): finalize T11 T12 technical decisions
db6a248 docs: add technical design and repo reality for T11 and T12
d259a3a docs: align T05 T06 with real finance model
9f1b05b docs: finalize T01 T03 T02 implementation decisions
9e1e39d docs: add approved Fixi technical specifications
a0c582a docs: add canonical Fixi specifications
07a539d feat(public): refresh SaaS landing surfaces
ef8db74 feat(public): unify tenant surfaces
c9dfbd2 feat(clientes): refresh tenant landing surfaces
391d31f feat(clientes): unify portal visual system
08db676 feat(admin): finish legacy surface cleanup
748a813 feat(admin): standardize remaining dashboard screens
8255139 feat(admin): unify core dashboard surfaces
74f31a8 feat: unify FIXI product visual system
```

## 5. Dependencias previas

- T00: usar mapeo oficial y no renombrar tablas; `tenants`, `users`, `service_orders`, `audit_logs` son fisicos actuales.
- T04: toda accion critica de soporte debe auditarse fail-closed con `request_id`.
- T11: autorizaciones online no deben ser alteradas desde backoffice en MVP.
- T12: portal cliente y tokens publicos no deben exponerse completos ni manipularse desde soporte.
- T13: WhatsApp sigue como drafts/outbox; T17 no debe enviar mensajes reales.
- T14: work logs/comisiones no deben editarse desde backoffice en MVP.
- T15: reportes son lectura; T17 puede consultar salud operacional pero no recalcular reportes.
- T16: smoke/API existe; T17 debe incluir validacion propia y no romper smoke.
- T18: `requestIdMiddleware`, health dependencies y logs seguros ya existen y deben reutilizarse.

## 6. Estado real del repo

- No existe ruta `apps/api/src/routes/admin.ts`.
- No existe controlador `apps/api/src/controllers/admin.ts`.
- No existe middleware `requireSuperAdmin`.
- Existe `apps/api/src/index.ts` montando rutas reales `/api/...` y `/api/:tenantSlug/...`; no hay versionado API.
- Existe `apps/api/src/middleware/auth.ts` con JWT interno, usuario activo, tenant, role, sucursal y sesiones revocables.
- Existe `apps/api/src/middleware/validateTenant.ts` que exige coincidencia entre tenant de ruta y token.
- Existe `apps/api/src/middleware/tenantBilling.ts` con bypass si `MASTER_TENANT_SLUG` o `MASTER_ACCOUNT_EMAIL` coinciden.
- Existe `apps/api/src/services/tenant-capabilities.ts` con `access_status = 'master'` por master slug/email.
- Existe `apps/api/src/controllers/security.ts` para auditoria tenant-scoped owner-only.
- Existe `apps/api/src/services/security-backoffice.ts` como servicio de seguridad/auditoria tenant, no backoffice global.
- Existe `apps/api/src/services/billing-adapter.ts` para compatibilidad `organizations`/`tenants`.
- Existe `apps/api/src/services/tenant-billing.ts` para `billing_exempt`, trial y bloqueo.
- Existe `apps/api/src/controllers/sucursales.ts` aplicando limite de sucursales.
- Existe `apps/api/src/controllers/security.ts` aplicando limite de usuarios en una ruta.
- Existe `apps/api/src/controllers/users.ts` con rutas de usuarios separadas; hay que revisar limites antes de T19.
- No existe UI de backoffice interno en `apps/web-admin`.

## 7. Modelo físico real encontrado

- `tenants`
  - Confirmado en `supabase/migrations/20260424_baseline_schema.sql`.
  - `20260514133525_remote_schema.sql` agrega `billing_exempt` y elimina columnas legacy como `plan`, `status`, `updated_at`.
  - `20260531110000_fix_security_backoffice_schema.sql` agrega `require_admin_mfa`.
  - Riesgo: codigo lee `subscription_status/status` via adapter aunque migraciones locales muestran estado mixto.
- `organizations`
  - Confirmado en `20260514133525_remote_schema.sql` con `subscription_status`.
  - Uso real: compatibilidad billing legacy en `billing-adapter.ts`.
- `users`
  - Restaurado en `20260515110000_restore_users_compat.sql` con `tenant_id`, `auth_user_id`, `full_name`, `email`, `role`, `is_active`.
  - `20260531110000_fix_security_backoffice_schema.sql` agrega `mfa_enabled`, `mfa_secret`, `mfa_verified_at`.
  - Riesgo: roles fisicos y roles efectivos se normalizan en backend.
- `audit_logs`
  - Confirmado en `20260531110000_fix_security_backoffice_schema.sql`: `tenant_id`, `user_id`, `action`, `ip_address`, `user_agent`, `data_before`, `data_after`, `created_at`.
  - Endurecido con RLS/force RLS.
  - No tiene `is_support_action`, `support_ticket_id`, `support_reason`.
- `plans`
  - Documentacion canonica lo requiere para T17/T19.
  - No se encontro tabla fisica `plans`.
  - Planes reales viven como `PLAN_REGISTRY` en `apps/api/src/services/tenant-capabilities.ts`.

## 8. Código real relacionado

- `apps/api/src/index.ts`: monta rutas; lugar probable para `/api/admin/...`.
- `apps/api/src/middleware/auth.ts`: base para auth de `requireSuperAdmin`.
- `apps/api/src/middleware/validateTenant.ts`: referencia para tenant isolation; probablemente no aplica igual a rutas globales admin.
- `apps/api/src/middleware/requestId.ts`: aporta `req.requestId` y header `x-request-id`.
- `apps/api/src/middleware/errorHandler.ts`: devuelve errores con `requestId`.
- `apps/api/src/controllers/meta.ts`: health y dependency health T18; posible fuente de `GET /api/admin/health`.
- `apps/api/src/controllers/security.ts`: auditoria tenant owner-only; referencia para filtros.
- `apps/api/src/services/security-backoffice.ts`: `writeAuditLog` tenant-scoped; debe extenderse o crear wrapper soporte.
- `apps/api/src/services/audit.ts`: servicio T04 central; revisar antes de elegir writer.
- `apps/api/src/services/tenant-capabilities.ts`: master access conceptual y `PLAN_REGISTRY`.
- `apps/api/src/middleware/tenantBilling.ts`: bypass master actual, no suficiente para backoffice.
- `apps/api/src/services/billing-adapter.ts`: fuente de lectura/escritura compatible para status billing.
- `apps/api/src/services/tenant-billing.ts`: resumen de billing.
- `apps/api/src/services/billing.ts`: checkout/webhook Mercado Pago; T17 no debe llamar proveedores.
- `apps/api/src/controllers/sucursales.ts`, `apps/api/src/controllers/security.ts`, `apps/api/src/controllers/users.ts`: evidencia de limites de plan y usuarios.

## 9. Opciones técnicas

### Opcion minima

- Backend-only `/api/admin/...` con `requireSuperAdmin`, lectura de tenants/audit y mutacion acotada de status/billing.
- SQL aditivo: columnas soporte en `audit_logs`; sin tabla `platform_admin_users`.
- Ventajas: cumple T17 MVP, bajo scope UI, desbloquea T19/T20.
- Riesgos: allowlist por env requiere deploy para cambiar admins.
- Requiere SQL: si, aditivo.
- Toca frontend: no.
- Toca backend: si.
- Dominios sensibles: auth, auditoria, billing status.

### Opcion completa

- Backend + UI separada en web-admin + tabla `platform_admin_users` + vistas internas.
- Ventajas: administracion operativa mas usable.
- Riesgos: mas superficie de seguridad, mas permisos, mas UI y pruebas.
- Requiere SQL: si.
- Toca frontend: si.
- Toca backend: si.
- Dominios sensibles: auth, auditoria, billing, tenants.

### Opcion no recomendada

- Impersonacion completa y edicion de datos operativos del taller desde backoffice.
- Ventajas: soporte poderoso.
- Riesgos: rompe tenant isolation, privacidad, auditoria, finanzas e inventario.
- Requiere SQL: probablemente.
- Toca frontend: si.
- Toca backend: si.
- Dominios sensibles: todos; no apto para MVP.

## 10. Reglas de seguridad

- No usar `MASTER_ACCOUNT_EMAIL` como unico control.
- Exigir JWT valido, usuario activo, tenant maestro, rol owner y MFA si `require_admin_mfa` esta activo.
- No permitir mutar el tenant maestro.
- Toda mutacion requiere `support_reason`; `support_ticket_id` opcional.
- Toda mutacion escribe auditoria critica fail-closed con `request_id`.
- No exponer secretos, tokens, public tokens completos, service role keys, MFA secrets ni datos sensibles de cliente.
- No crear pagos, refunds, ordenes, inventario, work logs ni WhatsApp desde T17.
- No modificar T04 destructivamente; solo metadata aditiva si se autoriza.
- No reabrir Fundaciones ni renombrar tablas.
- No ejecutar `supabase db push` desde Codex.

## 11. Riesgos reales

- Acceso master actual basado en email/slug puede ser demasiado laxo para backoffice.
- `audit_logs` no tiene columnas soporte canonicas.
- `plans` no existe como tabla fisica; planes viven en `PLAN_REGISTRY`.
- Billing esta dividido entre `organizations` legacy y `tenants`.
- Mutar `subscription_status` equivocado puede bloquear tenants reales.
- Auditoria fail-closed puede bloquear soporte si el writer falla.
- UI de backoffice aumenta superficie de permisos.
- Rutas globales `/api/admin` no deben pasar por `validateTenant` tenant-scoped normal.
- Falta env local real para levantar API; validar T17 local requerira `.env` seguro.

## 12. Preguntas para GPT-5.5

1. ¿T17 MVP debe ser backend-only o incluir UI minima en `apps/web-admin`?
2. ¿Se autoriza SQL aditivo para columnas `audit_logs.is_support_action`, `support_ticket_id`, `support_reason`?
3. ¿La autorizacion MVP usa solo `MASTER_TENANT_SLUG` + owner + `MASTER_ACCOUNT_EMAIL`, o requiere tabla `platform_admin_users`?
4. ¿Que endpoints exactos quedan autorizados para mutar billing/status y cuales solo lectura?
5. ¿Como debe resolverse el mismatch `plans` canonico vs `PLAN_REGISTRY` fisico antes de T19?

## 13. Lo que GPT-5.5 debe devolver

- T17 WORKPACK cerrado.
- Decision de alcance: backend-only o backend + UI.
- Archivos autorizados.
- SQL exacto si aplica.
- Endpoints exactos.
- Contratos request/response.
- Reglas de permisos y MFA.
- Writer de auditoria autorizado y estrategia fail-closed.
- Validaciones y comandos.
- Rollback.
- Criterios de aceptacion.

## 14. Recomendación del recolector

Implementar T17 como backend-only MVP: crear `requireSuperAdmin`, rutas `/api/admin/...`, lectura de tenants/audit/health y mutaciones acotadas de status/billing con motivo obligatorio. Autorizar solo SQL aditivo para metadata de soporte en `audit_logs`. Dejar UI completa, impersonacion, tabla `platform_admin_users` y enforcement profundo de planes para decisiones T19/T20.
