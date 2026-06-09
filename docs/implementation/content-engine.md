# Content Engine Implementation

## Objetivo

Preparar en `apps/web-clientes` una capa de contenido editable y segura para la landing del tenant, usando fuente real y sin inventar datos.

## Verificación previa

Documentos existentes:
- [`docs/implementation/landing-engine.md`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/implementation/landing-engine.md)
- [`docs/implementation/theme-engine.md`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/implementation/theme-engine.md)

## Archivos modificados

- [`apps/web-clientes/src/lib/types.ts`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/types.ts)
- [`apps/web-clientes/src/lib/content/content-validator.ts`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/content/content-validator.ts)
- [`apps/web-clientes/src/lib/content/content-resolver.ts`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/content/content-resolver.ts)
- [`apps/web-clientes/src/lib/content/content-renderer.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/content/content-renderer.tsx)
- [`apps/web-clientes/src/lib/landing/tenant-landing-loader.ts`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/landing/tenant-landing-loader.ts)
- [`apps/web-clientes/src/lib/landing/landing-renderer.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/landing/landing-renderer.tsx)
- [`apps/web-clientes/src/app/[tenantSlug]/page.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/%5BtenantSlug%5D/page.tsx)

## Contratos encontrados

### En `apps/api`

El endpoint público de landing ya existe y resuelve contenido real:
- `GET /api/public/tenant/:tenantSlug/landing`

El controller público ya compone:
- `tenant`
- `landingContent`
- `seoTitle`
- `seoDescription`
- `services`
- `socialLinks`
- `showMap`
- `mapEmbedUrl`
- `showVideo`
- `videoUrl`

También extrae contacto desde `landing_content`:
- `contactPhone`
- `contactEmail`

### En `apps/web-clientes`

La app ya consumía:
- `tenant`
- `landingContent`

Ahora además normaliza:
- hero
- servicios
- beneficios
- FAQ
- galería
- testimonios
- horarios
- contacto
- WhatsApp
- SEO

## Contratos faltantes

No existe contrato confirmado en el frontend para:
- `tenants.contact_config`
- `tenants.seo_config`

Tampoco se confirmó una columna separada distinta de `landing_content` para:
- horarios estructurados
- redes sociales estructuradas fuera de `landingContent.socialLinks`
- CTA de cotización como endpoint formal aparte en el frontend

## Decisiones tomadas

1. Usar `landing_content` como fuente principal de contenido.
2. Mantener `tenant.contactPhone`, `tenant.contactEmail` y `tenant.contactAddress` como fallback operativo cuando el backend los exponga por el contrato público.
3. Normalizar contenido antes de renderizar.
4. Validar contenido mínimo requerido.
5. Mostrar estados vacíos reales cuando falten secciones.
6. No inventar arrays ni contenido local.
7. Exponer SEO desde `landingContent` y usarlo en metadata de la ruta.

## Implementación

### `ContentValidator`

- Valida la forma mínima del contenido.
- Rechaza `landingContent` vacío o inválido.
- Normaliza servicios, beneficios, FAQ, testimonios, galería y redes.

### `ContentResolver`

- Toma `tenant` y `landingContent` crudo.
- Devuelve contenido normalizado y lista de issues.
- No expone `tenant_id`.

### `ContentRenderer`

- Actúa como punto de renderizado del contenido ya resuelto.
- Hoy reutiliza el renderer de landing para no duplicar UI.

### Integración en `LandingRenderer`

- Usa contenido validado y normalizado.
- Muestra estados vacíos si no hay servicios, galería o redes.
- Usa SEO del contenido para la metadata de la ruta.

## Gaps de DB/API

- `contact_config` no está confirmado en el contrato visible.
- `seo_config` no está confirmado como tabla/columna separada.
- Si el backend agrega esos campos más adelante, el resolver puede ampliarse sin romper la UI.
- No se tocó `apps/api` en esta tarea.

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
- Si el tenant trae contenido real, la landing lo renderiza.
- Si faltan datos, la UI muestra estados vacíos seguros.
- La metadata SEO usa el contenido resuelto.

## Riesgos

- Si `landing_content` está incompleto, la landing se verá funcional pero con menos secciones.
- Si el backend deja de enviar `seoTitle`/`seoDescription`, la metadata usará fallback neutral.
- Si una URL de imagen es inválida, la sección correspondiente puede degradarse visualmente.

## Qué no se tocó

- No se tocó `apps/web-public`.
- No se tocó `apps/web-admin`.
- No se tocó `apps/api`.
- No se usaron mocks.
- No se inventó contenido.
- No se expusieron `tenant_id` ni datos internos.

