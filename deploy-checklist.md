# Deploy Checklist

## Frontend: Vercel
1. Configura el proyecto `apps/web-admin` como app principal en Vercel.
2. Define estas variables de entorno:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_DEFAULT_TENANT_ID`
   - `NEXT_PUBLIC_DEFAULT_TENANT_NAME`
   - `NEXT_PUBLIC_DEFAULT_BRANCH_NAME`
   - `NEXT_PUBLIC_DEFAULT_USER_EMAIL`
   - `NEXT_PUBLIC_DEFAULT_USER_SUCURSAL_ID`
   - `NEXT_PUBLIC_DEFAULT_USER_ROLE`
   - `NEXT_PUBLIC_THEME_PRIMARY`
   - `NEXT_PUBLIC_THEME_SECONDARY`
   - `NEXT_PUBLIC_THEME_ACCENT`
   - `NEXT_PUBLIC_DEFAULT_API_TOKEN`
3. Verifica que el build command sea `npm run build`.
4. Publica y valida:
   - `/dashboard/clientes`
   - `/dashboard/stock`
   - `/dashboard/finanzas`
5. Confirma que el token enviado en `Authorization` coincide con el JWT emitido por la API.

## API: Render
1. Configura `apps/api` como servicio Node.js.
2. Define estas variables de entorno:
   - `PORT`
   - `CORS_ORIGIN`
   - `JWT_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ORDER_FOLIO_PREFIX`
3. Verifica que el start command sea `npm run start` después de `npm run build`.
4. Aplica la migración de Supabase antes de abrir tráfico:
   - `supabase/migrations/20260514120000_enable_rls_and_policies.sql`
5. Smoke tests:
   - `GET /api/:tenantId/customers`
   - `GET /api/:tenantId/inventory`
   - `GET /api/:tenantId/finance/balance`
   - `POST /api/:tenantId/orders`

## Supabase
1. Ejecuta la migración en staging primero.
2. Valida RLS con un token de `tenant_id = 1` intentando leer `tenant_id = 2`.
3. Verifica que `manager` no pueda cruzar sucursal en `expenses` ni `finances`.
4. Promueve a producción solo después de que staging pase.

## Observaciones
- No usar `x-tenant-id` como contexto de negocio en frontend.
- El JWT debe ser la única fuente de verdad para `tenant_id`, `role` y `sucursal_id`.
- Mantener `service_role` solo en backend.
