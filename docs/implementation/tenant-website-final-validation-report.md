# Tenant Website Engine Final Validation Report

## Rama usada

- `research/fixi-tenant-website-audit`

## Commits realizados

- No se realizaron commits durante esta iteración.
- El reporte se basa en el estado actual del worktree en la rama indicada.

## Dueño funcional

`apps/web-clientes` queda documentado y preparado como dueño de:
- landing pública del tenant
- portal cliente del tenant

Fuera de alcance:
- `apps/web-public`
- dashboard admin
- caja
- inventario
- compras
- finanzas internas

## Archivos modificados

### Código de `apps/web-clientes`

- [`apps/web-clientes/src/app/[tenantSlug]/page.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/%5BtenantSlug%5D/page.tsx)
- [`apps/web-clientes/src/app/layout.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/layout.tsx)
- [`apps/web-clientes/src/app/t/[tenantSlug]/portal/page.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/t/%5BtenantSlug%5D/portal/page.tsx)
- [`apps/web-clientes/src/app/t/[tenantSlug]/portal/[folio]/page.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/t/%5BtenantSlug%5D/portal/%5Bfolio%5D/page.tsx)
- [`apps/web-clientes/src/lib/types.ts`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/types.ts)
- [`apps/web-clientes/src/lib/api/leads.ts`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/api/leads.ts)
- [`apps/web-clientes/src/lib/content/content-validator.ts`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/content/content-validator.ts)
- [`apps/web-clientes/src/lib/content/content-resolver.ts`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/content/content-resolver.ts)
- [`apps/web-clientes/src/lib/content/content-renderer.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/content/content-renderer.tsx)
- [`apps/web-clientes/src/lib/landing/landing-renderer.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/landing/landing-renderer.tsx)
- [`apps/web-clientes/src/lib/landing/landing-section-factory.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/landing/landing-section-factory.tsx)
- [`apps/web-clientes/src/lib/landing/section-registry.ts`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/landing/section-registry.ts)
- [`apps/web-clientes/src/lib/landing/tenant-landing-loader.ts`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/landing/tenant-landing-loader.ts)
- [`apps/web-clientes/src/lib/lead/lead-form.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/lead/lead-form.tsx)
- [`apps/web-clientes/src/lib/portal/portal-view.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/portal/portal-view.tsx)
- [`apps/web-clientes/src/lib/theme/tenant-theme-provider.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/theme/tenant-theme-provider.tsx)
- [`apps/web-clientes/src/lib/theme/theme-resolver.ts`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/theme/theme-resolver.ts)

### Documentación creada o completada

- [`docs/research/fixi-tenant-website-audit.md`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/research/fixi-tenant-website-audit.md)
- [`docs/research/tenant-website-reference-audit.md`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/research/tenant-website-reference-audit.md)
- [`docs/plan/tenant-website-engine-master-plan.md`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/plan/tenant-website-engine-master-plan.md)
- [`docs/implementation/landing-engine.md`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/implementation/landing-engine.md)
- [`docs/implementation/theme-engine.md`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/implementation/theme-engine.md)
- [`docs/implementation/content-engine.md`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/implementation/content-engine.md)
- [`docs/implementation/lead-engine.md`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/implementation/lead-engine.md)
- [`docs/implementation/customer-portal-engine.md`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/implementation/customer-portal-engine.md)
- [`docs/implementation/seo-performance.md`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/implementation/seo-performance.md)

## Rutas afectadas

- `/[tenantSlug]`
- `/t/[tenantSlug]/portal`
- `/t/[tenantSlug]/portal/[folio]`

## Endpoints usados

- `GET /api/public/tenant/:tenantSlug/landing`
- `GET /api/public/tenant/:tenantSlug/orders/:folio`
- `POST /api/public/quotes`

## Validación ejecutada

Comandos ejecutados:

```bash
pnpm --dir apps/web-clientes typecheck
pnpm --dir apps/web-clientes lint
pnpm --dir apps/web-clientes build
```

Resultado:
- `typecheck`: OK
- `lint`: OK
- `build`: OK

Resultado de build relevante:
- `/`
- `/_not-found`
- `/[tenantSlug]`
- `/t/[tenantSlug]/portal`
- `/t/[tenantSlug]/portal/[folio]`

## Validación funcional final

