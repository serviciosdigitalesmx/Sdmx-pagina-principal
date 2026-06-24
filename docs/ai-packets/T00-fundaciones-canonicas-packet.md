# T00 PACKET — FUNDACIONES CANÓNICAS

## 1. Objetivo

La documentación canónica exige cerrar Fundaciones antes de seguir con T01, T03, T02, T05, T06, T07 y T08. El repo actual todavía opera sobre una base física anterior con `service_orders`, `service_requests`, `users.tenant_id` y modelos de sucursal/rol más antiguos, así que seguir con T07 sin cerrar Fundaciones elevaría el riesgo de construir inventario sobre una frontera de datos que todavía no coincide con la fuente de verdad.

Además, la matriz de dependencias canónica ubica a Fundaciones como requisito de todo el ecosistema operativo. Si el modelo base no queda alineado primero, inventario, cliente, reportes, facturación y exportación terminan apoyándose en contratos frágiles o inconsistentes.

## 2. Estado Git

`git status --short --branch`

```text
## main...origin/main
```

`git log --oneline -8`

```text
5912caf chore: add supabase cli dependency
6935a29 feat(t02): add consent and evidence visibility controls
343b0bb feat(t06): add order payment refunds
327c375 feat(t05): register order payments
0c7fef5 feat(t03): enforce configurable serial number
9afcada feat(t01): enforce legal intake checklist
62d9c78 docs: finalize Fixi implementation decisions
67b8e4f docs: add technical design and repo reality for T17 to T20
```

## 3. Source of Truth Documental

- [docs/README.md](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/docs/README.md): fija que `docs/canonical/especificacion_aprobada.md` y `docs/canonical/spec_00_modelo_datos_maestro.md` son el Source of Truth, y que T01/T03/T02 deben abrir la implementación.
- [docs/canonical/index_documentacion_canonica.md](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/docs/canonical/index_documentacion_canonica.md): declara obsoletos los borradores previos y marca `especificacion_aprobada.md` y `spec_00_modelo_datos_maestro.md` como documentos aprobados y vigentes.
- [docs/canonical/especificacion_aprobada.md](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/docs/canonical/especificacion_aprobada.md): define el modelo funcional base, incluyendo tenant, sucursal, usuario, cliente, dispositivo, orden, presupuesto y auditoría.
- [docs/canonical/spec_00_modelo_datos_maestro.md](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/docs/canonical/spec_00_modelo_datos_maestro.md): define las tablas fundacionales y sus contratos físicos; además dice explícitamente que `users` es la única tabla operativa sin `tenant_id` y que el usuario puede pertenecer a varios tenants vía `tenant_memberships`.
- [docs/specs/implementation_order.md](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/docs/specs/implementation_order.md): ordena Fundaciones primero y luego T01, T03, T02; además ubica T07 y T08 después de T05/T06.
- [docs/specs/dependencies.md](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/docs/specs/dependencies.md): confirma que T07 depende de Fundaciones y desbloquea T08.
- [docs/specs/spec_01_fundaciones.md](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/docs/specs/spec_01_fundaciones.md): reconoce la brecha entre el canónico y el repo, y todavía describe una compatibilidad parcial con `service_orders`/`service_requests`.
- [docs/specs/spec_02_recepcion_finanzas.md](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/docs/specs/spec_02_recepcion_finanzas.md): confirma que T01/T02/T03 presuponen Fundaciones y que `service_orders.evidence_metadata` queda solo como puente legacy.
- [docs/specs/spec_03_inventario_cliente.md](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/docs/specs/spec_03_inventario_cliente.md): ubica T07/T08 después de Fundaciones y Recepción/Finanzas.
- [docs/specs/spec_04_plataforma.md](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/docs/specs/spec_04_plataforma.md): deja T14-T20 apoyados en la base canónica y en T04.

## 4. Modelo Canónico Requerido

Extraído de [docs/canonical/spec_00_modelo_datos_maestro.md](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/docs/canonical/spec_00_modelo_datos_maestro.md):

- `tenants`: entidad legal/operativa con `plan_id`, `folio_prefix`, `modules_config`, `reception_config`, `warranty_config`, `evidence_retention_days`, `status`, `timezone`, `currency`.
- `plans`: límites y features de suscripción.
- `branches`: sucursales con `tenant_id`, `status`, `responsible_user_id`, `folio_prefix`, `config`.
- `users`: tabla operativa global sin `tenant_id`.
- `tenant_memberships`: pertenencia múltiple por tenant.
- `user_roles`: roles por tenant y, opcionalmente, por sucursal.
- `customers`: cliente por tenant con consentimiento y estado.
- `device_categories`: categorías de dispositivo con regla de identificador.
- `devices`: historial/identidad del equipo separado de la orden.
- `orders` / `repair_orders`: orden canónica con `branch_id`, `customer_id`, `device_data`, estados y auditoría.
- `audit_logs`: auditoría append-only.

