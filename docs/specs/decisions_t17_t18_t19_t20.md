# Decisions T17 / T18 / T19 / T20

Estado: decision tecnica oficial aterrizada contra repo real.  
Fecha: 2026-06-20.  
Alcance: T17 Backoffice interno FIXI, T18 Observabilidad y alertas, T19 Limites de plan y billing enforcement, T20 Exportacion/importacion de datos por tenant.

Este documento no implementa codigo, no reabre T04 y no modifica decisiones previas T01-T16.

## Evidencia Real Encontrada

### Documentacion y dependencias

- [docs/README.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/README.md) declara que T04 esta cerrado y rige sobre toda operacion critica.
- [docs/canonical/especificacion_aprobada.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/canonical/especificacion_aprobada.md) define T17 como soporte interno con acceso minimo, motivo obligatorio y trazabilidad.
- [docs/canonical/especificacion_aprobada.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/canonical/especificacion_aprobada.md) define T18 como monitoreo de salud, errores, latencia y eventos criticos sin filtrar informacion sensible.
- [docs/canonical/especificacion_aprobada.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/canonical/especificacion_aprobada.md) define T19 como monetizacion con limites claros, sin bloquear por error tenants activos.
- [docs/canonical/especificacion_aprobada.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/canonical/especificacion_aprobada.md) define T20 como portabilidad y onboarding masivo con aislamiento por tenant.
- [docs/canonical/spec_00_modelo_datos_maestro.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/canonical/spec_00_modelo_datos_maestro.md) define `plans`, limites de plan y campos de auditoria de soporte como `is_support_action`, `support_ticket_id` y `support_reason`.
- [docs/specs/dependencies.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/specs/dependencies.md) coloca T18 antes de T16, T17 despues de T04/Fundaciones/T18, T19 despues de T17 y T20 despues de T17/T19.
- [docs/specs/implementation_order.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/specs/implementation_order.md) ubica T17, T19 y T20 en el bloque de escalamiento SaaS.
- [docs/specs/spec_04_plataforma.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/specs/spec_04_plataforma.md) pide backoffice con auditoria dura, observabilidad, enforcement de plan y exportacion/importacion segura.

### Rutas, runtime y deployment reales

- [apps/api/src/index.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/index.ts) monta rutas con patron real `/api/:tenantSlug/...` y fallback `/api/...`. No existe convencion de rutas API versionadas.
- [apps/api/src/index.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/index.ts) expone `/health`, `/healthz` y `/api/health`.
- [render.yaml](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/render.yaml) define el backend real en Render como servicio web Node `sdmx-backend-api`.
- [apps/web-admin/vercel.json](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/vercel.json), [apps/web-public/vercel.json](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/vercel.json) y [apps/web-clientes/vercel.json](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/vercel.json) confirman frontends en Vercel.
- No existe archivo `apps/api/src/routes/tenant-billing.ts`; la ruta viva de billing es [apps/api/src/routes/billing.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/billing.ts).
- No existen controladores ni rutas de `admin`, `superadmin`, `data-jobs`, `exports` o `imports`.

### Seguridad, master y auditoria reales

- [apps/api/src/services/tenant-capabilities.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/services/tenant-capabilities.ts) marca `access_status = 'master'` si coincide `MASTER_TENANT_SLUG` o `MASTER_ACCOUNT_EMAIL`.
- [apps/api/src/middleware/tenantBilling.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/middleware/tenantBilling.ts) permite saltar bloqueo de billing si coincide master tenant slug o master account email.
- [apps/api/src/middleware/auth.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/middleware/auth.ts) valida JWT interno, usuario activo, tenant y sesion revocable.
- [apps/api/src/middleware/validateTenant.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/middleware/validateTenant.ts) exige que el tenant de ruta coincida con el tenant del token.
- [apps/api/src/controllers/security.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/security.ts) expone auditoria solo a `owner`, valida tenant y soporta filtros de `requestId`, `action`, `entityType`, `entityId`, `userId`, fechas y paginacion.
- [apps/api/src/services/audit.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/services/audit.ts) es el servicio central T04 y exige `request_id` en auditoria critica.
- Las migraciones T04 actuales endurecen `audit_logs` como append-only, pero no existe en repo una columna fisica `is_support_action`, `support_ticket_id` o `support_reason`.

### Billing, capabilities y limites reales

