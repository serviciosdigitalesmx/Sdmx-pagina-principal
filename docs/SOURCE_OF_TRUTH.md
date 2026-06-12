# Fixi Source of Truth

## Conclusión

Fixi es una plataforma SaaS horizontal multi-tenant, no un sistema exclusivo para talleres.

La arquitectura oficial es:

```txt
UI
  ↓
Domain Services
  ↓
ApiGateway
  ↓
Backend API
  ↓
Supabase
```

## Reglas no negociables

- No reintroducir `fixService`.
- No consumir API directamente desde componentes UI.
- No inventar contratos.
- No usar mocks.
- No hardcodear URLs, secrets, tenant IDs, slugs ni dominios.
- No crear defaults falsos de tenant.
- No documentar Fixi como producto exclusivo para talleres.
- No meter verticalización en JWT salvo razón fuerte y documentada.

## Stack real

- GitHub: repositorio fuente.
- Vercel: frontends.
- Render: backend API.
- Supabase: base de datos, auth y storage.

## Frontends

| App | Responsabilidad |
| --- | --- |
| `apps/web-public` | Landing pública SaaS |
| `apps/web-admin` | Dashboard operativo/admin |
| `apps/web-clientes` | Landing tenant + portal cliente |

## Backend

| App | Responsabilidad |
| --- | --- |
| `apps/api` | API central desplegada en Render |

## Variables de entorno

Las apps no deben dispersar lectura directa de variables.

La configuración debe centralizarse en:

- `packages/config`

Variables permitidas:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_WEB_ADMIN_URL`
- `NEXT_PUBLIC_WEB_PUBLIC_URL`
- `NEXT_PUBLIC_WEB_CLIENTES_URL`
- `NODE_ENV`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`

## Supabase

El cliente compartido debe vivir en:

- `packages/supabase`

Prohibido duplicar `createClient()` por app si ya existe abstracción compartida.

## Multitenancy

Identidad esperada:

- `tenantId`
- `tenantSlug`
- `tenantName`
- `branchId`
- `branchCode`
- `branchName`

Prohibido:

- Leer tenant desde `localStorage` como fuente de verdad.
- Inventar tenant.
- Usar slugs `demo`, `codex`, `test` como fallback productivo.

## Branding

Marca plataforma:

- Fixi

Marca tenant:

- `tenantName`

Prohibido mostrar:

- `sr fixi`
- `demo`
- `codex`
- `qa`
- `test`
- IDs truncados como nombre de sucursal