Notas canónicas relevantes:

- `users` no debe llevar `tenant_id` según el modelo maestro.
- El cambio de tenant debe ser explícito.
- La evidencia y la auditoría deben quedar aisladas por tenant.
- El modelo canónico incluye `plans`, mientras que el repo físico actual maneja `billing_exempt`, trial y summary de billing de forma distinta.

## 5. Modelo Físico Actual Del Repo

### 5.1 Evidencia en migraciones

- [supabase/migrations/20260424_baseline_schema.sql](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/supabase/migrations/20260424_baseline_schema.sql): crea `tenants`, `branches`, `users`, `customers`, `service_requests`, `service_orders`, `service_order_checklists`, `service_order_status_history`, `tasks`, `suppliers`, `products`, `branch_inventory`.
- [supabase/migrations/20260523121919_align_orders_suppliers_reports_schema.sql](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/supabase/migrations/20260523121919_align_orders_suppliers_reports_schema.sql): crea/ajusta `finances`, `service_order_checklists`, `customer_payments`.
- [supabase/migrations/20260523190000_order_documents_events.sql](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/supabase/migrations/20260523190000_order_documents_events.sql): crea `service_order_documents` y `service_order_events`.
- [supabase/migrations/20260527050000_tenant_field_definitions_phase2.sql](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/supabase/migrations/20260527050000_tenant_field_definitions_phase2.sql): crea `tenant_field_definitions`.
- [supabase/migrations/20260530132000_security_backoffice_tables.sql](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/supabase/migrations/20260530132000_security_backoffice_tables.sql): crea `audit_logs`.
- [supabase/migrations/20260622001000_t02_consent_evidence_visibility.sql](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/supabase/migrations/20260622001000_t02_consent_evidence_visibility.sql): agrega consentimiento y visibilidad de evidencias.
- [supabase/migrations/20260621090000_add_checklist_legal_fields_to_service_order_checklists.sql](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/supabase/migrations/20260621090000_add_checklist_legal_fields_to_service_order_checklists.sql): agrega campos legales al checklist.
- [supabase/migrations/20260621100000_add_serial_number_field_definitions.sql](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/supabase/migrations/20260621100000_add_serial_number_field_definitions.sql): agrega `serial_number` y su configuración.

### 5.2 Evidencia en controllers, routes, middlewares y services

