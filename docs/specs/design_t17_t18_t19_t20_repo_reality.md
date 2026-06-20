# Diseño Técnico: T17, T18, T19 e T20 (Basado en la Realidad del Repo)

Este documento contiene el diseño técnico y el reporte de realidad operativa para la implementación del bloque final de la plataforma, que abarca los tickets T17 (Backoffice interno FIXI), T18 (Observabilidad y alertas), T19 (Límites de plan y billing enforcement) y T20 (Exportación/importación de datos por tenant). Se fundamenta en la inspección del esquema transaccional, middleware y endpoints existentes en el repositorio real.

## 1. Evidencia Real Encontrada (`EXISTE EN REPO`)

A partir de la auditoría en `apps/api/src/` y las configuraciones de seguridad:

*   **T17 Backoffice interno FIXI:** `EXISTE EN REPO` parcialmente a nivel conceptual. El sistema asume un *Superusuario* validado mediante variables de entorno (`MASTER_TENANT_SLUG` y `MASTER_ACCOUNT_EMAIL`), lo cual otorga el estatus maestro (`access_status: 'master'`) evadiendo bloqueos financieros. Sin embargo, **NO EXISTEN** controladores (`superadmin.ts`) ni endpoints para listar inquilinos, forzar cambios de suscripción o perdonar pagos a través de una API transaccional.
*   **T18 Observabilidad y Alertas:** `EXISTE EN REPO`. El controlador `meta.ts` incluye las rutas `/health`, `/healthz` y `/api/health`. Además, la funcionalidad de auditoría (T04) ya expone un endpoint (`GET /api/v1/security/audit`) que dota de observabilidad interna al cliente. No hay proveedores de Application Performance Monitoring (APM) acoplados directamente en el código de backend.
*   **T19 Límites de plan y billing enforcement:** `EXISTE EN REPO` (Nivel avanzado). Los middlewares `requireTenantBillingActive` (intercepta bloqueos emitiendo `HTTP 402`) y `requireTenantModule` ya operan. El archivo `tenant-capabilities.ts` mapea explícitamente el `PLAN_REGISTRY` (planes `basic`, `pro` y `scale`) definiendo cuotas estrictas para: `users`, `sucursales`, `monthly_orders`, `storage_mb`, y `whatsapp_templates`.
*   **T20 Exportación/importación de datos:** **NO EXISTE**. No hay controladores, exportadores de CSV, parseadores de Excel, ni flujos asíncronos para importación/exportación de grandes volúmenes de datos.

---

## 2. T17 — Backoffice interno FIXI

### Objetivo
Habilitar capacidades operativas para la empresa dueña del SaaS (FIXI) permitiendo suspender, reactivar y modificar la capacidad de sus clientes (tenants).

### Diseño y Flujo
No se requieren tablas nuevas; `tenants` y `organizations` albergan el estado.
*   **Rutas Propuestas:** Aislar endpoints en un módulo `/api/v1/superadmin/`.
*   **Permisos (Seguridad):** Middleware dedicado (`requireSuperAdmin`) que valide tajantemente que el correo autenticado corresponde al `MASTER_ACCOUNT_EMAIL` de entorno.
*   **Contratos API Mínimos:** 
    - `GET /superadmin/tenants` (Paginación de la base de clientes instalada).
    - `PATCH /superadmin/tenants/:id/billing` (Escritura forzosa sobre `subscription_status` para forzar suspensiones manuales o reactivar un pago disputado).

---

## 3. T18 — Observabilidad y Alertas

### Objetivo
Garantizar estabilidad y facilitar debug forense en caídas sistémicas.

### Diseño (Decisión Técnica Final)
*   **Mantenimiento:** Preservar `GET /healthz` para los pingers (Vercel/Railway).
*   **Decisión:** **No se agregarán** tablas SQL para almacenar métricas vitales (CPU, memoria o latencia REST) porque esto saturaría inútilmente las transacciones IOPS. La observabilidad se delega a las consolas nativas de PaaS (Log Drains).

---

## 4. T19 — Límites de plan y billing enforcement

### Objetivo
Activar topes preventivos sobre el límite de consumo para que el usuario ascienda de plan (`Upselling`).

### Flujo de Enforcement (Restringir en el Backend)
*   La lógica ya existe pasivamente en `tenant-capabilities.ts`.
*   **Interceptor Activo:** Modificar el flujo de `createOrder` (y creadores de usuarios/sucursales) de tal forma que antes del `INSERT`, la base de datos o el backend cuente el consumo actual del mes, lo contraste contra el límite (`monthly_orders`), y de excederlo emita un `HTTP 403 Forbidden` (`"Límite de órdenes del plan actual alcanzado"`).

---

## 5. T20 — Exportación/importación de datos por tenant

### Objetivo
Permitir a los dueños de los talleres llevarse su base de datos (Anti Lock-in) o iniciar rápidamente migrando desde un Excel obsoleto.

### `CAMBIO DE ESQUEMA PROPUESTO (Worker Asíncrono)`
Ejecutar exports masivos (+10k filas) en el hilo principal de NodeJS (Express) provocará agostamiento de RAM y Timeouts HTTP severos (Vercel desconecta a los 10-60s). Se exige un modelo *Outbox/Job Queue*.

```sql
CREATE TABLE public.data_export_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES public.users(id),
  entity_type text NOT NULL, -- 'orders', 'customers', 'inventory'
  status text NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  file_url text,
  row_count integer,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  completed_at timestamptz
);
```

### Contrato API y Ciclo de Vida
1.  **Solicitud:** `POST /api/v1/exports`. Se asienta `status = pending` en SQL y se devuelve `HTTP 202 Accepted` de inmediato.
2.  **Procesamiento Desacoplado:** Un cron worker, tarea de fondo o Edge Function levanta el registro, extrae mediante un Cursor Postgres a CSV, sube el archivo a un bucket efímero en Supabase Storage y marca `status = completed`.
3.  **Descarga:** El usuario hace un "polling" (o lee su bandeja de exportaciones) y al ver "Completado" obtiene la liga de descarga segura.

---

## 6. Separación Obligatoria y Verificación

Las decisiones técnicas están segregadas con sus respectivos tags (`EXISTE EN REPO`, `CAMBIO DE ESQUEMA PROPUESTO`, `DECISIÓN TÉCNICA FINAL`).

## 7. Bloqueantes Reales y Veredicto
*   **Veredicto:** `LISTO PARA ATERRIZAJE CON CODEX`
*   **Aprobar por Codex:** Aprobar el paradigma asíncrono para T20 para garantizar resiliencia transaccional y prevención de memory leaks en las exportaciones masivas. Abstenerse de generar la UI de superadministrador (T17) en esta fase temprana, manejándolo solo a través de API y Postman para el equipo fundador.
