# Spec 04 — Plataforma y Madurez

Fuente canónica:

- `docs/canonical/especificacion_aprobada.md`
- `docs/canonical/spec_00_modelo_datos_maestro.md`
- `docs/canonical/index_documentacion_canonica.md`

## Compatibilidad con Canonical

- **Tablas canónicas usadas:** `tenants`, `plans`, `users`, `audit_logs`, `repair_orders`, `quotations`, `payments`.
- **Cambios de esquema propuestos:**
  - `timesheets` / `commissions`: Para registro puntual de inicio/pausa de trabajo técnico y cálculos de comisiones (T14). Impacto: Medio-Bajo.
- **Dependencias:** Specs 01, 02, 03.
- **Decisiones abiertas:** Ninguna. Se asume estricto seguimiento del canónico. T04 ya está cerrado y aprobado.

---

## Nota sobre T04 (Auditoría Crítica)

T04 (Auditoría crítica inmutable) **está aprobado para producción temprana, implementado y rige sobre cualquier flujo operativo.** No se modifica en esta especificación.

## T14 — Tiempos, Productividad Y Comisiones

### Objetivo Técnico

Medir tiempos reales de trabajo técnico por orden.

### Tablas Utilizadas

- `repair_orders`
- `users`
- `audit_logs`

### Contratos Del Sistema

- *CAMBIO DE ESQUEMA PROPUESTO:* Tablas explícitas para logs de tiempos (ej. `timesheets`) y para reglas de comisiones.
- Provisionalmente se utilizan estimaciones basadas en tiempos de transición de estados de `repair_orders` (ej. de `in_repair` a `repair_completed`).

## T15 — Reportes Operativos Confiables

### Objetivo Técnico

Agregación de datos y dashboards sin impactar base de datos operativa.

### Tablas Utilizadas

- `repair_orders`
- `payments`
- `parts`
- `stock_movements`

### Contratos Del Sistema

- Las vistas agregadas o dashboards leen exclusivamente usando la terminología física canónica (ej. agrupar por `repair_orders.status` restringido a los 9 estados base).

## T16 — Pruebas E2E De Flujos Críticos

### Objetivo Técnico

Garantizar que no haya regresiones en los flujos principales (recepción, caja, portal).

### Contratos Del Sistema

- Las pruebas se construyen emulando estrictamente el ciclo de vida canónico y respetando la nomenclatura `repair_orders`.

## T17 — Backoffice Interno FIXI

### Objetivo Técnico

Gestión administrativa global por parte del equipo Fixi (super-admins).

### Tablas Utilizadas

- `tenants`
- `plans`
- `audit_logs`

### Contratos Del Sistema

- Acceso con auditoría dura obligatoria (T04) marcando `is_support_action = true` en el log de auditoría.

## T18 — Observabilidad y Alertas

### Objetivo Técnico

Capturar y reaccionar a excepciones y anomalías (ej. caja desbalanceada).

### Contratos Del Sistema

- Independiente del modelo de datos de dominio. Integra métricas del clúster y APM.

## T19 — Límites De Plan Y Billing Enforcement

### Objetivo Técnico

Asegurar que los inquilinos (tenants) respeten los límites de su suscripción.

### Tablas Utilizadas

- `tenants` (campo `plan_id`)
- `plans`

### Contratos Del Sistema

- Cada creación de recurso valida contra los límites del `plans` asociado al `tenant`.

## T20 — Exportación/Importación De Datos Por Tenant

### Objetivo Técnico

Portabilidad segura.

### Contratos Del Sistema

- La exportación debe recorrer íntegramente las tablas respetando la política RLS del tenant para evitar mezcla de datos.
