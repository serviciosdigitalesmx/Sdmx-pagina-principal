# Web Env Agent Map

This file maps the web-related environment variables found in this repository and where they are declared.
It does not contain secret values.

## Primary files to inspect

- `/.env.example`
- `/.env.local`
- `/apps/web-public/.env.example`
- `/apps/web-public/.env.local`
- `/apps/web-admin/.env.example`
- `/apps/web-admin/.env.local`
- `/apps/web-clientes/.env.example`
- `/apps/web-clientes/.env.local`

## Web variables and where they appear

### Shared frontend variables

- `NEXT_PUBLIC_API_URL`
  - `/.env.example`
  - `/.env.local`
  - `/apps/web-admin/.env.local`
  - `/apps/web-clientes/.env.local`
  - `/apps/web-public/.env.local`

- `NEXT_PUBLIC_API_BASE_URL`
  - `/.env.example`
  - `/apps/web-clientes/.env.local`
  - `/apps/web-public/.env.local`

- `NEXT_PUBLIC_WEB_PUBLIC_URL`
  - `/.env.example`
  - `/.env.local`
  - `/apps/web-admin/.env.local`
  - `/apps/web-clientes/.env.local`
  - `/apps/web-public/.env.local`

- `NEXT_PUBLIC_WEB_ADMIN_URL`
  - `/.env.example`
  - `/apps/web-admin/.env.local`
  - `/apps/web-public/.env.local`

- `NEXT_PUBLIC_SUPABASE_URL`
  - `/.env.example`
  - `/apps/web-admin/.env.example`
  - `/apps/web-admin/.env.local`
  - `/apps/web-clientes/.env.example`
  - `/apps/web-public/.env.example`
  - `/apps/web-public/.env.local`

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `/.env.example`
  - `/apps/web-admin/.env.example`
  - `/apps/web-admin/.env.local`
  - `/apps/web-clientes/.env.example`
  - `/apps/web-public/.env.example`
  - `/apps/web-public/.env.local`

### Public portal / billing variables

- `NEXT_PUBLIC_BILLING_URL_TEMPLATE`
  - `/.env.example`

- `NEXT_PUBLIC_CUSTOMER_TRACKING_URL`
  - `/.env.example`
  - `/apps/web-admin/.env.local`
  - `/apps/web-clientes/.env.local`

- `NEXT_PUBLIC_LANDING_URL_TEMPLATE`
  - `/.env.example`

- `NEXT_PUBLIC_TENANT_LANDING_URL_TEMPLATE`
  - `/.env.example`
  - `/apps/web-public/.env.local`

- `NEXT_PUBLIC_SAAS_DEMO_TENANT_SLUG`
  - `/apps/web-public/.env.local`

- `NEXT_PUBLIC_SAAS_DEMO_URL`
  - `/.env.example`
  - `/apps/web-public/.env.local`

### Brand / theme variables

- `NEXT_PUBLIC_SAAS_BRAND_NAME`
  - `/.env.example`
  - `/apps/web-public/.env.local`

- `NEXT_PUBLIC_SAAS_BRAND_SHORT`
  - `/.env.example`
  - `/apps/web-public/.env.local`

- `NEXT_PUBLIC_SAAS_CONTACT_EMAIL`
  - `/.env.example`
  - `/apps/web-public/.env.local`

- `NEXT_PUBLIC_SAAS_CONTACT_PHONE`
  - `/.env.example`
  - `/apps/web-public/.env.local`

- `NEXT_PUBLIC_SAAS_LEGAL_NAME`
  - `/.env.example`
  - `/apps/web-public/.env.local`

- `NEXT_PUBLIC_SAAS_META_DESCRIPTION`
  - `/apps/web-public/.env.local`

- `NEXT_PUBLIC_SAAS_THEME_COLOR`
  - `/apps/web-public/.env.local`

- `NEXT_PUBLIC_THEME_PRIMARY`
  - `/.env.example`
  - `/.env.local`
  - `/apps/web-admin/.env.local`

- `NEXT_PUBLIC_THEME_SECONDARY`
  - `/.env.example`
  - `/.env.local`
  - `/apps/web-admin/.env.local`

