# Tenant Website Engine Audit

Este documento audita referencias externas para orientar `apps/web-clientes` únicamente.

Alcance:
- `apps/web-clientes`
- Landing pública del tenant
- Portal cliente del tenant

Fuera de alcance:
- `apps/web-public`
- `apps/web-admin`
- `apps/api`

Reglas de referencia:
- No copiar backend externo
- No copiar `.env`
- No copiar datos mock
- No introducir stack ajeno por inercia
- Mantener Supabase, Render y Vercel como base del sistema

## Tabla comparativa

| Repo | Tipo | Calidad visual | Utilidad para Fixi | Partes aprovechables | Riesgos | Veredicto |
|---|---|---:|---|---|---|---|
| FixMyPhone (`Ujjalzaman/Repair-mobile-nextjs-full-stack`) | fullstack repair | media | usar parcial | Hero, Services, CTA, Contact, WhatsApp, Lead form, Portal search, Tracking timeline, SEO | backend acoplado, datos mock, UI reutilizable parcialmente, no multitenant | usar parcial |
| Autofix (`codewithsadee/autofix`) | landing pura | alta | usar | Hero, Services, CTA, Gallery, Testimonials, Contact, SEO | UI no multitenant, sin portal, posible hardcoded branding | usar |
| SS Phone Repair Website (`ssphonerepair/website`) | landing pura | media | usar parcial | Hero, Services, CTA, Contact, WhatsApp, Location/Map, SEO | UI vieja, no multitenant, posible contenido estático | usar parcial |
| Computer Repair Website (`francoms3/Computer-Repair-Website`) | landing pura | media | usar parcial | Hero, Services, CTA, Contact, Lead form, SEO | UI no reusable completa, no portal, probable hardcoded URLs | usar parcial |
| PC Repair Website (`memeghaj10/PC_repair_website`) | landing pura | baja | descartar | SEO y copy muy limitado | UI vieja, poca reutilización, no portal, no multitenant | descartar |
| Mobile Repair Shop (`Soap171/Mobile-Repair-Shop`) | fullstack repair | media | usar parcial | Hero, Services, CTA, Lead form, Portal search, Tracking timeline | backend acoplado, stack no alineado, no multitenant | usar parcial |
| Repair Guruji Client (`Sabbir185/repair-guruji-full-stack-client-side`) | dashboard | media | descartar | Portal search, Tracking timeline, estado | es cliente de un stack externo, acople fuerte, no landing pública completa | descartar |
| Cell Savers Frontend (`khshakilahamed/cell-savers-frontend`) | landing + portal | alta | usar | Hero, Services, CTA, Contact, WhatsApp, Gallery, Testimonials, Portal search, Tracking timeline, SEO | puede tener data fija o acople a API externa, no multitenant | usar |
| Mobile Repair Service Website (`Si-sultan/Mobile-Repair-Service-Website`) | landing pura | media | usar parcial | Hero, Services, CTA, Contact, Location/Map, SEO | portal ausente, UI genérica, probable contenido estático | usar parcial |
| Ready-made Computer Repair Service (`JusthackOne/Ready-made-computer-repair-service`) | landing pura | baja | descartar | poco reutilizable | UI vieja, branding cerrado, poco aporte para Fixi | descartar |

## Veredicto por repo

### 1) FixMyPhone
- Veredicto: usar parcial
- Qué aporta a `apps/web-clientes`:
  - Estructura de landing con hero, servicios, CTA y contacto.
  - Patrón de portal con búsqueda de orden y timeline.
  - Copy comercial de reparación orientado a conversión.
- Qué debe descartarse:
  - Backend y persistencia.
  - Cualquier dependencia de MongoDB, Firebase, Stripe o auth no alineada.
  - Cualquier URL fija o flujo que no sea multi-tenant.

### 2) Autofix
- Veredicto: usar
- Qué aporta a `apps/web-clientes`:
  - Lenguaje visual fuerte para landing del taller.
  - Hero con valor claro y CTA visibles.
  - Galería, testimonios y secciones de confianza.
- Qué debe descartarse:
  - Suposición de tenant único.
  - Cualquier integración que no exista en Fixi.

### 3) SS Phone Repair Website
- Veredicto: usar parcial
- Qué aporta a `apps/web-clientes`:
  - Estructura de landing con contacto, WhatsApp y mapa.
  - Enfoque local de servicio.
- Qué debe descartarse:
  - Diseño no diferenciado si es demasiado genérico.
  - Cualquier dependencia de contenido estático no editable por tenant.

### 4) Computer Repair Website
- Veredicto: usar parcial
- Qué aporta a `apps/web-clientes`:
  - Landing con servicios, CTA y formulario de lead.
  - Copy directo para cotización/servicio.
- Qué debe descartarse:
  - Componentes no adaptados a móvil.
  - Cualquier lógica de backend ajena.

### 5) PC Repair Website
- Veredicto: descartar
- Motivo:
  - Bajo valor visual y funcional.
  - Poco material reutilizable para landing o portal.

