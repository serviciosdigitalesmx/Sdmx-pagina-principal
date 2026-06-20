# Spec 03 — Inventario y Cliente

Fuente canónica:

- `docs/canonical/especificacion_aprobada.md`
- `docs/canonical/spec_00_modelo_datos_maestro.md`
- `docs/canonical/index_documentacion_canonica.md`

## Compatibilidad con Canonical

- **Tablas físicas actuales usadas:** `products`, `sucursal_inventory`, `inventory_movements`, `stock_alerts`, `purchase_orders`, `purchase_order_items`, `service_orders`, `customers`, `service_order_documents`, `service_order_events`, `audit_logs`.
- **Nota de alcance:** en el modelo canónico, `parts` y `stock_movements` son nombres de dominio; en este repositorio su implementación física actual vive como `products` y `inventory_movements`. `quotations` y `quotation_items` siguen siendo nombres canónicos de dominio; en el repositorio actual no existe su tabla física y no bloquean T01/T03/T02.
- **Cambios de esquema propuestos:**
  - `inventory_reservations`: Para soportar reserva estricta de piezas por orden sin perder trazabilidad ni sobredibujar stock. Impacto: Medio. Aún no existe en el repo.
  - `inventory_availability_view` o cálculo equivalente: solo si la disponibilidad derivada se vuelve costosa en tenants grandes.
- **Dependencias:** Fundaciones (Spec 01), Recepción y Finanzas (Spec 02).
- **Decisiones abiertas:** Ninguna para el bloque T07/T08; la reserva se resuelve sobre inventario físico real del repo.

---

## T07 — Reserva Automática De Refacciones Por Orden

### Objetivo Técnico

Distinguir stock disponible de reservado sin afectar los niveles financieros.

### Tablas Utilizadas

- `tenants`
- `repair_orders` / `service_orders`
- `products`
- `sucursal_inventory`
- `inventory_movements`
- `audit_logs`

### Contratos Del Sistema

- `products` es el catálogo de refacciones/productos.
- `sucursal_inventory` mantiene el stock físico por sucursal.
- `inventory_movements` conserva el historial de entradas, salidas, transferencias y ajustes.
- La relación actual entre orden y piezas no existe como tabla propia; hoy solo se puede anclar de forma indirecta mediante `inventory_movements.service_order_id` o flujo de compra.

## T08 — Consumo Atómico De Inventario

### Objetivo Técnico

Garantizar el consumo de piezas atómicamente, sin duplicados ni stock negativo.

### Tablas Utilizadas

- `tenants`
- `repair_orders` / `service_orders`
- `products`
- `sucursal_inventory`
- `inventory_movements`
- `audit_logs`

### Contratos Del Sistema

- Todo consumo debe escribir en `inventory_movements`.
- El stock físico base vive en `sucursal_inventory.stock_current`.
- La disponibilidad real se deriva del stock físico menos reservas activas.

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
- `service_order_documents` (para evidencia de firma o anexos, si aplica)

### Contratos Del Sistema

- Se utilizan campos existentes en `quotations` (ej. si requiere extender un json o usar los campos estandarizados).
- Las propuestas económicas solo usan las tablas `quotations` y `quotation_items`.

## T12 — Portal Cliente Completo Con Documentos

### Objetivo Técnico

Autoservicio para cliente y transparencia limitada (sin exponer notas internas).

### Tablas Utilizadas

- `repair_orders`
- `customers`
- `service_order_documents`
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