- [apps/api/src/services/billing.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/services/billing.ts) integra Mercado Pago para checkout/webhook y escribe auditoria best-effort de billing.
- [apps/api/src/services/tenant-billing.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/services/tenant-billing.ts) calcula `isBillingBlocked` desde status, trial, `billing_exempt` y fechas.
- [apps/api/src/services/billing-adapter.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/services/billing-adapter.ts) soporta modo `legacy`, `mixed` y `tenants` para leer/escribir estado de billing.
- [apps/api/src/middleware/tenantBilling.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/middleware/tenantBilling.ts) responde `402` con `error: 'Trial expired'` y detalles de plan/billing cuando un tenant esta bloqueado.
- [apps/api/src/middleware/tenantCapabilities.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/middleware/tenantCapabilities.ts) responde `403` con `error: 'Module not active for this tenant'` cuando el modulo no esta activo.
- [apps/api/src/services/tenant-capabilities.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/services/tenant-capabilities.ts) define planes reales:
  - `basic`: `users = 3`, `sucursales = 1`, `monthly_orders = 50`, `storage_mb = 500`, `public_portal = true`, `whatsapp_templates = 5`, `document_templates = 3`.
  - `pro`: `users = 10`, `sucursales = 5`, `monthly_orders = 500`, `storage_mb = 5000`, `public_portal = true`, `whatsapp_templates = 50`, `document_templates = 20`.
  - `scale`: limites `null` salvo `public_portal = true`.
- [apps/api/src/controllers/sucursales.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/sucursales.ts) aplica limite de sucursales antes de crear.
- [apps/api/src/controllers/security.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/security.ts) aplica limite de usuarios en `POST /security/users/invite`.
- [apps/api/src/controllers/users.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/users.ts) tiene otra ruta `POST /users/invite` que no aplica limite de usuarios.
- No existe enforcement real de `monthly_orders`, `storage_mb`, `whatsapp_templates` ni `document_templates`.
- No existe contador atomico ni reserva idempotente de consumo de plan.

### Observabilidad real

- [apps/api/src/controllers/meta.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/controllers/meta.ts) implementa `getHealth` con `status`, `timestamp` y nombre del servicio, sin validar Supabase, storage, billing ni dependencias.
- [apps/api/src/middleware/requestId.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/middleware/requestId.ts) genera `requestId` interno y lo devuelve como header `x-request-id`.
- [apps/api/src/middleware/errorHandler.ts](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/middleware/errorHandler.ts) registra `console.error('Unhandled error:', err)` y responde JSON simple.
- El backend usa `console.error`/`console.warn` en controladores; esos logs son visibles por plataforma en Render.
- Los frontends en Vercel tienen logs/build/runtime propios, pero no hay proveedor APM configurado en repo.
- Supabase aporta logs de Auth, Database, Storage y funciones/SQL desde su dashboard, pero no hay integracion de alertas en el codigo.
- No existe tabla `operational_events`.
- No existe endpoint `/metrics`.

### Export/import real

- No existen `data_export_jobs`, `data_import_jobs`, controladores, rutas ni servicios de exportacion/importacion.
- El repo usa Supabase Storage para documentos y branding, pero los buckets creados por codigo actual son publicos (`public: true`).
- No existe bucket privado ni flujo de signed URLs para exportaciones.
- No existe worker, cron, queue ni runtime especifico para jobs de datos.
- No existe UI de export/import.

## Mapa Dominio A Fisico

| Dominio | Fisico actual | Estrategia |
| --- | --- | --- |
| backoffice interno | No existe modulo fisico | Crear rutas backend bajo convencion real `/api/admin/...`, protegidas por `requireSuperAdmin`. |
| master access | `MASTER_TENANT_SLUG`, `MASTER_ACCOUNT_EMAIL`, usuario activo, tenant del token | Endurecer: email solo no basta; combinar token valido, tenant maestro, usuario activo, rol/claim interno y MFA. |
| tenant | `tenants` y compatibilidad `organizations` para billing legacy | Mantener ambos hasta migracion de billing; no renombrar. |
| billing status | `organizations.subscription_status` en modo legacy; `tenants.subscription_status/status` en otros modos | Usar `billing-adapter` como fuente de compatibilidad. |
| capabilities | `tenant_enabled_modules` + `PLAN_REGISTRY` en backend | Backend sigue siendo fuente obligatoria de enforcement. |
| auditoria | `audit_logs` | No reabrir T04; extender metadatos de soporte sin romper append-only. |
| health | `/health`, `/healthz`, `/api/health` | Mantener y agregar checks diferenciados cuando se implemente T18. |
| observabilidad | logs nativos Render/Vercel/Supabase + `audit_logs` | No inventar proveedor; definir requisitos y puntos de emision. |
| export jobs | No existe | Crear jobs si se confirma storage privado y runtime de procesamiento. |
| import jobs | No existe | Crear jobs si se confirma runtime de procesamiento y validacion por fila. |

