# Spec 03 — Inventario y Cliente

Fuente canónica:

- `docs/canonical/especificacion_aprobada.md`
- `docs/canonical/spec_00_modelo_datos_maestro.md`
- `docs/canonical/index_documentacion_canonica.md`

## Compatibilidad con Canonical

- **Tablas canónicas usadas:** `tenants`, `repair_orders`, `users`, `audit_logs`, `parts`, `stock_movements`, `repair_log`, `warranty_claims`, `quotations`, `quotation_items`, `customers`, `order_photos`.
- **Cambios de esquema propuestos:**
  - `inventory_reservations`: Para soportar reserva estricta de piezas por orden sin consumir inmediatamente el stock (T07). Impacto: Medio. Hasta su aprobación, las piezas pasan de disponible a consumido directo, o se maneja a nivel de aplicación con un estado temporal en `stock_movements`.
  - `device_history_views`: Vistas especializadas o tablas separadas si la consolidación por `repair_orders.serial_number` es ineficiente en despliegues muy grandes (T09). Impacto: Medio-Bajo.
- **Dependencias:** Fundaciones (Spec 01), Recepción y Finanzas (Spec 02).
- **Decisiones abiertas:** Ninguna. Se respetan estrictamente los nombres físicos canónicos y el ciclo de vida de órdenes.

---

## T07 — Reserva Automática De Refacciones Por Orden

### Objetivo Técnico

Distinguir stock disponible de reservado sin afectar los niveles financieros.

### Tablas Utilizadas

- `tenants`
- `repair_orders`
- `parts`
- `stock_movements`
- `audit_logs`

### Contratos Del Sistema

- Se reutiliza la tabla canónica `parts` para el catálogo.
- *CAMBIO DE ESQUEMA PROPUESTO:* Tabla separada para las reservas, o extender temporalmente `stock_movements` con un tipo `reserved`.

## T08 — Consumo Atómico De Inventario

### Objetivo Técnico

Garantizar el consumo de piezas atómicamente, sin duplicados ni stock negativo.

### Tablas Utilizadas

- `tenants`
- `repair_orders`
- `parts`
- `stock_movements`
- `audit_logs`

### Contratos Del Sistema

- Todo consumo escribe en `stock_movements`.
- El saldo actual se calcula o materializa sobre `parts`.

## T09 — Historial Clínico Por Dispositivo

### Objetivo Técnico

Permitir consultar historial basado en identificadores como el número de serie.

### Tablas Utilizadas

- `repair_orders`
- `repair_log`
- `warranty_claims`

### Contratos Del Sistema

- Dado que en la arquitectura canónica el dispositivo está inmerso en `repair_orders` (vía `serial_number`, `device_model`, etc.), el historial se consolida agrupadamente por estos identificadores limitados por el `tenant_id`.
- Se utiliza `repair_log` para el historial detallado de servicio.

## T10 — Garantías Completas

### Objetivo Técnico

Gestionar garantías con vigencia y alcance sobre componentes u órdenes previas.

### Tablas Utilizadas

- `tenants`
- `customers`
- `repair_orders`
- `quotations`
- `warranty_claims`
- `audit_logs`

### Contratos Del Sistema

- Se asienta directamente en la tabla canónica `warranty_claims`.
- La garantía exige una orden base en estado entregada (`delivered`).
- Reabrir por garantía inserta nuevos registros y maneja transiciones válidas.

## T11 — Autorización Online Con Aceptación/Firma

### Objetivo Técnico

Reducir fricción y registrar aceptación formal de presupuestos.

### Tablas Utilizadas

- `repair_orders`
- `quotations`
- `order_photos` (para evidencia de firma, si aplica)

### Contratos Del Sistema

- Se utilizan campos existentes en `quotations` (ej. si requiere extender un json o usar los campos estandarizados).
- Las propuestas económicas solo usan las tablas `quotations` y `quotation_items`.

## T12 — Portal Cliente Completo Con Documentos

### Objetivo Técnico

Autoservicio para cliente y transparencia limitada (sin exponer notas internas).

### Tablas Utilizadas

- `repair_orders`
- `customers`
- `order_photos`
- `quotations`
- `warranty_claims`

### Contratos Del Sistema

- El portal mapea una vista *read-only* y sanitizada de `repair_orders` a partir de validación pública (ej. Folio + Pin / Email).

## T13 — WhatsApp Automatizado Con Cola Y Bitácora

### Objetivo Técnico

Automatizar comunicación sin pérdida de contexto ni spam duplicado.

### Tablas Utilizadas

- `repair_orders`
- `audit_logs`

### Contratos Del Sistema

- Los triggers de comunicación dependen estrictamente de los 9 estados canónicos definidos para la orden.
- *CAMBIO DE ESQUEMA PROPUESTO:* Tabla `message_queue` o similar para trazabilidad de envíos, reintentos y plantillas.
