# Customer Portal / Tracking UI Modernization

## Scope

Modernización del portal del cliente y tracking público en `apps/web-public`, usando contratos reales del backend. No se tocó backend, auth ni multitenancy.

## Validación previa

- `docs/implementation/cash-pos-finance-ui.md` existe.
- Caja/finanzas cargan con datos reales.
- Órdenes siguen funcionando.
- Inventario sigue funcionando.
- Tenant isolation permanece intacto.

## Archivos modificados

- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/t/[tenantSlug]/portal/page.tsx`

## Qué cambió

- Se mantuvo el portal público por folio con navegación móvil clara.
- Se reforzó el error 404/folio inválido con mensajes seguros y genéricos.
- Se eliminó cualquier exposición visual de `note` en el timeline público.
- El timeline ahora se presenta como seguimiento público, sin texto interno del taller.
- Se añadió resolución de WhatsApp desde configuración real del tenant o variables de entorno públicas:
  - `portalTemplate.contactHref`
  - `tenant.contact_phone`
  - `NEXT_PUBLIC_SAAS_CONTACT_PHONE`
- Se mantuvo el PDF público solo cuando el backend lo entrega.
- No se usaron mocks ni datos falsos.

## Antes / Después funcional

### Antes

- El portal mostraba el timeline con texto de `note`, lo que podía arrastrar información interna.
- El CTA de WhatsApp dependía solo de un contacto implícito.
- Los mensajes de error podían ser más explícitos de lo necesario.

### Después

- El cliente puede consultar por folio válido y ver estado, timeline y evidencias públicas permitidas.
- Un folio inválido devuelve error seguro sin enumerar información interna.
- No se muestran notas internas del taller.
- WhatsApp usa configuración real o env, no hardcode.

## Gaps comprobados

- El backend público no expone una API de tracking adicional distinta al portal por folio; el flujo real disponible es `GET /api/public/tenant/:tenantSlug/orders/:folio`.
- No se añadió búsqueda por correo como capa principal porque el objetivo es consulta por folio y no se debe abrir enumeración insegura.
- No se expusieron `tenant_id` ni campos internos de operación.

## Riesgos

- Si el backend devuelve eventos con notas sensibles, esta UI no las renderiza, pero el contrato debe seguir manteniendo separación entre públicos e internos.
- El CTA de WhatsApp depende de configuración del tenant o de `NEXT_PUBLIC_SAAS_CONTACT_PHONE`.
- La seguridad frente a enumeración depende también de la política backend y de rate limiting externo.

## Cómo validar localmente

1. Levantar `apps/api` con un tenant real.
2. Levantar `apps/web-public`.
3. Abrir una ruta como `/t/<tenantSlug>/portal`.
4. Probar un folio válido y confirmar:
   - carga estado real
   - muestra timeline público
   - muestra solo evidencias públicas
   - el botón de WhatsApp abre un enlace real
5. Probar un folio inválido y confirmar que solo muestra error seguro.

## Qué no se tocó

- Backend
- Auth
- Supabase policies
- Tenant isolation
- Órdenes internas
- Inventario
- Finanzas
- Caja/POS
- Notas internas
- Tenant ID en frontend
- Mocks