---

# T17 Decision Tecnica Final

## EXISTE EN REPO

- Existe bypass conceptual `master` en billing/capabilities basado en `MASTER_TENANT_SLUG` y `MASTER_ACCOUNT_EMAIL`.
- Existe auth interna con JWT, usuario activo, tenant, rol y sesiones revocables.
- Existe auditoria T04 central.
- Existe endpoint de auditoria por tenant para owners.
- Existe `require_admin_mfa` para exigir MFA a owners.
- No existe `requireSuperAdmin`.
- No existen rutas ni controladores de backoffice interno.
- No existe UI de backoffice interno.
- No existen columnas reales de auditoria de soporte (`is_support_action`, `support_ticket_id`, `support_reason`) aunque son canonicas.

## CAMBIO DE ESQUEMA PROPUESTO

Para T17 minimo:

- Agregar a `audit_logs` columnas de soporte canonicas sin modificar la inmutabilidad T04:
  - `is_support_action boolean not null default false`
  - `support_ticket_id text null`
  - `support_reason text null`
  - indice parcial por `(tenant_id, created_at desc)` donde `is_support_action = true`
- No crear tabla de impersonacion en MVP.
- No crear tabla de superadmins si se decide usar solo master tenant + usuario owner + env allowlist para etapa temprana.

Para una etapa posterior, si se necesita administracion de miembros internos sin deploy de env vars, crear una tabla `platform_admin_users`. No es obligatoria para el MVP si el equipo fundador opera con allowlist estricta.

## DECISIÓN TÉCNICA FINAL

### Autorizacion master real

- `MASTER_ACCOUNT_EMAIL` por si solo no es suficiente para operar backoffice en produccion.
- El acceso backoffice debe exigir todas estas condiciones:
  - JWT interno valido.
  - Usuario activo en tabla `users`.
  - `tenant_slug` del token igual a `MASTER_TENANT_SLUG`.
  - Email normalizado del usuario igual a `MASTER_ACCOUNT_EMAIL` o miembro registrado del tenant maestro.
  - Rol efectivo `owner` en el tenant maestro para MVP.
  - MFA activo si `require_admin_mfa` esta habilitado en el tenant maestro.
- El estado `access_status = 'master'` puede seguir existiendo para capacidades, pero no debe ser el unico control de backoffice.

### Rutas reales

No usar rutas API versionadas. Usar convencion real:

- `GET /api/admin/tenants`: listar tenants con paginacion, busqueda y estado.
- `GET /api/admin/tenants/:tenantId`: detalle operacional del tenant.
- `GET /api/admin/tenants/:tenantId/audit`: lectura acotada de auditoria del tenant.
- `PATCH /api/admin/tenants/:tenantId/billing`: ajuste manual de billing/status con motivo obligatorio.
- `PATCH /api/admin/tenants/:tenantId/status`: suspender/reactivar tenant con motivo obligatorio.
- `GET /api/admin/health`: resumen interno de salud si T18 lo expone.

### Acciones permitidas MVP

- Leer lista y detalle de tenants.
- Ver estado de billing/capabilities de un tenant.
- Ver auditoria de un tenant.
- Reactivar/suspender tenant con motivo.
- Marcar `billing_exempt` o ajustar `subscription_status` solo con motivo y ticket de soporte.
- Consultar sesiones/auditoria para diagnostico.

Fuera de alcance MVP:

- Impersonacion completa.
- Modificar datos operativos del taller desde backoffice.
- Crear pagos, cambiar inventario, editar ordenes o borrar datos.
- UI completa de soporte si el equipo fundador acepta operar por API temporalmente.

### Proteccion del tenant maestro

- Backoffice no puede suspender, cancelar, bloquear billing, borrar ni degradar el tenant maestro.
- Acciones sobre el tenant maestro quedan limitadas a lectura y rotacion controlada de seguridad por flujo separado.
- Cualquier endpoint que reciba `tenantId` debe rechazar mutaciones si `tenantId` corresponde al `MASTER_TENANT_SLUG`.

