# Tenant Website Engine Master Plan

## Objetivo

Construir en `apps/web-clientes` un engine único para:
- landing pública del tenant
- portal cliente del tenant

Sin builds separados por tenant y sin tocar `apps/web-public`, `apps/web-admin` ni `apps/api`.

## Principios

1. Un solo app público para cada tenant.
2. La landing y el portal comparten tema y resolver de tenant.
3. El contenido se obtiene de contratos reales.
4. Si un dato no existe, la UI muestra estado seguro.
5. No se inventan endpoints.

## Estado actual del repo

### Rutas reales en `apps/web-clientes`
- `/[tenantSlug]` para landing pública
- `/t/[tenantSlug]/portal` para portal cliente
- `/` como entrada informativa

### Contratos reales ya visibles
- `GET /api/public/tenant/:tenantSlug/landing`
- `GET /api/public/tenant/:tenantSlug/orders/:folio`

### Gap principal
- No existe una capa de engine para renderizar landing por secciones activables/desactivables.

## Fases

### Fase 1: Theme Engine
- `TenantThemeLoader`
- `ThemeResolver`
- `ThemeProvider`
- CSS variables dinámicas

### Fase 2: Landing Engine
- `LandingRenderer`
- `LandingSectionFactory`
- `LandingSectionRegistry`
- fallback seguro por sección

### Fase 3: Portal Engine
- reutilizar tema del tenant
- compartir branding, CTA y footer
- mantener tracking y evidencias públicas permitidas

## Contratos a respetar

- `tenantSlug` como identificador público de ruta.
- `landingContent` como fuente preferida de contenido.
- `tenant.theme_config` como fuente preferida de apariencia.

## Riesgos

- `landingContent` puede no incluir secciones avanzadas.
- El backend puede no exponer `tenant.theme_config` aún.
- Cualquier hardcode de estilo rompería la personalización por tenant.

## Criterio de cierre

- Landing configurable por tenant.
- Portal cliente no roto.
- Theme y contenido resueltos por datos reales.
- Sin contenido falso ni endpoints inventados.

