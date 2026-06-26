# T19 PACKET PARA GPT-5.5

## 1. Ticket recomendado

SIGUE T19 PACKET.

T19 viene despues de T17 porque `docs/specs/implementation_order.md` coloca T17, T19 y T20 en el sexto bloque de escalamiento SaaS, y `docs/specs/dependencies.md` declara que T19 depende de T17 y Fundaciones. T17 ya esta publicado como backend-only MVP y dejo listo el backoffice interno para soporte controlado.

## 2. Evidencia de orden

- `docs/specs/implementation_order.md`: orden definitivo: T17 Backoffice interno FIXI, T19 Limites de plan y billing enforcement, T20 Exportacion/importacion.
- `docs/specs/implementation_order.md`: sexto bloque recomendado: T17, T19, T20.
- `docs/specs/dependencies.md`: T19 depende de T17 y Fundaciones; T20 depende de T17, T19 y Fundaciones.
- `docs/specs/decisions_t17_t18_t19_t20.md`: T19 existe parcialmente; billing y modulos ya se validan, pero faltan limites completos y consumo atomico.
- `docs/specs/spec_04_plataforma.md`: T19 debe validar creacion de recursos contra limites del plan asociado al tenant.
- `docs/implementation-results/T17-result.md`: T17 no toco T19/T20 y deja pendiente resolver mismatch `plans` canonico vs `PLAN_REGISTRY`.
- Commits recientes: `d5ff60e feat(t17): add platform admin backoffice api`, `2915489 test(t16): add api smoke validation`, `9322ca6 feat(t18): add observability health and request ids`.

## 3. Objetivo del ticket

T19 debe cerrar el enforcement backend de planes y limites SaaS por tenant. Debe definir una fuente de verdad real para planes, resolver el mismatch entre `plans` canonico y `PLAN_REGISTRY`, mantener billing/trial existente sin tocar pagos reales, y aplicar limites consistentes en rutas de creacion. Debe evitar MercadoPago, caja, pagos, inventario y WhatsApp real. El backend debe ser autoridad; frontend solo UX.

## 4. Estado Git

- Rama actual: `## main...origin/main`.
- Ultimos commits relevantes:
  - `d5ff60e feat(t17): add platform admin backoffice api`
  - `2915489 test(t16): add api smoke validation`
  - `9322ca6 feat(t18): add observability health and request ids`
  - `be8bcae feat(t15): add productivity reports`
  - `cfdfe8c feat(t14): add work logs and commission rules`
  - `6e5b565 feat(t13): add whatsapp message queue drafts`
  - `1f95c27 feat(t12): add secure customer portal by token`
  - `317ce2b feat(t11): add online order authorizations`
- Cambios locales antes de crear packet: ninguno.
- Archivo creado por esta tarea: `docs/ai-packets/T19-packet.md`.

## 5. Dependencias previas

- T00: define mapeo canonico/fisico y prohibe renombrar tablas sin plan cerrado.
- T04: auditoria critica rige operaciones de soporte y cambios sensibles.
- T16: smoke/API debe seguir compatible; T19 no debe romper health ni rutas basicas.
- T17: aporta `/api/admin/*`, `requireSuperAdmin`, motivo obligatorio y auditoria para soporte.
- T18: aporta request ids, health dependencies y logs estructurados seguros.
- Billing/trial existente: `requireTenantBillingActive`, `tenant-billing.ts`, `billing-adapter.ts` y `billing.ts`.
- Tickets relacionados: T20 queda bloqueado hasta que T19 cierre planes/limites.

## 6. Estado real del repo

- Servicios billing existentes:
  - `apps/api/src/services/tenant-billing.ts`: calcula `isBillingBlocked` con trial, `billing_exempt` y status.
  - `apps/api/src/services/billing-adapter.ts`: lee/escribe status en modos `legacy`, `mixed`, `tenants`.
  - `apps/api/src/services/billing.ts`: crea checkout/webhook MercadoPago; T19 no debe tocarlo salvo referencia.
- Middleware existente:
  - `apps/api/src/middleware/tenantBilling.ts`: devuelve `402` si billing bloqueado.
  - `apps/api/src/middleware/tenantCapabilities.ts`: adjunta capabilities y bloquea modulos con `403`.
- `PLAN_REGISTRY`:
  - Vive en `apps/api/src/services/tenant-capabilities.ts`.
  - Planes reales runtime: `basic`, `pro`, `scale`.
  - Limites: `users`, `sucursales`, `monthly_orders`, `storage_mb`, `public_portal`, `whatsapp_templates`, `document_templates`.
- Rutas/controllers con limites:
  - `apps/api/src/controllers/sucursales.ts`: limita sucursales por conteo antes de crear.
  - `apps/api/src/controllers/security.ts`: limita usuarios en invite de seguridad.
- Enforcement existente:
  - Billing: varias rutas usan `requireTenantBillingActive`.
  - Modulos: rutas usan `requireTenantModule`.
  - Limites puntuales: usuarios/sucursales en dos puntos.