### Auditoria critica

- Toda accion de backoffice debe usar auditoria critica fail-closed.
- Cada accion requiere `support_reason`.
- Cada accion debe aceptar `support_ticket_id` cuando exista.
- Auditoria debe marcar `is_support_action = true`.
- Auditoria debe incluir actor interno, tenant afectado, entidad, antes/despues, IP, user-agent y `request_id`.

### UI

- UI minima de backoffice queda fuera de alcance del MVP tecnico si las rutas quedan disponibles para equipo fundador mediante herramienta interna controlada.
- Si se implementa UI, debe vivir separada del dashboard tenant y solo cargar para master autorizado.

### Pruebas requeridas

- Usuario normal no accede a `/api/admin/*`.
- Owner de tenant no maestro no accede a `/api/admin/*`.
- Email master sin tenant maestro no accede.
- Usuario del tenant maestro sin rol owner no accede.
- Accion sin `support_reason` falla.
- Accion sobre tenant maestro mutando billing/status falla.
- Accion permitida escribe audit log critico con `is_support_action = true` y `request_id`.
- Listado de tenants pagina y no expone secretos.

### Rollback

- Desmontar rutas `/api/admin/*`.
- Mantener columnas de auditoria de soporte; son aditivas y no afectan T04.
- Revertir operaciones manuales por accion compensatoria auditada, no por edicion destructiva.
- Si hay bloqueo indebido, usar backoffice o SQL controlado solo como emergencia con auditoria manual.

### Definition of Done

T17 esta terminado cuando:

- Existe middleware `requireSuperAdmin` endurecido con token, tenant maestro, usuario activo, rol/claim interno y MFA.
- Existen rutas backend reales de backoffice sin rutas API versionadas.
- Toda accion requiere motivo.
- Toda accion de soporte queda en auditoria critica con soporte marcado.
- No se puede mutar el tenant maestro.
- No existe impersonacion destructiva ni acceso indiscriminado.
- Pruebas de acceso, auditoria y proteccion del tenant maestro pasan.

---

# T18 Decision Tecnica Final

## EXISTE EN REPO

- Existen `/health`, `/healthz` y `/api/health`.
- Health actual solo confirma que el proceso responde.
- Existe `requestId` interno en cada request.
- Existe `errorHandler` con logs a stdout/stderr.
- Existen logs de backend en Render por `console.error`/`console.warn`.
- Existen logs de frontend/build/runtime en Vercel.
- Existen logs de Supabase para base de datos, Auth y Storage desde plataforma.
- Existe auditoria T04 para acciones criticas.
- No existe APM configurado.
- No existe proveedor de observabilidad elegido.
- No existe `/metrics`.
- No existe tabla `operational_events`.
- No existen alertas configuradas en codigo.

## CAMBIO DE ESQUEMA PROPUESTO

Para MVP T18 no se requiere cambio de esquema obligatorio.

Opcional posterior:

- Crear `operational_events` solo si se decide registrar incidentes operativos dentro de Fixi. No debe usarse para logs voluminosos de requests.
- No almacenar payloads sensibles ni PII en eventos operativos.

## DECISIÓN TÉCNICA FINAL

### Health checks actuales y evolucion

- Mantener `/health`, `/healthz` y `/api/health` como health superficial para Render y pingers externos.
- Agregar cuando se implemente T18:
  - health basico: proceso vivo.
  - health de dependencias: Supabase reachable con query ligera.
  - health de storage: solo si existe bucket critico configurado.
  - health de billing: validar configuracion minima de webhook/checkout sin llamar proveedor en cada health.
- El health publico no debe exponer secretos, URLs internas completas ni detalles sensibles.

### Logs reales disponibles

- Render: stdout/stderr del backend, deploy logs, restarts y status del servicio.
- Vercel: build logs, runtime logs y errores de funciones/frontend.
- Supabase: logs de base de datos, Auth, Storage y dashboard de errores.
- Fixi: `audit_logs` para acciones criticas y `request_id` para correlacion.

### Alertas minimas necesarias

