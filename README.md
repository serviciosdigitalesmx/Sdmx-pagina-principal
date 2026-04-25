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

### Backend (`apps/backend-api`)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ALLOWED_ORIGINS` (CSV)
- `PORT`

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
- Validación runtime con Zod en rutas API.
- Rate limiting por IP + endpoint y headers de seguridad en servidor.
- Logging estructurado con Pino.
- CI en GitHub Actions para typecheck backend/frontend.
