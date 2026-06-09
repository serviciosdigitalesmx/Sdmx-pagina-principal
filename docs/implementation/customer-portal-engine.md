# Customer Portal Engine

## Objetivo

Modernizar el portal cliente en `apps/web-clientes` para que un tenant pueda consultar órdenes reales sin exponer información interna.

## Rutas reales encontradas

- `/t/:tenantSlug/portal`
- `/t/:tenantSlug/portal?folio=...`
- `/t/:tenantSlug/portal?token=...`
- `/t/:tenantSlug/portal/:folio`

No se detectó una ruta pública distinta dentro de `apps/web-clientes` que reemplace al portal actual.

## Endpoints usados

- `GET /api/public/tenant/:tenantSlug/landing`
- `GET /api/public/tenant/:tenantSlug/orders/:folio`

El portal cliente sigue usando el contrato público ya existente para resolver tenant y orden.

## Datos públicos permitidos

- folio
- estado actual
- etiqueta de estado
- timeline público
- evidencias públicas permitidas
- documentos públicos vinculados
- mensajes públicos o notas visibles
- teléfono del tenant para soporte si viene del contrato público
- mapa o enlace de ubicación si existe en la landing del tenant

## Datos bloqueados

- `tenant_id`
- notas internas
- usuarios internos
- comentarios privados
- información administrativa
- datos de otro tenant
- costos internos si no se exponen públicamente
- errores internos del backend

## Implementación

### Archivos modificados

- [`apps/web-clientes/src/lib/portal/portal-view.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/portal/portal-view.tsx)
- [`apps/web-clientes/src/app/t/[tenantSlug]/portal/page.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/t/%5BtenantSlug%5D/portal/page.tsx)
- [`apps/web-clientes/src/app/t/[tenantSlug]/portal/[folio]/page.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/t/%5BtenantSlug%5D/portal/%5Bfolio%5D/page.tsx)

### Componentes preparados

- `PortalSearch`
- `PortalOrderStatus`
- `PublicTimeline`
- `PublicEvidenceGallery`
- `SafeNotFound`
- `WhatsAppSupportCTA`
- `TenantPortalLayout`

En esta implementación están integrados dentro de `PortalView` para no duplicar composición.

## Comportamiento seguro

### Folio válido

- Carga información real del tenant y de la orden.
- Muestra estado, timeline y evidencias permitidas.

### Folio inválido

- Muestra mensaje seguro.
- No expone el error interno real.
- No revela si existe otro tenant o una orden ajena.

### Error de API

- Se muestra un mensaje controlado.
- No hay éxito falso.
- No se filtran detalles internos.

## Tenant isolation

La consulta se resuelve siempre contra:
- slug del tenant en la ruta
- endpoint público de ese tenant

El portal no expone `tenant_id` ni permite cruzar datos entre tenants.

## Gaps detectados

- No existe una ruta separada obligatoria de `/portal` fuera del tenant path que sustituya la experiencia actual.
- No se expone un endpoint público adicional para evidencias si no vienen ya dentro del payload de orden.
- Si el backend no marca ciertos documentos como públicos, el portal no los inventa.

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
- `/t/:tenantSlug/portal` permite buscar por folio.
- `/t/:tenantSlug/portal/:folio` carga una orden real.
- Un folio inválido muestra error seguro.
- No aparecen datos internos.

## Qué no se tocó

- No se tocó `apps/web-public`.
- No se tocó `apps/web-admin`.
- No se tocó `apps/api`.
- No se usaron mocks.
- No se guardó nada directo en Supabase desde frontend.