- `NEXT_PUBLIC_THEME_ACCENT`
  - `/.env.example`
  - `/.env.local`
  - `/apps/web-admin/.env.local`

### Tenant defaults / local demo variables

- `NEXT_PUBLIC_DEFAULT_TENANT_ID`
  - `/.env.example`
  - `/.env.local`
  - `/apps/web-admin/.env.local`

- `NEXT_PUBLIC_DEFAULT_TENANT_NAME`
  - `/.env.example`
  - `/.env.local`
  - `/apps/web-admin/.env.local`

- `NEXT_PUBLIC_DEFAULT_BRANCH_NAME`
  - `/apps/web-admin/.env.local`

- `NEXT_PUBLIC_DEFAULT_SUCURSAL_NAME`
  - `/apps/web-admin/.env.local`

- `NEXT_PUBLIC_DEFAULT_USER_EMAIL`
  - `/apps/web-admin/.env.local`

- `NEXT_PUBLIC_DEFAULT_USER_ROLE`
  - `/apps/web-admin/.env.local`

- `NEXT_PUBLIC_DEFAULT_USER_SUCURSAL_ID`
  - `/apps/web-admin/.env.local`

- `NEXT_PUBLIC_TENANT_BRAND_NAME`
  - `/.env.example`
  - `/.env.local`
  - `/apps/web-admin/.env.local`

- `NEXT_PUBLIC_TENANT_DASHBOARD_MESSAGE`
  - `/apps/web-admin/.env.local`

- `NEXT_PUBLIC_TENANT_DASHBOARD_TITLE`
  - `/apps/web-admin/.env.local`

- `NEXT_PUBLIC_TENANT_META_DESCRIPTION`
  - `/apps/web-admin/.env.local`

- `NEXT_PUBLIC_TENANT_META_TITLE`
  - `/apps/web-admin/.env.local`

- `NEXT_PUBLIC_TENANT_SUPPORT_EMAIL`
  - `/apps/web-admin/.env.local`

- `NEXT_PUBLIC_TENANT_SUPPORT_PHONE`
  - `/apps/web-admin/.env.local`

### Runtime / platform variables

- `APP_URL`
  - `/.env.example`

- `BASE_DOMAIN`
  - `/.env.example`

- `CORS_ALLOWED_ORIGINS`
  - `/.env.example`

- `JWT_SECRET`
  - `/.env.example`

- `MP_ACCESS_TOKEN`
  - `/.env.example`

- `MP_WEBHOOK_SECRET`
  - `/.env.example`

- `NEXT_PUBLIC_AUTH_TOKEN_KEY`
  - `/.env.example`
  - `/.env.local`
  - `/apps/web-admin/.env.local`

- `NEXT_PUBLIC_ENABLE_PWA`
  - `/apps/web-admin/.env.example`

- `NEXT_PUBLIC_HUB_NAME`
  - `/.env.example`
  - `/apps/web-public/.env.local`

- `NEXT_PUBLIC_RENDER_API_URL`
  - `/.env.example`
  - `/apps/web-clientes/.env.local`
  - `/apps/web-public/.env.local`

- `NEXT_PUBLIC_WORKSHOP_NAME`
  - `/.env.example`
  - `/apps/web-clientes/.env.local`

- `NODE_ENV`
  - `/.env.example`

- `PORT`
  - `/.env.example`

- `PWA_VAPID_PRIVATE_KEY`
  - `/.env.example`

- `PWA_VAPID_PUBLIC_KEY`
  - `/.env.example`

- `PWA_VAPID_SUBJECT`
  - `/.env.example`

### Supabase server variables

- `SUPABASE_URL`
  - `/.env.example`

- `SUPABASE_ANON_KEY`
  - `/.env.example`

- `SUPABASE_SERVICE_ROLE_KEY`
  - `/.env.example`

## Notes for the next agent

- Use the root `/.env.example` as the canonical list of required variables.
- Use the app-specific `.env.local` files to understand which variables are actually consumed by each frontend.
- Do not copy secret values into docs.
- When running local validation, prefer `apps/web-public/.env.local` and `apps/web-admin/.env.local` for frontend behavior, and `/.env.local` for shared root settings.