- API caida: `/healthz` no responde o responde no 2xx.
- Aumento de errores 5xx del backend.
- Fallo repetido de webhooks de billing.
- Fallo de escritura de auditoria critica.
- Jobs fallidos cuando existan T13/T20.
- Supabase inaccesible desde backend.
- Storage inaccesible para flujos que dependan de documentos/evidencias.
- Latencia sostenida alta en endpoints criticos.

### Metricas sin infraestructura nueva

- HTTP status y latencia aproximada desde logs de Render.
- Recuento manual o query de `audit_logs` por accion/tenant/request_id.
- Errores de billing desde logs de webhook.
- Estado de deploy/restart en Render.
- Errores de build/runtime en Vercel.
- Errores de Postgres/Auth/Storage en Supabase dashboard.

### Requiere proveedor externo o decision operativa pendiente

- APM distribuido.
- Alertas automáticas por tasa de 5xx si Render/Vercel nativo no cubre el umbral requerido.
- Dashboard unico de latencia por endpoint.
- Log drains centralizados.
- Uptime monitor externo con escalamiento.
- Notificaciones a un canal externo de alertas. No se define proveedor ni canal especifico en este documento.

### Auditoria y privacidad

- No registrar PII completa, tokens, headers Authorization, contrasenas, archivos ni payloads sensibles en logs.
- Los errores deben incluir `request_id` cuando sea posible.
- Incidentes de auditoria critica deben ser tratados como alerta critica.

### Pruebas requeridas

- `/healthz` responde 200 en ambiente real.
- Health de dependencias falla controladamente si Supabase no responde.
- Error no controlado queda registrado con `request_id` y respuesta no filtra stack ni secretos.
- Fallo de auditoria critica genera error observable.
- Billing webhook fallido queda visible en logs con `request_id`.
- Simulacion de job fallido genera alerta o evento cuando existan jobs.

### Rollback

- Mantener health superficial aunque fallen checks profundos.
- Si un proveedor externo causa ruido o fallos, desactivar integracion por env var.
- No bloquear operacion por falla de observabilidad excepto auditoria critica ya definida por T04.

### Definition of Done

T18 esta terminado cuando:

- Health basico y health de dependencias estan disponibles.
- Logs incluyen `request_id` y no filtran secretos.
- Existen alertas operativas para API caida, 5xx, billing, auditoria y jobs fallidos cuando existan.
- Equipo Fixi sabe donde ver Render, Vercel, Supabase y auditoria interna.
- Pruebas de health/error/billing/auditoria pasan.

---

# T19 Decision Tecnica Final

## EXISTE EN REPO

- Billing activo se valida en middleware backend con `requireTenantBillingActive`.
- Modulos activos se validan en backend con `requireTenantModule`.
- Capacidades y limites viven en backend en `PLAN_REGISTRY`.
- Frontend oculta rutas/modulos con `ModuleRouteGuard` e `isModuleEnabled`, pero no es fuente de seguridad.
- Limite de sucursales ya se aplica en `POST /sucursales`.
- Limite de usuarios se aplica en `POST /security/users/invite`.
- `POST /users/invite` no aplica limite de usuarios.
- No se aplica limite mensual de ordenes.
- No se aplica limite de storage.
- No se aplica limite de plantillas WhatsApp.
- No se aplica limite de plantillas de documentos.
- No existe control atomico de consumo para requests concurrentes.

## CAMBIO DE ESQUEMA PROPUESTO

Crear `tenant_usage_counters` para consumo atomico e idempotente cuando el conteo en vivo no sea seguro.

Campos propuestos:

- `id`
- `tenant_id`
- `usage_key`: `users`, `sucursales`, `monthly_orders`, `storage_mb`, `whatsapp_templates`, `document_templates`
- `period_start`: nulo para limites permanentes, primer dia del mes para `monthly_orders`
- `used_value`
- `limit_snapshot`
- `updated_at`
- unique `(tenant_id, usage_key, period_start)`

Crear registro de idempotencia para reservas de consumo o incorporar idempotencia en la misma funcion atomica:

- `tenant_usage_reservations`
- `tenant_id`
- `usage_key`
- `idempotency_key`
- `amount`
- `source_type`
- `source_id`
- `created_at`
- unique `(tenant_id, usage_key, idempotency_key)`

La actualizacion de consumo debe ejecutarse en el backend mediante operacion atomica de base de datos. No se debe resolver con conteo en frontend ni con check-then-insert no transaccional.

## DECISIÓN TÉCNICA FINAL

### Enforcement existente