- [apps/api/src/controllers/orders.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/api/src/controllers/orders.ts): sigue operando sobre `service_orders`, `service_requests`, `service_order_checklists`, `service_order_documents`, `service_order_events`, `customer_payments`, `evidence_metadata`.
- [apps/api/src/controllers/catalogs.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/api/src/controllers/catalogs.ts): actualiza consentimiento del cliente.
- [apps/api/src/controllers/meta.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/api/src/controllers/meta.ts): carga `tenant_field_definitions` y settings del tenant.
- [apps/api/src/controllers/users.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/api/src/controllers/users.ts): trabaja con `users` tenant-scoped, `role`, `sucursal_id`, compatibilidad con `activo`.
- [apps/api/src/controllers/sucursales.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/api/src/controllers/sucursales.ts): opera sobre `sucursales`.
- [apps/api/src/controllers/finance.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/api/src/controllers/finance.ts): usa `finances`, `customer_payments`, `expenses`.
- [apps/api/src/controllers/reports.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/api/src/controllers/reports.ts): agrega por `orders`, `payments`, `parts`, `stock_movements` o equivalentes físicos.
- [apps/api/src/middleware/auth.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/api/src/middleware/auth.ts): resuelve identidad desde claims con `tenant_id`, `role`, `sucursal_id`.
- [apps/api/src/middleware/validateTenant.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/api/src/middleware/validateTenant.ts): valida `tenantSlug` en ruta o token.
- [apps/api/src/middleware/tenantBilling.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/api/src/middleware/tenantBilling.ts): bloquea por estado de billing.
- [apps/api/src/middleware/tenantCapabilities.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/api/src/middleware/tenantCapabilities.ts): expone módulos, plan y estado de acceso.
- [apps/api/src/services/evidence-adapter.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/api/src/services/evidence-adapter.ts): mantiene modo legacy sobre `service_orders.evidence_metadata` y modo normalizado sobre `service_order_events` y `service_order_documents`.
- [apps/api/src/services/tenant-config.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/api/src/services/tenant-config.ts): genera configuración runtime, módulos y campos.
- [apps/api/src/services/tenant-billing.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/api/src/services/tenant-billing.ts): deriva estado de billing.
- [apps/api/src/services/FinanceService.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/api/src/services/FinanceService.ts): consulta `finances`.
- [apps/api/src/routes/orders.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/api/src/routes/orders.ts): expone checklist, evidencias, estado, detalles, finanzas y warranty.
- [apps/api/src/routes/customers.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/api/src/routes/customers.ts): expone consentimiento e historial.
- [apps/api/src/routes/sucursales.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/api/src/routes/sucursales.ts): expone CRUD de sucursales.
- [apps/api/src/routes/users.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/api/src/routes/users.ts): expone CRUD y roles de usuario.
- [apps/api/src/routes/finance.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/api/src/routes/finance.ts): expone balance, cashflow y expenses.
- [apps/api/src/routes/billing.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/api/src/routes/billing.ts): expone checkout y webhook.
- [apps/web-admin/src/services/apiGateway.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/web-admin/src/services/apiGateway.ts): sigue consumiendo `customers`, `sucursales`, `users`, `billing` y otras rutas del contrato actual.
- [apps/web-clientes/src/lib/api/orders.ts](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/web-clientes/src/lib/api/orders.ts): consume portal público por `tenantSlug` y folio.
- [apps/web-clientes/src/lib/portal/portal-view.tsx](/Users/usuario/Documents/New%20project%2038/Sdmx-pagina-principal1/apps/web-clientes/src/lib/portal/portal-view.tsx): renderiza portal, evidencias y seguimiento.

## 6. Brechas Detectadas

| Canónico requerido | Físico actual | Impacto | Bloquea T07 | Bloquea T09/T10/T12/T14/T15/T17/T19/T20 |
|---|---|---|---|---|
| `users` global sin `tenant_id` | `users` sigue tenant-scoped con `tenant_id` y `role` directo | La identidad multi-tenant canónica no existe todavía | Sí, indirectamente | Sí, porque todo acceso y permisos se apoyan en esta base |
| `tenant_memberships` | No existe | El cambio explícito de tenant por pertenencia no está modelado | Sí | Sí |
| `user_roles` | No existe como tabla canónica; hay `role` en `users` y compatibilidad legacy | Los permisos granulares por sucursal/tenant quedan acoplados a una tabla antigua | Sí | Sí |
| `repair_orders` | No existe con ese nombre; el repo usa `service_orders` | El contrato canónico de órdenes no coincide con el físico | Sí | Sí |
| `devices` | No existe; el dispositivo vive inline en `service_orders` / `service_requests` | T09/T10 y futuras consultas por dispositivo quedan atadas a una forma provisional | No de forma inmediata | Sí, especialmente T09, T10, T12, T14, T15 |
| `plans` como tabla canónica | No aparece como tabla física aquí; el billing se resuelve con `billing_exempt`, trial y adapters | T17/T19 quedan apoyados en otra fuente | No directamente | Sí, en particular T17 y T19 |
| `audit_logs` canónica append-only | Sí existe, pero la capa de auditoría convive con triggers y escrituras legacy | Riesgo de doble contabilización o divergencia con T04 | No de inmediato | Sí, por T04 y cualquier ticket de escritura |
| `branches` canónica | Existe `branches`, pero el repo también usa `sucursales` y migraciones de compatibilidad | Contrato ambiguo de sucursal | Sí | Sí |
| `service_order_documents` / `service_order_events` como fuente primaria | Sí existen | Menor brecha, pero conviven con `evidence_metadata` legacy | No | Sí para T12/T15 si no se consolida |
| `tenant_field_definitions` | Sí existe | Casi alineado, pero todavía ligado a `service_orders`/`service_requests` | No | Sí para T03/T12/T15 si cambia el modelo base |
| `customer_payments`, `expenses`, `finances` | Sí existen | Base financiera parcial ya operativa | No | Sí para T05/T06/T15/T19 |

Observación: la brecha más importante no es “falta de tablas sueltas”, sino que el repositorio todavía mezcla dos contratos: el canónico nuevo y un físico legado que sigue gobernando auth, órdenes y parte del flujo operativo.

