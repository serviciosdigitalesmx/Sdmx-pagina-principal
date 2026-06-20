# Spec 02 — Recepción y Finanzas

Fuente canónica:

- `docs/canonical/especificacion_aprobada.md`
- `docs/canonical/spec_00_modelo_datos_maestro.md`
- `docs/canonical/index_documentacion_canonica.md`

## Compatibilidad con Canonical

- **Tablas canónicas usadas:** `tenants`, `customers`, `repair_orders`, `order_photos`, `payments`, `cash_register`, `cash_movements`, `audit_logs`.
- **Cambios de esquema propuestos:**
  - `order_checklist`: Para estructura formal de checklist legal. Impacto: Bajo (actualmente mitigable usando JSONB en `repair_orders` o `order_photos`).
  - `device_categories`: Para exigir el tipo de identificador. Impacto: Bajo (hasta entonces se valida a nivel aplicación o configuración del tenant).
  - Campos de consentimiento en `customers` (`data_consent_status`, `data_consent_date`, etc.): Para gestión fina de permisos GDPR. Impacto: Medio.
- **Dependencias:** Spec 01 (Fundaciones).
- **Decisiones abiertas:** Si el checklist legal (T01) vivirá en tabla separada o se inyectará como JSONB en una columna extra de `repair_orders` hasta que se aprueben cambios de esquema.

---

## T01 — Checklist Legal Obligatorio De Recepción

### Objetivo Técnico

Garantizar que una orden no quede recibida sin registrar condición física, accesorios y aceptación.

### Tablas Utilizadas

- `tenants`
- `users`
- `customers`
- `repair_orders`
- `order_photos`
- `audit_logs`

### Contratos Del Sistema

- La obligatoriedad depende de `tenants`.
- `repair_orders.status` bloquea transición al siguiente estado si falta el checklist.
- *CAMBIO DE ESQUEMA PROPUESTO:* Tabla `order_checklist` separada. Actualmente se maneja mediante `order_photos` con `photo_type='checkin'` para evidencia, o se almacena de forma plana/json.

## T02 — Consentimiento, Retención y Control De Evidencias

### Objetivo Técnico

Controlar clasificación y visibilidad de evidencias asociadas a órdenes.

### Tablas Utilizadas

- `tenants`
- `customers`
- `repair_orders`
- `order_photos`
- `audit_logs`

### Contratos Del Sistema

- Evidencia interna nunca aparece en portal cliente.
- Toda evidencia usa la tabla canónica `order_photos`.
- *CAMBIO DE ESQUEMA PROPUESTO:* Columnas explícitas de `data_consent_*` en `customers`. Mientras tanto, el consentimiento se maneja en configuración general.

## T03 — IMEI/Serie Obligatorio Configurable

### Objetivo Técnico

Identificar equipos de forma confiable según su categoría.

### Tablas Utilizadas

- `tenants`
- `repair_orders`
- `customers`

### Contratos Del Sistema

- Se utiliza el campo `repair_orders.serial_number` o campos similares aprobados en la fuente de verdad.
- *CAMBIO DE ESQUEMA PROPUESTO:* Tablas `device_categories` y `devices` separadas. Actualmente la lógica vive en la aplicación mapeada a `repair_orders`.

## T05 — Motor De Caja Ligado A Órdenes

### Objetivo Técnico

Vincular ingresos con órdenes, caja y sucursales.

### Tablas Utilizadas

- `tenants`
- `repair_orders`
- `customers`
- `payments`
- `cash_register`
- `cash_movements`
- `audit_logs`

### Contratos Del Sistema

- Todo pago usa la tabla canónica `payments`.
- Los flujos de caja usan `cash_register` y `cash_movements`.
- Los campos financieros de la orden deben reflejar los pagos asociados (`total_paid`, `balance_due`).

## T06 — Cancelaciones, Reembolsos y Ajustes Financieros

### Objetivo Técnico

Permitir correcciones financieras mediante movimientos nuevos sin alterar la historia.

### Tablas Utilizadas

- `tenants`
- `repair_orders`
- `payments`
- `audit_logs`

### Contratos Del Sistema

- Todo ajuste usa registros de reversa en `payments` o un `cash_movement` justificado, para mantener integridad de `payments`.
- *CAMBIO DE ESQUEMA PROPUESTO:* Tabla separada para `adjustments` y `refunds` si la lógica requiere mayor detalle que el provisto por `payments`.
