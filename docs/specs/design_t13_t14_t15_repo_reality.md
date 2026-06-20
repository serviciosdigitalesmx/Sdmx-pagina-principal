# Diseño Técnico: T13, T14 e T15 (Basado en la Realidad del Repo)

Este documento contiene el diseño técnico y el reporte de realidad operativa para la implementación de los tickets T13 (WhatsApp automatizado con cola y bitácora), T14 (Tiempos, productividad y comisiones) y T15 (Reportes operativos confiables), basados en la inspección del esquema de base de datos actual y el código monolítico.

## 1. Evidencia Real Encontrada (`EXISTE EN REPO`)

Tras inspeccionar `apps/api/src/` y `supabase/migrations/`:

*   **WhatsApp (T13):** `EXISTE EN REPO` a nivel de reglas y configuración (`tenant_config.ts` posee "semáforos" como `esperando_autorizacion` y `cotizacion_enviada` predefinidos para WhatsApp, y el módulo `whatsapp` existe en `tenantCapabilities`). Sin embargo, **NO EXISTEN** tablas de bitácora (`message_queue`), ni controladores, ni rutas, ni workers reales.
*   **Productividad, Tiempos y Comisiones (T14):** `EXISTE EN REPO` la asignación operativa: existe la tabla `tasks` vinculada a `service_orders` y asignada a `assigned_user_id`, junto con `task_history`. Sin embargo, **NO EXISTEN** columnas transaccionales para "horas cronometradas", y no hay registro de comisiones o reglas de pago en `users` o `tasks`.
*   **Reportes Operativos Confiables (T15):** `EXISTE EN REPO` de manera avanzada. El controlador `apps/api/src/controllers/reports.ts` extrae métricas de 7 tablas distintas simultáneamente: órdenes por sucursal, valuación de inventario (`stock * cost`), cuentas por cobrar, productos más usados (`inventory_movements`), órdenes con promesas vencidas y balance (ingresos/gastos).

## 2. Riesgos Críticos y Bloqueantes Inmediatos

*   **Riesgo de Datos Falsos en Reportes (T15):** El código actual de `reports.ts` realiza agregaciones de base de datos *en memoria* trayendo un lote de registros limitados: `supabase.from('service_orders')...limit(500)`. Si un tenant excede 500 órdenes o mil movimientos, el reporte financiero `totalBalance`, los ingresos y la contabilidad **estarán incompletos y presentarán números falsos o descuadrados**.
*   **Riesgo de Implementación T13:** Supabase no provee cola de mensajería asíncrona nativa confiable out-of-the-box; se requerirá de `pg_cron` en conjunto con Edge Functions o webhooks externos.

---

## 3. T13: WhatsApp Automatizado con Cola y Bitácora

### Objetivo
Enviar mensajes de seguimiento automatizados sin spam y con control de reintentos, aprovechando las reglas semáforo (`semaphore_rules`) ya documentadas.

### `CAMBIO DE ESQUEMA PROPUESTO`
Es mandatorio aislar la ejecución del request de usuario del envío a la API de WhatsApp, usando un patrón outbox.
```sql
CREATE TABLE public.message_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  service_order_id uuid REFERENCES public.service_orders(id) ON DELETE SET NULL,
  phone_number text NOT NULL,
  message_template text NOT NULL,
  message_payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending', -- pending, sent, failed
  provider_message_id text,
  error_log text,
  scheduled_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);
CREATE INDEX message_queue_pending_idx ON public.message_queue (status) WHERE status = 'pending';
```

### Backend y Flujo
1.  **Interceptor de Eventos:** En `orders.ts` o vía *Database Triggers*, al cambiar una orden al estado parametrizado, se encola un mensaje en `message_queue` con estado `pending`. El link incluirá el `public_token` de T12.
2.  **Cola asíncrona:** Un *cron job* externo (Supabase Cron o Vercel Cron) llamará a `POST /api/v1/whatsapp/dispatch` cada minuto para drenar y procesar.

---

## 4. T14: Tiempos, Productividad y Comisiones

### Objetivo
Medir horas trabajadas en órdenes y calcular comisiones variables, desacoplándolo de las métricas estáticas del negocio y el seguimiento crudo de estado en `tasks`.

### `CAMBIO DE ESQUEMA PROPUESTO`
Para no entorpecer `tasks` (que es generalista), se introduce el concepto de "Logs de Tiempo/Trabajo":
```sql
CREATE TABLE public.work_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  technician_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL DEFAULT timezone('utc', now()),
  end_time timestamptz,
  total_minutes integer,
  commission_earned numeric(12,2) DEFAULT 0,
  is_paid boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);
```

### Contrato API / Flujo
*   `POST /api/v1/orders/:id/work-logs/start`: El técnico inicia actividad.
*   `POST /api/v1/orders/:id/work-logs/stop`: Se calcula `total_minutes`. Se deduce la comisión (`commission_earned`) según las reglas configuradas por el tenant (fijo o porcentaje).

---

## 5. T15: Reportes Operativos Confiables

### Objetivo
Solucionar inmediatamente el límite destructivo de datos (`.limit(500)`) en el backend actual que arruina la contabilidad corporativa.

### `CAMBIO DE ESQUEMA PROPUESTO (RPCs Analíticos)`
Las reducciones en memoria RAM en `reports.ts` deben ser movidas a funciones almacenadas de Postgres.
```sql
CREATE OR REPLACE FUNCTION get_tenant_financial_summary(tenant_uuid uuid, branch_uuid uuid DEFAULT NULL)
RETURNS json AS $$
DECLARE
  total_income numeric;
  total_expense numeric;
BEGIN
  -- Agregación SQL robusta escalable
  SELECT COALESCE(SUM(final_cost), 0) INTO total_income FROM public.service_orders 
  WHERE tenant_id = tenant_uuid AND (branch_uuid IS NULL OR sucursal_id = branch_uuid);
  
  SELECT COALESCE(SUM(expense), 0) INTO total_expense FROM public.finances 
  WHERE tenant_id = tenant_uuid AND (branch_uuid IS NULL OR sucursal_id = branch_uuid);

  RETURN json_build_object('income', total_income, 'expense', total_expense, 'balance', total_income - total_expense);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Backend (Refactorización)
*   Sustituir el método `Promise.all` masivo de NodeJS en el controlador `reports.ts`. Las consultas a grandes volúmenes de datos se delegan al motor de base de datos (`await supabase.rpc(...)`).

---

## 6. Separación Obligatoria y Verificación

Los tags de clasificación (`EXISTE EN REPO`, `CAMBIO DE ESQUEMA PROPUESTO`, `DECISIÓN TÉCNICA FINAL`) se han estructurado acordemente.

## 7. Bloqueantes Reales y Veredicto
*   **Veredicto:** `LISTO PARA ATERRIZAJE CON CODEX`
*   **Decisión técnica a validar por Codex:** Si la infraestructura gratuita de Supabase permite el uso extensivo de `pg_cron`, de lo contrario, se propondrá configurar Pipedream o Vercel Cron. Para T15, aprobar la migración del cómputo analítico a la BD.
