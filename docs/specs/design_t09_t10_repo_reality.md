# Diseño Técnico: T09 e T10 (Basado en la Realidad del Repo)

Este documento es el borrador de diseño técnico para la implementación de los tickets T09 (Historial clínico por dispositivo) y T10 (Garantías completas), basado en una inspección profunda del código, esquema SQL, controladores y rutas reales que operan actualmente en la rama principal.

## 1. Evidencia Real Encontrada (`EXISTE EN REPO`)

Tras inspeccionar `supabase/migrations/` y el backend en `apps/api/src/`, se ha comprobado la existencia de la siguiente estructura operativa:

*   **Tabla física principal de órdenes:** `public.service_orders`.
*   **Clientes:** `public.customers`.
*   **Sucursales:** `public.sucursales` (evidencia de que la tabla `branches` fue sustituida mediante la migración `20260527091000_cutover_branches_to_sucursales.sql`).
*   **Documentos y Eventos:** `public.service_order_documents` y `public.service_order_events`.
*   **Columna de vigencia de garantía:** `service_orders.warranty_until` existe y es utilizada.
*   **Ruta/controlador de garantías existente:** Se encontró la ruta `PATCH /api/v1/orders/:id/warranty` operada por el controlador `updateOrderWarranty` en `apps/api/src/controllers/orders.ts`.
*   **Roles, módulos y middleware reales:** El sistema utiliza validación per-módulo (ej. `requireTenantModule('warranty')`, `requireTenantModule('orders')`), controles de autorización (`requireRole('owner', 'manager', 'technician')`) y middlewares de aislamiento de inquilino (`validateTenant`, `attachScope`).

## 2. Mapa del Sistema

### Dominio → Tabla Física
*   Órdenes de Servicio → `public.service_orders`
*   Clientes → `public.customers`
*   Dispositivos → **Embebido** dentro de `public.service_orders` (`device_type`, `device_brand`, `device_model`, `serial_number`).
*   Sucursales → `public.sucursales`
*   Garantías → `service_orders.warranty_until`
*   Auditoría / Bitácora → `public.audit_logs`, `public.service_order_events`

### Dominio → Ruta/Controlador/Servicio
*   Órdenes → `/api/v1/orders` → `apps/api/src/controllers/orders.ts`
*   Garantías → `PATCH /api/v1/orders/:id/warranty` → `updateOrderWarranty`
*   Inventario → `/api/v1/inventory` → `apps/api/src/controllers/catalogs.ts`

### Documentación Canónica → Realidad del Repo
*   **Contradicción de Nombres:** La doc canónica (`especificacion_aprobada.md`) exige usar la entidad `repair_orders`. La realidad monolítica del repo usa **`service_orders`**. Lo mismo ocurre con `branches` (teoría) vs `sucursales` (realidad).
*   **Modelo de Dispositivos:** La doc especifica tablas de dispositivos aisladas (`devices`, `device_categories`). El esquema real de base de datos no las tiene, sino que almacena toda la información del dispositivo de manera plana en la tabla de la orden.
*   **Garantías:** La doc exige la tabla `warranty_claims`. La realidad actual solo controla una fecha de vigencia simple mediante `warranty_until` y no enlaza los reclamos formales en una estructura relacional.
*   **Estados de Orden:** La doc dicta 17 estados muy específicos. El controlador real de API define: `const defaultOrderStatuses = ['recibido', 'diagnostico', 'reparacion', 'listo', 'entregado'] as const;`.

---

## 3. T09: Historial Clínico Por Dispositivo

### `DECISIÓN QUE DEBE VALIDAR CODEX`
Para no romper el backend ni lanzar una refactorización masiva inyectando una tabla `devices` ficticia, el historial se construirá agrupando lógicamente las órdenes a través de la columna existente `service_orders.serial_number`.

### Diseño y Flujo
El historial será una colección cronológica de todas las órdenes asociadas a un identificador único (IMEI/Serie). Esto permite recuperar tanto las reparaciones históricas como los eventos de diagnóstico relevantes al momento de una nueva recepción.

### `CAMBIO DE ESQUEMA PROPUESTO`
Es necesario optimizar las consultas donde la condición sea el número de serie dentro de un tenant.
```sql
CREATE INDEX IF NOT EXISTS service_orders_tenant_serial_idx 
ON public.service_orders (tenant_id, serial_number) 
WHERE serial_number IS NOT NULL;
```

### Contrato API (Convención Real Encontrada)
**`GET /api/v1/orders/history/device/:serial_number`**
Búsqueda de historial agregado.
*   **Respuesta esperada:** Lista descendente (por fecha de recepción) extrayendo el ID, folio, fecha, estado final y notas de la reparación de cada `service_order` que contenga el `serial_number`.

### Permisos y Middleware
*   `requireAuth`, `validateTenant`, `requireTenantModule('orders')`.
*   Apto para los roles operativos (`technician`, `manager`, `owner`).