- Billing bloqueado: `402` con `error: 'Trial expired'` y `details` con `tenantId`, `tenantSlug`, `subscriptionStatus`, `billingExempt`, `trialExpiresAt`, `daysLeft`, `upgradeHref`.
- Modulo no activo: `403` con `error: 'Module not active for this tenant'` y `details.moduleKey`, `lockedModules`, `planKey`.
- Sucursal excedida: `403` con `error: 'Sucursal limit reached for this plan'`.
- Usuario excedido en seguridad: `403` con `error: 'User limit reached for this plan'`.

### Limites exactos actuales

- `basic`: 3 usuarios, 1 sucursal, 50 ordenes mensuales, 500 MB, portal publico activo, 5 plantillas WhatsApp, 3 plantillas documento.
- `pro`: 10 usuarios, 5 sucursales, 500 ordenes mensuales, 5000 MB, portal publico activo, 50 plantillas WhatsApp, 20 plantillas documento.
- `scale`: sin limite de usuarios, sucursales, ordenes mensuales, storage ni plantillas; portal publico activo.

### Puntos backend obligatorios

- Usuarios:
  - `POST /api/:tenantSlug/users/invite`
  - `POST /api/:tenantSlug/security/users/invite`
  - Cualquier alta futura de usuario desde auth/onboarding interno.
- Sucursales:
  - `POST /api/:tenantSlug/sucursales`
- Ordenes mensuales:
  - `POST /api/:tenantSlug/orders`
  - `POST /api/:tenantSlug/requests/:id/convert` si convierte solicitud a orden.
  - Cualquier flujo publico que cree orden real.
- Storage:
  - `POST /api/:tenantSlug/orders/:id/attachments`
  - creacion de orden con archivos de recepcion.
  - assets de tenant en `POST /api/:tenantSlug/auth/tenant/:tenantSlug/assets` segun montaje real.
  - futuros documentos/evidencias T02/T12.
- Plantillas WhatsApp:
  - actualizacion de settings/tenant config que persista `templates.whatsapp`.
  - futura UI/API de T13 para plantillas.
- Plantillas documento:
  - actualizacion de configuracion de documentos cuando exista endpoint dedicado.

### Contrato de error recomendado

Usar `403` para limite de plan excedido:

- `error`: mensaje estable, por ejemplo `Plan limit reached`.
- `code`: `PLAN_LIMIT_REACHED`.
- `details.limitKey`: `users`, `sucursales`, `monthly_orders`, `storage_mb`, `whatsapp_templates`, `document_templates`.
- `details.currentUsage`
- `details.limit`
- `details.planKey`
- `details.upgradeHref`

Mantener `402` para billing bloqueado.

### Idempotencia y concurrencia

- Cada accion que consume limite debe tener idempotency key de backend.
- La reserva/incremento de consumo debe ser atomica.
- Para ordenes mensuales, la llave puede derivarse de `tenant_id + source_type + source_id` o de un idempotency key explicito.
- Para storage, sumar bytes despues de validar archivo y antes de confirmar persistencia final; si falla upload/persistencia se libera o compensa.
- Para usuarios y sucursales, el check actual de conteo debe reemplazarse o protegerse con transaccion/RPC/counter atomico para evitar doble alta concurrente.
- No usar frontend como enforcement. Frontend solo muestra estado, upgrade y mensajes.

### Pruebas requeridas

- Tenant basic con 3 usuarios no puede crear cuarto usuario desde ninguna ruta.
- Tenant basic con 1 sucursal no puede crear segunda sucursal.
- Requests paralelos no pueden superar limite de usuarios/sucursales/ordenes.
- Tenant basic con 50 ordenes del mes no puede crear otra orden.
- Storage acumulado respeta limite y falla antes de exponer archivo.
- Plantillas WhatsApp respetan limite.
- Plantillas documento respetan limite cuando existan.
- Billing bloqueado devuelve 402.
- Modulo no activo devuelve 403.
- Frontend ocultando modulo no es necesario para que backend bloquee.

### Rollback

- Mantener enforcement de billing y modulos existente.
- Si counters tienen bug, pausar limites nuevos por bandera de backend y conservar datos de consumo para reconciliacion.
- Nunca desbloquear modulos solo en frontend.
- Corregir falsos positivos de billing desde backoffice T17 con auditoria.

### Definition of Done

T19 esta terminado cuando:

