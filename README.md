# Servicios Digitales MX - SaaS Multi-tenant

Arquitectura activa:
- Frontend: Next.js (`apps/frontend-next`)
- Backend: Node.js + TypeScript (`apps/backend-api`)
- Datos/Auth/Storage: Supabase

## Configuración de producción y local

### Frontend (`apps/frontend-next`)
- `NEXT_PUBLIC_API_URL` (opcional)
  - vacío: usa **mismo origen** en runtime.
  - definido: usa URL explícita del backend (ej. Render).
- Runtime override opcional: `window.__SDMX_CONFIG__.apiUrl`.
- Cache asíncrona con TanStack Query para consultas/mutaciones críticas (service orders y vistas protegidas).

### Backend (`apps/backend-api`)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ALLOWED_ORIGINS` (CSV)
- `PORT`
- `BETTERSTACK_SOURCE_TOKEN` (opcional, envío de logs)
- `BETTERSTACK_INGEST_URL` (opcional, por default `https://in.logs.betterstack.com`)
- `ERROR_WEBHOOK_URL` (opcional, alertas de errores)

## Run local

```bash
cd apps/backend-api && npm run build && npm start
cd apps/frontend-next && npm run dev
```

## Contrato de login estable
`POST /api/auth/login` devuelve:
- `accessToken`
- `refreshToken`
- `expiresAt`
- `user`
- `shop`
- `subscription`
- `roles`
- `permissions`
- `POST /api/auth/forgot-password`

## Migraciones Supabase
Se incluye delta de alineación en:
- `supabase/migrations/20260424_200000_multitenant_alignment.sql`

Incluye tablas, FK, RLS base, `status_transition_policy`, `tenant_counters`, `audit_events` y función `next_tenant_folio`.

## Estrategia RLS
RLS por tenant usa la función `auth_tenant_id()` definida en migración, que resuelve tenant por `auth.uid()` contra `users.auth_user_id` (sin depender de claim `tenant_id` en JWT).

## Seguridad y observabilidad
- Validación runtime en rutas API.
- Rate limiting por IP + endpoint y headers de seguridad en servidor.
- Logging estructurado JSON y envío opcional a BetterStack.
- Alertas de errores vía webhook configurable.
- Endpoint admin `GET /api/admin/audit-events` para lectura de `audit_events`.

## Testing de integración (regla "cero mocks")
Script de staging real (sin mocks):

```bash
cd apps/backend-api
npm run test:staging
```

Variables requeridas:
- `STAGING_API_URL`
- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_SERVICE_ROLE_KEY`
- `STAGING_SUPABASE_ANON_KEY`
- `STAGING_TEST_EMAIL`
- `STAGING_TEST_PASSWORD`
- `STAGING_TEST_TENANT_ID` (opcional)

El flujo realiza login real, crea customer + service order, valida timeline/auditoría y limpia registros de prueba.

## CI/CD
Workflow `.github/workflows/deploy.yml` ahora incluye:
- Typecheck backend/frontend.
- Validación del archivo de migración.
- Job `migrations` (en `main`) con `supabase db push` usando `SUPABASE_DB_URL`.
- Job `staging-integration` (en `main`) ejecutando la suite de integración real contra staging.