## 7. Riesgos De Migrar Fundaciones

- Riesgo de romper login: la autenticación actual depende de claims y de `users` tenant-scoped con `role`/`sucursal_id` legacy.
- Riesgo de romper tenant isolation: una migración mal hecha puede dejar sesiones apuntando a una pertenencia o rol que no existe todavía en el nuevo modelo.
- Riesgo de romper órdenes existentes: `service_orders` y `service_requests` están insertados en múltiples rutas, validaciones y vistas.
- Riesgo de romper portal cliente: el portal público consume `tenantSlug`, `service_orders`, `service_order_documents`, `service_order_events` y `evidence_metadata`.
- Riesgo de romper billing: el gating de acceso usa `billing_exempt`, trial y summary de billing, no `plans` canónico puro.
- Riesgo de romper auditoría T04: `audit_logs` ya tiene políticas y escrituras importantes; cambiar la base sin disciplina puede duplicar o perder trazabilidad.
- Riesgo de romper Supabase migrations ya aplicadas: hay migraciones acumuladas que crean, alteran y compatibilizan tablas antiguas; una migración destructiva podría invalidar el historial.

## 8. Estrategia Posible

### A. Compatibilidad progresiva sin renombrar tablas

- Ventajas: menor riesgo inmediato, preserva producción temprana, permite avanzar por capas.
- Riesgos: mantiene deuda técnica y contrato doble durante más tiempo; puede ocultar inconsistencias.
- Archivos afectados: `supabase/migrations/*`, `apps/api/src/controllers/*`, `apps/api/src/services/*`, `apps/web-admin/src/services/apiGateway.ts`, `apps/web-clientes/src/lib/*`.
- Segura para producción temprana: sí, si se define como transición cerrada y auditable.

### B. Crear vistas/adaptadores canónicos

- Ventajas: permite presentar `repair_orders`, `devices`, `tenant_memberships` y `user_roles` sin destruir el físico actual.
- Riesgos: puede generar falsa sensación de alineación si las vistas no cubren el 100% de los casos.
- Archivos afectados: nuevas migraciones no destructivas, servicios de lectura, adaptadores de backend.
- Segura para producción temprana: sí, es la opción más conservadora si el objetivo es no romper lo existente.

### C. Migración completa a tablas canónicas

- Ventajas: deja una sola fuente de verdad real y simplifica el futuro.
- Riesgos: alto riesgo operativo; requiere secuencia de datos, backfill y doble lectura.
- Archivos afectados: casi todo el backend, migraciones, tipos compartidos, portal y admin.
- Segura para producción temprana: no sin ventana de migración y plan de rollback fuerte.

### D. Mantener físico actual y documentar mapeo oficial

- Ventajas: cero riesgo inmediato de ruptura.
- Riesgos: congela la deuda; no resuelve la divergencia estructural.
- Archivos afectados: sobre todo docs y contratos de lectura.
- Segura para producción temprana: sí, pero solo como contención temporal, no como destino.

## 9. Recomendación Para GPT-5.5

Preguntas máximas para decidir la estrategia final:

1. ¿La prioridad es alinear el modelo canónico ahora o conservar estabilidad operacional con compatibilidad temporal?
2. ¿Se autoriza introducir vistas/adaptadores canónicos antes de tocar tablas físicas?
3. ¿Se autoriza una migración de identidad y permisos hacia `tenant_memberships` y `user_roles` sin cambiar primero todas las rutas?
4. ¿Se autoriza mantener `service_orders` como tabla física puente mientras se introduce `repair_orders` como contrato canónico?
5. ¿Se requiere que Fundaciones quede lista como contrato de lectura primero, o como migración de datos primero?

## 10. Lo Que GPT-5.5 Debe Devolver

- Decisión técnica final entre compatibilidad progresiva, vistas/adaptadores, migración completa o mapeo documental temporal.
- Confirmación de si Fundaciones se implementa como migración real o como capa de compatibilidad.
- Lista exacta de archivos autorizados.
- Lista exacta de migraciones autorizadas.
- Pasos cerrados para Codex Mini.
- Comandos de validación.
- Plan de rollback.

## Evidencia de apoyo

- El repositorio ya tiene commits para T01/T03/T02/T05/T06, pero no una fundación canónica completa.
- El contrato canónico y el físico actual todavía no coinciden en identidad, pertenencia multi-tenant y nombres de orden/dispositivo.
- T07 depende de Fundaciones según la documentación canónica, así que no debería continuar hasta cerrar esta decisión.