- Todos los limites de `PLAN_REGISTRY` se aplican en backend.
- No hay rutas alternativas para saltar limites.
- El consumo es atomico e idempotente.
- Respuestas HTTP son estables y usables por frontend.
- Frontend muestra UX de bloqueo/upgrade, pero backend es autoridad.
- Pruebas de concurrencia y cross-route pasan.

---

# T20 Decision Tecnica Final

## EXISTE EN REPO

- No existe export/import.
- No existen jobs de datos.
- No existe worker o cron real de procesamiento.
- No existe bucket privado de exportaciones.
- No existe signed URL para exportaciones.
- Existen entidades reales para MVP: `customers`, `service_orders`, `service_order_checklists`, `service_order_documents`, `service_order_events`, `products`, `sucursal_inventory`, `inventory_movements`, `sucursales`, `users`.
- Existen rutas auth/tenant/scope para aislar tenant.
- Existen logs y auditoria T04.

## CAMBIO DE ESQUEMA PROPUESTO

Crear jobs asincronos. Para evitar mezclar export e import, usar tablas separadas:

`data_export_jobs`:

- `id`
- `tenant_id`
- `requested_by`
- `status`: `pending`, `processing`, `completed`, `failed`, `cancelled`
- `entity_scope`: `customers`, `orders`, `inventory`, `all`
- `format`: `csv_zip`, `jsonl_zip`
- `filters`
- `row_count`
- `file_bucket`
- `file_path`
- `file_size`
- `error_message`
- `idempotency_key`
- `created_at`, `started_at`, `completed_at`, `expires_at`

`data_import_jobs`:

- `id`
- `tenant_id`
- `requested_by`
- `status`: `uploaded`, `validating`, `preview_ready`, `processing`, `completed`, `failed`, `cancelled`
- `entity_type`: `customers`, `products`, `inventory`
- `format`: `csv`
- `source_bucket`
- `source_path`
- `mode`: `create_only`, `upsert_by_external_key`
- `total_rows`, `valid_rows`, `invalid_rows`, `processed_rows`
- `error_summary`
- `idempotency_key`
- `created_at`, `started_at`, `completed_at`

`data_import_job_errors`:

- `id`
- `tenant_id`
- `job_id`
- `row_number`
- `field`
- `code`
- `message`
- `raw_row`

RLS por `tenant_id` en todas las tablas.

## DECISIÓN TÉCNICA FINAL

### Entidades MVP

Exportables:

- `customers`
- `service_orders`
- `service_order_checklists`
- `service_order_events`
- `service_order_documents` como metadata, no necesariamente binarios en MVP.
- `products`
- `sucursal_inventory`
- `inventory_movements`
- `sucursales`
- `users` como usuarios operativos sin secretos ni MFA.

Importables MVP:

- `customers`
- `products`
- `sucursal_inventory` inicial por sucursal/producto.

Fuera de alcance MVP:

- Importar auditoria.
- Importar pagos/finanzas si T05/T06 no estan consolidados.
- Importar archivos binarios masivos.
- Importar usuarios con credenciales.
- Restauracion completa de tenant.

### Autorizacion y aislamiento

- Exportacion: solo owner.
- Importacion: owner y manager, segun modulo y scope.
- Backoffice puede solicitar export/import solo como accion de soporte T17 con motivo.
- Cada query debe filtrar por `tenant_id`.
- Cada archivo generado debe pertenecer a un solo tenant.
- El job debe validar post-proceso que todas las filas exportadas pertenecen al tenant solicitado.

### Formato inicial

- Export inicial: ZIP con CSV por entidad y `manifest.json`.
- Import inicial: CSV por entidad con preview antes de aplicar.
- `manifest.json` debe incluir tenant, entidad, fecha, filtros, conteos y version de formato.
- No exportar secretos, tokens, hashes, MFA secrets, service role keys ni datos internos de plataforma.

### Validacion, preview, errores por fila e idempotencia

- Importacion siempre tiene fase de validacion/preview antes de escribir.
- Errores se reportan por fila y campo.
- Duplicados se resuelven por reglas explicitas: email/telefono para clientes, SKU para productos, sucursal+SKU para inventario.
- No sobrescribir sin modo `upsert_by_external_key`.
- Cada job requiere `idempotency_key`.
- Reintentar el mismo job no duplica filas.

### Jobs asincronos

