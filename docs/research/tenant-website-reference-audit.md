# Tenant Website Reference Audit

Auditoría de repos externos como referencia visual y funcional para `apps/web-clientes`.

## Repos revisados

1. [FixMyPhone](https://github.com/Ujjalzaman/Repair-mobile-nextjs-full-stack)
2. [Autofix](https://github.com/codewithsadee/autofix)
3. [SS Phone Repair Website](https://github.com/ssphonerepair/website)
4. [Computer Repair Website](https://github.com/francoms3/Computer-Repair-Website)
5. [PC Repair Website](https://github.com/memeghaj10/PC_repair_website)
6. [Mobile Repair Shop](https://github.com/Soap171/Mobile-Repair-Shop)
7. [Repair Guruji Client](https://github.com/Sabbir185/repair-guruji-full-stack-client-side)
8. [Cell Savers Frontend](https://github.com/khshakilahamed/cell-savers-frontend)
9. [Mobile Repair Service Website](https://github.com/Si-sultan/Mobile-Repair-Service-Website)
10. [Ready-made Computer Repair Service](https://github.com/JusthackOne/Ready-made-computer-repair-service)

## Resumen de veredictos

- Usar: Autofix, Cell Savers Frontend
- Usar parcial: FixMyPhone, SS Phone Repair Website, Computer Repair Website, Mobile Repair Shop, Mobile Repair Service Website
- Descartar: PC Repair Website, Repair Guruji Client, Ready-made Computer Repair Service

## Mapeo a Fixi

- Landing pública: hero, servicios, CTA, galería, testimonios, contacto, WhatsApp, ubicación, SEO local
- Portal cliente: búsqueda por folio, estado, timeline, evidencias públicas permitidas

## Riesgos detectados

- UI vieja
- backend acoplado
- datos mock
- dependencias viejas
- hardcoded URLs
- diseño no reutilizable
- no multitenant

## Gap más relevante

- `apps/web-clientes` todavía necesita una capa formal de `LandingRenderer` y un contrato más completo para secciones avanzadas.