- Huecos reales:
  - `apps/api/src/controllers/users.ts` invita usuarios sin validar limite.
  - No hay enforcement de `monthly_orders`, `storage_mb`, `whatsapp_templates`, `document_templates`.
  - No hay contador atomico/idempotente para concurrencia.
  - Rutas publicas no usan billing/capabilities.

## 7. Modelo fisico real encontrado

- Tabla `plans`: no se encontro `create table public.plans` ni `alter table public.plans` en migraciones.
- Canonicamente `tenants.plan_id` existe en docs, pero no se encontro columna fisica real.
- `tenants.plan` existio en baseline, pero `20260514133525_remote_schema.sql` lo elimina.
- `tenants.status` existio en baseline, pero `20260514133525_remote_schema.sql` lo elimina.
- `tenants.billing_exempt` existe por `20260514133525_remote_schema.sql`.
- `tenants.trial_expires_at` existe por `20260514150000_add_tenant_onboarding.sql`.
- `organizations.subscription_status` existe por `20260514133525_remote_schema.sql`.
- `billing-adapter.ts` intenta leer `tenants.subscription_status/status` en modo `mixed/tenants`, pero esas columnas no estan garantizadas por migraciones inspeccionadas.
- Modelo real del codigo: plan efectivo se infiere desde billing (`active` -> `pro`, trial -> `basic`/trial access, billingExempt -> `scale`) y se cruza con `PLAN_REGISTRY`.
- Riesgo Supabase: si T19 crea tablas nuevas en `public`, por cambios recientes de Data API/grants debe definir RLS/grants explicitamente; evitar migracion si no es necesaria.

## 8. Codigo real relacionado

- `apps/api/src/services/tenant-capabilities.ts`: define `MODULE_REGISTRY`, `PLAN_REGISTRY`, plan efectivo y `access_status`.
- `apps/api/src/middleware/tenantBilling.ts`: gate de billing con `402`.
- `apps/api/src/services/tenant-billing.ts`: resumen billing/trial por tenant.
- `apps/api/src/services/billing-adapter.ts`: compatibilidad `legacy|mixed|tenants` para status.
- `apps/api/src/services/billing.ts`: MercadoPago checkout/webhook; referencia solamente, no tocar pagos reales.
- `apps/api/src/controllers/sucursales.ts`: enforcement parcial de limite `sucursales`.
- `apps/api/src/controllers/users.ts`: alta de usuarios sin enforcement de limite.
- `apps/api/src/controllers/security.ts`: enforcement parcial de limite `users`.
- `apps/api/src/controllers/admin.ts` y `apps/api/src/services/platform-admin.ts`: base T17 para endpoints admin con `supportReason`.
- Rutas relevantes: `orders.ts`, `requests.ts`, `users.ts`, `security.ts`, `sucursales.ts`, `auth.ts`, `public.ts`, `billing.ts`.

## 9. Problemas que T19 debe resolver

- Plan canonico `plans`/`tenants.plan_id` no existe fisicamente; runtime usa `PLAN_REGISTRY`.
- Limites estan dispersos en controllers y no son consistentes.
- Falta endpoint admin para leer planes y posiblemente cambiar plan si se autoriza.
- T17 solo permite `billing_exempt`; no toca plan ni `subscription_status`.
- Debe evitar bloquear o mutar tenant maestro.
- Debe evitar pagos reales, MercadoPago, refunds y caja.
- Trial/billing status vive mezclado entre `tenants.trial_expires_at`, `tenants.billing_exempt` y `organizations.subscription_status`.
- `billing-adapter` en modo `mixed/tenants` puede consultar columnas no garantizadas.
- Enforcement `402` para billing y `403` para limite/modulo debe ser consistente.
- Falta aplicar `users` limit en `/users/invite`.
- Falta aplicar `monthly_orders` en crear orden y convertir request.
- Falta aplicar `storage_mb` en attachments/assets.
- Falta decidir si `whatsapp_templates` y `document_templates` se implementan ahora o quedan fuera por no existir endpoint de templates completo.

## 10. Opciones tecnicas

### Opcion minima

Backend-only, sin migracion, usando `PLAN_REGISTRY` como source of truth.

- Ventajas: menor riesgo, no toca schema, respeta repo actual, evita mismatch fisico inmediato.
- Riesgos: no persiste plan canonico real; plan sigue inferido por billing; concurrencia de conteo puede seguir siendo riesgo si no hay RPC/counter.
- Requiere SQL: no.
- Toca frontend: no.
- Toca backend: si, servicios/middleware/controllers.
- Dominios sensibles: no pagos reales; solo lectura de billing/capabilities y validaciones.

### Opcion completa

SQL aditivo/controlado para persistir plan o consumo si GPT-5.5 decide que es imprescindible.

- Ventajas: resuelve plan/counter atomico de forma durable; habilita auditoria y soporte mas robustos.
- Riesgos: requiere migracion, RLS/grants, rollback, y cuidado con Supabase Data API; puede desalinearse con billing legacy.
- Requiere SQL: si.
- Toca frontend: no obligatorio.
- Toca backend: si.
- Dominios sensibles: toca schema billing/capabilities; prohibido tocar pagos/MercadoPago.