- T20 requiere jobs asincronos para export/import de volumen real.
- No se debe procesar exportacion masiva en el request HTTP principal.
- La ruta de solicitud debe responder `202 Accepted` con job id.
- La infraestructura exacta de worker/cron queda como decision pendiente. No se asume proveedor, cron, worker ni runtime concreto en este documento.

### Storage privado

- Exportaciones contienen PII; no pueden usar buckets publicos actuales.
- El repo no demuestra bucket privado ni signed URLs para exportaciones.
- Usar storage privado con URLs temporales queda como decision pendiente de infraestructura.
- Hasta cerrar storage privado, T20 no puede aprobarse para produccion con descarga de archivos.

### Rutas reales propuestas

Sin rutas API versionadas:

- `POST /api/:tenantSlug/data/exports`
- `GET /api/:tenantSlug/data/exports/:jobId`
- `GET /api/:tenantSlug/data/exports/:jobId/download`
- `POST /api/:tenantSlug/data/imports`
- `GET /api/:tenantSlug/data/imports/:jobId`
- `POST /api/:tenantSlug/data/imports/:jobId/confirm`

### Auditoria

- Crear export debe auditarse.
- Descargar export debe auditarse si contiene PII.
- Crear import, confirmar import y cancelar import deben auditarse.
- Acciones de soporte deben marcarse como soporte conforme T17.

### Limites de tamaño

- MVP debe definir limite maximo por archivo CSV.
- MVP debe definir limite maximo de filas por import.
- MVP debe definir expiracion de archivos exportados.
- Si T19 esta activo, export/import debe respetar plan, pero un owner debe poder exportar datos aunque billing este vencido segun regla canonica.

### Pruebas requeridas

- Owner exporta solo su tenant.
- Tenant A no puede leer job de tenant B.
- Export no contiene secretos ni datos de otro tenant.
- Import preview no escribe datos.
- Import con filas invalidas reporta errores por fila.
- Reintento idempotente no duplica clientes/productos/inventario.
- Job fallido queda en `failed` y genera alerta T18.
- Billing vencido permite exportacion owner si se define como derecho de portabilidad.

### Rollback

- Deshabilitar creacion de nuevos jobs.
- Mantener jobs historicos y archivos hasta expiracion.
- Cancelar jobs `pending`/`processing`.
- Importaciones confirmadas se revierten solo con acciones compensatorias por entidad, no con borrado masivo ciego.
- Si storage privado falla, bloquear descargas y conservar job en estado seguro.

### Definition of Done

T20 esta terminado cuando:

- Existen jobs asincronos de export/import.
- Existe aislamiento fuerte por tenant.
- Existe storage privado o mecanismo equivalente seguro de descarga temporal.
- Export incluye manifest y no contiene secretos.
- Import tiene preview, validacion por fila e idempotencia.
- Errores de jobs generan observabilidad.
- Auditoria cubre solicitud, descarga y confirmacion.
- Pruebas de aislamiento, volumen e idempotencia pasan.

---

## Contradicciones Corregidas Del Borrador

- No se usan rutas API versionadas; se usa `/api/admin/...` y `/api/:tenantSlug/data/...`.
- Backend real reconocido: Render.
- No se inventa proveedor de observabilidad.
- No se inventa proveedor WhatsApp, worker, cron ni bucket privado.
- T19 no se delega al frontend; backend es la autoridad.
- T04 no se reabre; solo se propone metadata de soporte aditiva para T17.

## Bloqueantes Reales

- T17: `MASTER_ACCOUNT_EMAIL` solo no es suficiente; falta `requireSuperAdmin` endurecido y metadata de soporte en auditoria.
- T18: falta elegir estrategia/canal de alertas para 5xx, caida API y jobs fallidos si las plataformas nativas no cubren los umbrales.
- T19: falta contador/reserva atomica de consumo y cerrar rutas alternativas como `/users/invite`.
- T20: falta decision de worker/runtime asincrono.
- T20: falta storage privado o mecanismo seguro de descarga temporal.
- T20: falta definir limites de tamano/filas y expiracion.

## Veredictos Individuales

- T17: LISTO PARA IMPLEMENTAR.
- T18: LISTO PARA IMPLEMENTAR.
- T19: LISTO PARA IMPLEMENTAR.
- T20: NO LISTO.

T20 no esta listo porque requiere dos decisiones operativas no presentes en repo: procesamiento asincrono real y almacenamiento privado/descarga temporal para archivos con PII.