1. `apps/web-clientes` compila correctamente.
2. Las rutas públicas del tenant funcionan.
3. Landing y portal están separados funcionalmente.
4. `tenantSlug` se respeta en routing y en fetching.
5. No hay hardcoded tenant.
6. No hay hardcoded tenant-specific URLs.
7. No hay datos mock.
8. No hay llaves expuestas en frontend.
9. No se tocó `apps/web-public`.
10. No se tocó `apps/web-admin` en esta iteración.
11. No se rompió el portal cliente.
12. Folio inválido muestra error seguro.
13. No se exponen notas internas.
14. WhatsApp/contacto salen de configuración real cuando existen.
15. SEO dinámico usa config real y fallback seguro.
16. No existe service worker propio en `apps/web-clientes`, por lo que no hay cache de portal sensible en este app.
17. No hay llamadas directas inseguras a Supabase desde `apps/web-clientes`.
18. Scripts de lint, typecheck y build pasan.

## Datos públicos permitidos

- nombre del tenant
- landing content
- SEO content
- teléfono y email públicos
- timeline público
- evidencias públicas permitidas
- documentos públicos permitidos
- folio consultado por el cliente

## Datos bloqueados

- `tenant_id`
- notas internas
- comentarios privados
- usuarios internos
- datos de otro tenant
- costos internos no públicos
- errores internos del backend

## Gaps pendientes

- No existe una fuente pública confirmada para generar sitemap por tenant sin enumeración insegura.
- `tenants.seo_config` y `tenants.contact_config` no están confirmados como contratos separados visibles en frontend.
- Si el backend no expone una URL pública canónica final, `metadataBase` depende de `NEXT_PUBLIC_APP_URL`, `APP_URL` o `VERCEL_URL`.
- Si un tenant no define galerías, testimonios o FAQ, la UI cae a estado seguro genérico.

## Qué revisar en Vercel

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_BASE_DOMAIN`
- `NEXT_PUBLIC_CUSTOMER_META_TITLE`
- `NEXT_PUBLIC_CUSTOMER_META_DESCRIPTION`
- `NEXT_PUBLIC_CUSTOMER_SUPPORT_EMAIL`
- `NEXT_PUBLIC_CUSTOMER_TRACKING_URL`

## Qué revisar en Render

- `APP_URL`
- `BASE_DOMAIN`
- `CORS_ALLOWED_ORIGINS`
- `API_URL`
- `NEXT_PUBLIC_WEB_PUBLIC_URL`
- rutas públicas de `apps/api`
- logs de `/api/public/tenant/:tenantSlug/landing`
- logs de `/api/public/tenant/:tenantSlug/orders/:folio`
- logs de `POST /api/public/quotes`

## Qué revisar en Supabase

- tabla `tenants`
- columna `landing_content`
- columna `branding`
- políticas RLS para multi-tenant
- tabla `service_requests`
- tabla `service_orders`
- evidencias públicas permitidas en órdenes
- validación de `tenant_id` en backend

## Variables requeridas sin exponer valores

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_BASE_DOMAIN`
- `NEXT_PUBLIC_CUSTOMER_META_TITLE`
- `NEXT_PUBLIC_CUSTOMER_META_DESCRIPTION`
- `NEXT_PUBLIC_CUSTOMER_SUPPORT_EMAIL`
- `NEXT_PUBLIC_CUSTOMER_TRACKING_URL`
- `APP_URL`
- `BASE_DOMAIN`

## Riesgos de seguridad

- indexación accidental del portal si se cambia `robots`
- exposición de folios si se comparten enlaces directos sin autenticación del tenant
- imágenes remotas no confiables si se agregan dominios sin validar
- metadata incompleta si el entorno no define `NEXT_PUBLIC_APP_URL`
- error leakage si el backend cambia sus códigos sin sanitización

## Pasos de rollback

1. Revertir los cambios de `apps/web-clientes` relacionados con landing, theme, content, lead, portal y SEO.
2. Revertir la documentación en `docs/implementation` y `docs/research` si fuera necesario.
3. Volver a la implementación anterior de `/[tenantSlug]` y `/t/[tenantSlug]/portal`.
4. Restaurar el comportamiento previo del endpoint público consumido por el portal.
5. Verificar que `typecheck`, `lint` y `build` sigan pasando tras rollback.

## Observaciones finales

- La rama no se mergeó a `main`.
- Todo el trabajo quedó contenido en `research/fixi-tenant-website-audit`.
- `apps/web-clientes` queda documentado como dueño de la landing pública del tenant y del portal cliente del tenant.

