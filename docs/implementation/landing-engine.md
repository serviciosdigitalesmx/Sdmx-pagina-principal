# Landing Engine Implementation

## Objetivo

Preparar en `apps/web-clientes` un sistema de renderizado configurable para la landing pública del tenant.

## Archivos modificados

- [`apps/web-clientes/src/app/[tenantSlug]/page.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/%5BtenantSlug%5D/page.tsx)
- [`apps/web-clientes/src/lib/types.ts`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/types.ts)
- [`apps/web-clientes/src/lib/landing/landing-renderer.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/landing/landing-renderer.tsx)
- [`apps/web-clientes/src/lib/landing/landing-section-factory.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/landing/landing-section-factory.tsx)
- [`apps/web-clientes/src/lib/landing/section-registry.ts`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/landing/section-registry.ts)
- [`apps/web-clientes/src/lib/landing/tenant-landing-loader.ts`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/landing/tenant-landing-loader.ts)
- [`apps/web-clientes/src/app/t/[tenantSlug]/portal/page.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/t/%5BtenantSlug%5D/portal/page.tsx)
- [`docs/plan/tenant-website-engine-master-plan.md`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/plan/tenant-website-engine-master-plan.md)
- [`docs/research/fixi-tenant-website-audit.md`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/research/fixi-tenant-website-audit.md)
- [`docs/research/tenant-website-reference-audit.md`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/research/tenant-website-reference-audit.md)

## Rutas afectadas

- `/[tenantSlug]`
- `/t/[tenantSlug]/portal`

No se tocó:
- `apps/web-public`
- `apps/web-admin`
- `apps/api`

## Contratos usados

### Contratos reales existentes

- `GET /api/public/tenant/:tenantSlug/landing`
- `GET /api/public/tenant/:tenantSlug/orders/:folio`

### Contrato de contenido usado por la landing

- `tenant`
- `landingContent`

La fuente preferida de contenido es `landingContent` del tenant resuelto por API.

## Implementación

### `TenantLandingLoader`

- Resuelve el payload del tenant con el contrato real existente.
- Devuelve un estado seguro si no hay landing disponible.

### `LandingSectionRegistry`

- Define qué secciones pueden renderizarse.
- Permite activar o desactivar secciones según el contenido real disponible.

### `LandingSectionFactory`

- Coordina la decisión de qué renderizar.
- Evita duplicar lógica entre la vista y el contenido.

### `LandingRenderer`

- Renderiza hero, servicios, beneficios, nosotros, galería, testimonios, FAQ, contacto, WhatsApp CTA y cotización si hay dato real.
- Usa fallback seguro cuando falta información.
- No inventa contenido.

## Gaps detectados

- `landingContent` actual todavía no garantiza todas las secciones avanzadas en todos los tenants.
- El backend no fue modificado en esta tarea, así que si el contrato no trae:
  - galería
  - FAQ
  - testimonios
  - bloque de “nosotros”
  - flujo de solicitud/cotización

  esas secciones no aparecen y el renderer conserva estado seguro.
- No se implementó una migración de backend porque no se pidió tocar `apps/api`.

## Validación local

Comandos ejecutados:

```bash
pnpm --dir apps/web-clientes typecheck
pnpm --dir apps/web-clientes lint
```

Resultado:
- typecheck: OK
- lint: OK

## Qué no se tocó

- No se tocó `apps/web-public`.
- No se tocó `apps/web-admin`.
- No se tocó `apps/api`.
- No se cambiaron credenciales ni variables de entorno.
- No se añadieron mocks ni datos falsos.
- No se inventaron endpoints nuevos.

## Estado operativo

La landing pública ahora:
- puede renderizarse por tenant con dato real
- usa secciones configurables por contenido disponible
- cae en estado seguro cuando falta contenido
- no rompe el portal cliente