### Opcion no recomendada

Rehacer billing completo, MercadoPago o planes desde cero.

- Ventajas: podria alinear canonicamente todo, pero es demasiado grande.
- Riesgos: alto riesgo de romper cobros, trial, checkout, webhook y tenants activos.
- Requiere SQL: si.
- Toca frontend: probablemente.
- Toca backend: si.
- Dominios sensibles: pagos reales, MercadoPago, caja/billing; no recomendado para T19 MVP.

## 11. Reglas de seguridad

- No pagos reales.
- No MercadoPago.
- No refunds.
- No caja.
- No inventario.
- No WhatsApp real.
- No mutar tenant maestro.
- Cambios admin requieren `supportReason` y `supportTicketId` opcional.
- Auditoria T04/T17 para cambios de soporte.
- No exponer secretos, tokens, service role keys ni payloads sensibles.
- No ejecutar `supabase db push`.
- No romper T16 smoke.
- Backend es autoridad; frontend no cuenta como enforcement.
- Si se crean tablas en `public`, exigir RLS/grants explicitos y rollback.

## 12. Endpoints candidatos

MVP candidatos:

- `GET /api/:tenantSlug/billing/capabilities`: lectura plan/capabilities ya derivada, si no existe contrato suficiente.
- `GET /api/admin/plans`: listar `PLAN_REGISTRY` para soporte interno.
- `GET /api/admin/tenants/:tenantId/limits`: diagnostico de uso vs limites.
- `POST /api/admin/tenants/:tenantId/limits/validate`: diagnostico sin mutacion.

Posible si GPT-5.5 lo autoriza:

- `PATCH /api/admin/tenants/:tenantId/plan`: cambio administrativo de plan con `supportReason`, solo si hay columna/modelo real decidido.

Dejar fuera del MVP:

- Checkout real.
- Webhook MercadoPago.
- Upgrade self-service.
- UI frontend.
- Plantillas WhatsApp/documentos si no hay endpoint real de templates.

## 13. Validaciones necesarias

- `pnpm --dir apps/api typecheck`.
- `bash docs/implementation-bundles/T19/verify.sh` si GPT-5.5 lo solicita.
- Prueba estatica de no tocar `apps/web-*`, pagos reales, MercadoPago, caja, inventario, WhatsApp.
- Confirmar no migracion si se elige opcion minima.
- Confirmar no cambios en `package.json` ni `pnpm-lock.yaml`.
- T16 smoke debe seguir compatible.
- Verificar rutas alternativas: `/users/invite` y `/security/users/invite`.
- Validar respuestas: billing bloqueado `402`; limite excedido `403`.

## 14. Riesgos reales

- Mismatch fuerte entre canonico `plans` y fisico/runtime `PLAN_REGISTRY`.
- `billing-adapter` puede leer columnas no garantizadas si se cambia `BILLING_ADAPTER_MODE`.
- Conteos no atomicos pueden permitir doble alta concurrente.
- Aplicar limites de ordenes/storage sin compensacion puede bloquear falsos positivos.
- Tocar MercadoPago podria afectar cobros reales.
- Crear tablas publicas sin RLS/grants puede romper Supabase Data API o exponer datos.
- Tenant maestro debe quedar protegido contra bloqueo o downgrade.
- Public routes crean/leen datos y requieren decision explicita de enforcement.
- Frontend puede ocultar modulos, pero no protege backend.

## 15. Preguntas para GPT-5.5

1. ¿T19 MVP debe usar `PLAN_REGISTRY` como fuente oficial temporal o crear `plans`/`plan_id` fisicos?
2. ¿Se autoriza migracion para counters atomicos, o T19 debe quedarse sin SQL y limitarse a conteos live?
3. ¿Se autoriza endpoint admin para cambiar plan, o solo lectura/diagnostico de limites?
4. ¿`monthly_orders` y `storage_mb` entran en MVP o se dejan como diagnostico por falta de counters?
5. ¿Rutas publicas que crean recursos deben aplicar billing/limits en T19 o quedan fuera por seguridad/UX?

## 16. Lo que GPT-5.5 debe devolver

- T19 WORKPACK cerrado.
- Decision de alcance: minimo sin SQL vs SQL aditivo.
- Archivos autorizados exactos.
- SQL exacto si aplica, con RLS/grants/rollback.
- Endpoints exactos.
- Contratos request/response.
- Permisos y roles.
- Reglas de auditoria T04/T17.
- Validaciones y verify script.
- Rollback.
- Criterios de aceptacion.

## 17. Recomendacion del recolector

Recomendacion conservadora: implementar T19 MVP backend-only sin migracion inicialmente, usando `PLAN_REGISTRY` como source of truth oficial temporal, cerrar los huecos evidentes (`/users/invite`, diagnostico admin, contrato de error 403) y no tocar pagos reales. Si GPT-5.5 exige concurrencia fuerte para `monthly_orders`/`storage_mb`, entonces autorizar una migracion aditiva pequena para counters/idempotencia con RLS/grants explicitos; no rehacer billing ni MercadoPago.