### 6) Mobile Repair Shop
- Veredicto: usar parcial
- Qué aporta a `apps/web-clientes`:
  - Flujo de lead y tracking.
  - Sección de estado/timeline con orientación a cliente.
- Qué debe descartarse:
  - Acople a stack externo.
  - Cualquier lógica no multi-tenant.

### 7) Repair Guruji Client
- Veredicto: descartar
- Motivo:
  - Es principalmente un cliente de un sistema externo.
  - No resuelve la landing pública ni aporta estructura multitenant clara.

### 8) Cell Savers Frontend
- Veredicto: usar
- Qué aporta a `apps/web-clientes`:
  - Mejor cobertura de landing + portal.
  - Secciones de confianza: gallery, testimonials, contacto y tracking.
  - Posible patrón de experiencia unificada por tenant.
- Qué debe descartarse:
  - Cualquier endpoint externo.
  - Cualquier hardcode de marca o entorno.

### 9) Mobile Repair Service Website
- Veredicto: usar parcial
- Qué aporta a `apps/web-clientes`:
  - Landing simple con CTA, servicios y ubicación.
  - SEO local básico.
- Qué debe descartarse:
  - Falta de portal cliente.
  - UI demasiado genérica si no eleva conversión.

### 10) Ready-made Computer Repair Service
- Veredicto: descartar
- Motivo:
  - Material poco reutilizable.
  - Baja utilidad para una experiencia SaaS multitenant.

## Qué se puede usar para landing del tenant

- Hero con promesa de servicio y CTA primario/secundario.
- Lista de servicios con cards cortas.
- Bloque de confianza con testimonios y galería.
- Contacto rápido con WhatsApp, teléfono, email y mapa.
- CTA a solicitud o cotización si existe endpoint real.
- Copy local orientado a búsquedas por ciudad y reparación específica.

## Qué se puede usar para portal cliente

- Campo de búsqueda por folio.
- Estado actual claro.
- Timeline de avances.
- Evidencias públicas permitidas, con control de visibilidad.
- Mensajes o eventos de seguimiento.
- CTA a WhatsApp para soporte.

## Qué se debe descartar

- Dependencias ajenas al stack objetivo.
- Hardcodes de dominio, endpoints o credenciales.
- UI que no soporte multi-tenant.
- Flujos que expongan datos internos.
- Cualquier mock o demo data como base funcional.

## Conceptos convertibles en componentes genéricos

- `HeroSection`
- `ServicesGrid`
- `TenantCtaRow`
- `ContactBlock`
- `WhatsAppButton`
- `MapEmbed`
- `GalleryGrid`
- `TestimonialsCarousel`
- `LeadForm`
- `OrderLookupForm`
- `TrackingTimeline`
- `PublicEvidenceGallery`
- `SeoLocalBlock`

## Gaps en `apps/web-clientes`

- La landing pública no cubre galería, testimonios, contacto completo ni ubicación.
- El portal cliente debe reforzar el contrato de ruta bajo `/t/:tenantSlug`.
- Falta un flujo claro de solicitud/cotización si hay endpoint real disponible.
- Falta un esquema explícito de evidencias públicas permitidas.
- Falta consolidar una experiencia visual más fuerte entre landing y portal.

## Endpoints reales necesarios para Fixi

No se inventan endpoints aquí. Lo que `apps/web-clientes` necesita consumir de forma real es:

- Resolución de tenant por `tenantSlug`.
- Contenido público de landing del tenant.
- Búsqueda pública de orden por `tenantSlug` y folio/token.
- Timeline público de la orden.
- Evidencias públicas permitidas por orden.
- Datos de contacto del tenant.
- Opcionalmente, endpoint real de solicitud/cotización si existe en el backend de Fixi.

## Qué no debe copiarse

- Backend de los repos externos.
- Modelos de datos de terceros.
- `.env`, secretos o credenciales.
- URLs absolutas de terceros.
- Branding ajeno.
- Stack ajeno al estándar de Fixi.

## Fuentes revisadas

- [FixMyPhone](https://github.com/Ujjalzaman/Repair-mobile-nextjs-full-stack)
- [Autofix](https://github.com/codewithsadee/autofix)
- [SS Phone Repair Website](https://github.com/ssphonerepair/website)
- [Computer Repair Website](https://github.com/francoms3/Computer-Repair-Website)
- [PC Repair Website](https://github.com/memeghaj10/PC_repair_website)
- [Mobile Repair Shop](https://github.com/Soap171/Mobile-Repair-Shop)
- [Repair Guruji Client](https://github.com/Sabbir185/repair-guruji-full-stack-client-side)
- [Cell Savers Frontend](https://github.com/khshakilahamed/cell-savers-frontend)
- [Mobile Repair Service Website](https://github.com/Si-sultan/Mobile-Repair-Service-Website)
- [Ready-made Computer Repair Service](https://github.com/JusthackOne/Ready-made-computer-repair-service)
