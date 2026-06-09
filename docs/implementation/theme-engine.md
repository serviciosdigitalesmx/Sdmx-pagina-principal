# Theme Engine Implementation

## Objetivo

Preparar en `apps/web-clientes` un Theme Engine configurable por tenant usando `tenant.theme_config` como fuente preferida.

## Archivos modificados

- [`apps/web-clientes/src/lib/types.ts`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/types.ts)
- [`apps/web-clientes/src/lib/theme/theme-resolver.ts`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/theme/theme-resolver.ts)
- [`apps/web-clientes/src/lib/theme/tenant-theme-provider.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/theme/tenant-theme-provider.tsx)
- [`apps/web-clientes/src/lib/landing/landing-renderer.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/landing/landing-renderer.tsx)
- [`apps/web-clientes/src/app/[tenantSlug]/page.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/%5BtenantSlug%5D/page.tsx)
- [`apps/web-clientes/src/app/t/[tenantSlug]/portal/page.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/t/%5BtenantSlug%5D/portal/page.tsx)

## Cómo se resuelve el tema por tenant

1. La ruta carga el tenant real por `tenantSlug`.
2. El frontend resuelve `tenant.theme_config` si existe.
3. Si `theme_config` no existe, se usan fallbacks seguros:
   - `tenant.branding.logoUrl`
   - `tenant.branding.faviconUrl`
   - `tenant.branding.primaryColor`
   - `tenant.branding.secondaryColor`
   - tokens neutros del sistema
4. `TenantThemeResolver` convierte el theme en variables CSS.
5. `TenantThemeProvider` aplica esas variables al árbol de UI.
6. Landing y portal consumen el mismo tema sin builds separados.

## Implementación

### `TenantThemeResolver`

- Normaliza colores, tipografía, imágenes, CTA y footer.
- Produce un set estable de CSS variables.
- No inventa valores por tenant.
- Mantiene fallback visual genérico cuando no hay personalización.

### `TenantThemeProvider`

- Recibe `tenantSlug` y el theme resuelto.
- Inyecta variables CSS dinámicas en el wrapper del contenido.
- Permite que landing y portal compartan la misma base visual.

### Aplicación al landing

- La landing pública usa el theme para:
  - hero
  - botones CTA
  - servicios
  - contacto
  - WhatsApp
  - galerías y secciones visuales

### Aplicación al portal

- El portal cliente usa el mismo theme para:
  - marca
  - botones
  - bordes
  - estados visuales
  - footer

## Gaps de DB/API

- El contrato real visible en el frontend todavía no garantiza `tenant.theme_config` desde API.
- Si el backend no expone `theme_config`, el resolver cae a `branding` y a tokens seguros.
- No se creó ni se asumió una migración de DB en esta tarea.
- No se tocó `apps/api`, así que el gap de persistencia sigue documentado, no inventado.

## Cómo validar

Comandos ejecutados:

```bash
pnpm --dir apps/web-clientes typecheck
pnpm --dir apps/web-clientes lint
```

Resultado:
- typecheck: OK
- lint: OK

Validación funcional esperada:
- Cambiar de tenant debe cambiar colores, logo y footer si `theme_config` trae datos reales.
- Si `theme_config` no existe, el sitio debe renderizar con fallback neutro sin romper.

## Riesgos

- El backend puede no estar entregando `theme_config` todavía.
- Si se agregan URLs inválidas de imágenes, algunas vistas pueden degradar visualmente.
- Si un tenant no define tema, la UX seguirá estable pero genérica.
- No debe duplicarse lógica de tema en más componentes; todo debe depender de este resolver.

## Qué no se tocó

- No se tocó `apps/web-public`.
- No se tocó `apps/web-admin`.
- No se tocó `apps/api`.
- No se crearon builds separados por tenant.
- No se agregaron mocks ni contenido falso.
- No se hardcodeó un tema por tenant.