### Aislamiento Tenant y Multi-sucursal
*   El historial de un dispositivo debe estar rigurosamente encapsulado mediante el middleware de tenant actual (y Row-Level Security: `WHERE tenant_id = current_tenant_id()`).
*   **Compatibilidad multi-sucursal:** A diferencia de las vistas de ingresos o cajones de cobro, el historial de un equipo debe saltarse el límite del `branch_id`. Si el cliente llevó el equipo a la "Sucursal A" hace 3 meses y hoy lo lleva a la "Sucursal B", el técnico de la Sucursal B debe poder ver el historial completo para honrar garantías o evidenciar reincidencia (sujeto a roles de alto nivel si la empresa lo restringe).

### Pruebas, Rollback y DoD
*   **Pruebas:** Asegurar el agrupamiento agnóstico a mayúsculas/minúsculas y la prevención de fallos si la búsqueda recibe un string vacío/nulo. Garantizar hermetismo inter-tenant.
*   **Rollback:** Seguro y no destructivo. Si el índice se corrompe, se lanza `DROP INDEX` y la búsqueda operará de manera secuencial. Si el endpoint tiene problemas, el flujo base de ingreso/reparación no se bloquea.
*   **DoD (Definition of Done):** Índice migrado, API expuesta y devolviendo la cadena temporal de la vida del dispositivo sin comprometer privacidad de otros inquilinos.

---

## 4. T10: Garantías Completas

### Base Operativa
El sistema actual se apoya de manera robusta en `service_orders.warranty_until` y en el endpoint `PATCH /api/v1/orders/:id/warranty` (`EXISTE EN REPO`). Expandiremos este modelo para soportar la trazabilidad oficial de la orden fallida.

### `CAMBIO DE ESQUEMA PROPUESTO`
Para cumplir la formalidad de la cobertura, debe conectarse la "Orden Antigua" (donde se prometió la garantía) con la "Nueva Orden" (el re-ingreso o reclamo formal) mediante la tabla pivote de reclamos de garantía.

```sql
CREATE TABLE public.warranty_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  original_order_id uuid NOT NULL REFERENCES public.service_orders(id),
  claim_order_id uuid NOT NULL REFERENCES public.service_orders(id),
  claim_date timestamptz NOT NULL DEFAULT timezone('utc', now()),
  resolution_status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  resolution_notes text,
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- RLS
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;
-- Políticas base para aislar tenants se inyectarán en la migración.

-- Constraints e Índices para garantizar Idempotencia y Eficiencia
CREATE UNIQUE INDEX warranty_claims_claim_uidx ON public.warranty_claims (claim_order_id);
CREATE INDEX warranty_claims_original_idx ON public.warranty_claims (original_order_id);
```

### Flujo Completo (Original → Reclamo → Resolución)
1.  **Validación Previa:** Gracias a T09, el operador visualiza que la orden histórica de un equipo tiene `warranty_until` en una fecha futura válida.
2.  **Reingreso (Reclamo):** El operador abre una nueva `service_order` (status `recibido`) anotando el problema actual.
3.  **Vinculación:** Se invoca **`POST /api/v1/orders/:original_id/warranty-claims`** enviando el `claim_order_id` (la nueva orden recién creada) y notas justificativas.
4.  **Resolución:** Un técnico revisa la nueva orden. Tras el diagnóstico, se hace `PATCH /api/v1/orders/:original_id/warranty-claims/:claim_id` definiendo el `resolution_status` en `approved` (aplica cobertura) o `rejected` (no aplica cobertura).

### Integración con T05/T06 (Finanzas)
*   **Integración no intrusiva:** El reclamo de garantía es una capa administrativa y trazable. Si el `resolution_status` de una garantía se vuelve `approved`, el impacto en caja debe gestionarse fijando `final_cost` en $0 y añadiendo una nota de ajuste financiero, o aplicando un descuento del 100%. **No se asume un flujo o cobro automático.** T05 registrará simplemente que la nueva orden costó $0.00.

### Auditoría (T04)
*   Uso inyectado de los servicios base encontrados (`writeCriticalAuditLog` / `writeBestEffortAuditLog` desde `src/services/audit.ts`) para despachar los eventos `warranty.claim_registered` y `warranty.claim_resolved`.

### Pruebas, Rollback y DoD
*   **Pruebas:** Lanzar aserción donde un intento de reclamo a una orden cuyo `warranty_until` ya está vencido arroje un `HTTP 422 Unprocessable Entity` o `HTTP 400 Bad Request`.
*   **Rollback no destructivo:** Si una garantía se enlazó a la nueva orden incorrecta, no se elimina (`DELETE`); simplemente se marca como `rejected` en `resolution_status` añadiendo en `resolution_notes` que el registro fue un error operativo. La nueva orden continúa entonces por su canal habitual de cobro.
*   **DoD:** La tabla pivote `warranty_claims` ha sido desplegada; las rutas existen y devuelven 2xx/4xx correctamente según el valor del reloj y la fecha original, y la UI permite enlazar un reclamo al crear o visualizar un reingreso.

---

## 6. Veredicto Final

A la luz de la inspección de los cimientos del repositorio actual, se confirma que T09 y T10 son acoplables sin perturbar componentes críticos. Las decisiones técnicas protegen la cohesión con `service_orders`.

**`LISTO PARA ATERRIZAJE CON CODEX`**
