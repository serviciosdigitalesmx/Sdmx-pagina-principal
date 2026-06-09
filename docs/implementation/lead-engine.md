# Lead Engine Implementation

## Objetivo

Implementar en `apps/web-clientes` una capa real de captación de leads para la landing pública del tenant.

## Verificación previa

Documentos existentes:
- [`docs/implementation/landing-engine.md`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/implementation/landing-engine.md)
- [`docs/implementation/content-engine.md`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/implementation/content-engine.md)

## Archivos modificados

- [`apps/web-clientes/src/lib/api/leads.ts`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/api/leads.ts)
- [`apps/web-clientes/src/lib/lead/lead-form.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/lead/lead-form.tsx)
- [`apps/web-clientes/src/lib/landing/landing-renderer.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/landing/landing-renderer.tsx)
- [`apps/web-clientes/src/lib/content/content-validator.ts`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/content/content-validator.ts)
- [`apps/web-clientes/src/lib/content/content-resolver.ts`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/content/content-resolver.ts)
- [`apps/web-clientes/src/lib/content/content-renderer.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/content/content-renderer.tsx)
- [`apps/web-clientes/src/lib/landing/tenant-landing-loader.ts`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/lib/landing/tenant-landing-loader.ts)
- [`apps/web-clientes/src/app/[tenantSlug]/page.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/%5BtenantSlug%5D/page.tsx)

## Endpoints reales usados

### Público

- `POST /api/public/quotes`
- `GET /api/public/tenant/:tenantSlug/landing`
- `GET /api/public/tenant/:tenantSlug/orders/:folio`

### Contratos usados por el lead engine

- `tenantSlug`
- `fullName`
- `phone`
- `email`
- `deviceBrand`
- `deviceModel`
- `issue`
- `deviceType`
- `serialNumber`
- `priorityLevel`
- `passwordOrPin`
- `metadata`

## Implementación

### `LeadForm`

- Formulario cliente en la landing pública.
- Envía la solicitud a `POST /api/public/quotes`.
- Muestra:
  - estado de carga real
  - mensaje de éxito real
  - mensaje de error real del API
- No simula envío.

### `WhatsAppCTA`

- Abre WhatsApp usando el teléfono real del tenant.
- Usa `tenant.contactPhone` o `landingContent.contactPhone` si existen.

### `ContactCTA`

- Abre correo o contacto real si existe `contactHref`, `contactEmail` o `contactPhone`.
- Si no existe, no inventa contacto.

### `LocationCTA`

- Abre mapa real si `showMap` y `mapEmbedUrl` existen.
- Si no existen, usa búsqueda de mapa con la dirección real del tenant.

### `ServiceRequestForm` / `QuoteRequestForm`

- En esta implementación ambos quedan cubiertos por el mismo `LeadForm` porque el único endpoint público confirmado para captación es `POST /api/public/quotes`.
- No se inventó un endpoint separado para “service request”.

## Gaps detectados

- No existe contrato público confirmado para un endpoint separado de `service_requests` desde `web-clientes`.
- No se confirmó un endpoint público adicional para:
  - crear customer
  - abrir una solicitud no-cotización
  - registrar lead en otra tabla distinta a `service_requests`
- No se usa Supabase directo desde frontend.
- No se usa EmailJS, Firebase ni servicios externos.

## Comportamiento ante error

- Si el API responde 400:
  - el formulario muestra el error real del backend
- Si el API responde 404 o 502:
  - el formulario no marca éxito
  - el usuario ve el error real o un mensaje genérico controlado
- Si no existe conexión o falla la red:
  - no se crea nada local
  - no se muestra éxito falso

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
- La landing muestra un formulario real de captación.
- El envío pasa por la API pública real.
- Las CTAs de contacto no inventan datos.

## Decisiones tomadas

1. Usar el endpoint real `POST /api/public/quotes` como único flujo de lead confirmado.
2. Unificar lead, quote y service request bajo una misma experiencia de captura en frontend.
3. Mantener el portal cliente intacto.
4. Evitar duplicar formularios hasta que exista un endpoint público adicional confirmado.

## Qué no se tocó

- No se tocó `apps/web-public`.
- No se tocó `apps/web-admin`.
- No se tocó `apps/api`.
- No se guardó directo en Supabase desde frontend.
- No se usaron mocks.
- No se simuló éxito.
- No se hardcodeó tenant, teléfono ni URL.

