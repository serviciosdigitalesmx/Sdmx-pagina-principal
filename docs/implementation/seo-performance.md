# SEO and Performance for `apps/web-clientes`

## Objetivo

Permitir SEO independiente por tenant en la landing pública sin tocar `apps/web-public`.

## Archivos modificados

- [`apps/web-clientes/src/app/layout.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/layout.tsx)
- [`apps/web-clientes/src/app/[tenantSlug]/page.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/%5BtenantSlug%5D/page.tsx)
- [`apps/web-clientes/src/app/t/[tenantSlug]/portal/page.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/t/%5BtenantSlug%5D/portal/page.tsx)
- [`apps/web-clientes/src/lib/landing/landing-renderer.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/landing/landing-renderer.tsx)

## Metadata implementada

### Landing pública

- `title` dinámico desde `landingContent.seoTitle`
- `description` dinámica desde `landingContent.seoDescription`
- `canonical` dinámico hacia `/t/:tenantSlug`
- `robots` indexable
- `OpenGraph` dinámico
- `Twitter cards` dinámicas
- `favicon` por tenant si existe `theme_config.faviconUrl` o `branding.faviconUrl`

### Portal cliente

- `title` dinámico de portal
- `description` controlada
- `canonical` hacia `/t/:tenantSlug/portal`
- `robots` `noindex, nofollow`

## Structured Data implementado

### Landing

- `LocalBusiness`
- `Service`

Usa datos reales del tenant:
- nombre del tenant
- teléfono si existe
- email si existe
- dirección si existe
- servicio principal desde `landingContent.services`

### Gaps

- `JSON-LD` de horarios aún depende de que el backend exponga horarios estructurados.
- `JSON-LD` de `Service` se mantiene genérico si el tenant no tiene servicios reales.
- No se creó un sitemap por tenant porque no existe una fuente pública para enumerar tenants de forma segura.

## Fuente preferida de SEO

- `tenants.seo_config` no está confirmado como contrato visible
- `landingContent.seoTitle`
- `landingContent.seoDescription`
- `theme_config` para favicon e imágenes
- `landing_content` para hero y servicios
- `contactPhone` / `contactEmail` / `contactAddress` cuando vienen del contrato público

## Performance aplicado

- imágenes del logo con `loading="lazy"` y `decoding="async"`
- `next/image` para galerías y evidencias cuando aplica
- contenido del portal y landing resuelto por API, no hardcoded
- estado seguro en 404 y errores
- un solo build para todos los tenants

## Gap de performance / SEO

- No hay endpoint confirmado para listar todos los tenants y construir un sitemap indexado por slug sin inventar rutas.
- No existe contrato confirmado para `tenants.seo_config` o `tenants.contact_config` como columnas separadas en el frontend.
- Si el backend no expone imágenes optimizadas por tenant, la landing debe caer a fallback visual seguro.

## Comportamiento seguro

- Landing: indexable si existe contenido real.
- Portal: no indexable para evitar exposición de folios privados.
- Folio inválido: no revela detalles internos.
- Error de API: no expone stack ni información de otro tenant.

## Validación

Comandos ejecutados:

```bash
pnpm --dir apps/web-clientes typecheck
pnpm --dir apps/web-clientes lint
```

Resultado:
- typecheck: OK
- lint: OK

Validación funcional:
- la landing genera metadata dinámica por tenant
- el portal queda protegido con `noindex`
- el structured data se inyecta en la landing

## Riesgos

- Si `NEXT_PUBLIC_APP_URL` no está configurado, `metadataBase` queda ausente y las URL absolutas dependen del entorno.
- Si el backend no entrega SEO real, la metadata usa fallback seguro.
- Si se agregan imágenes remotas no confiables, pueden requerir validación adicional de dominios en `next.config`.

## Qué no se tocó

- No se tocó `apps/web-public`.
- No se tocó `apps/web-admin`.
- No se inventaron títulos, descripciones o URLs por tenant.
- No se expuso `tenant_id`.
- No se creó sitemap fake.

