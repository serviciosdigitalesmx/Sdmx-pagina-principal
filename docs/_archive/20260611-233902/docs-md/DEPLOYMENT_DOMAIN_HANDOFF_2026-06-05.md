# Deployment Domain Handoff

Fecha de referencia: `2026-06-05`

## Objetivo

Consolidar el endpoint público del backend para que todos los frontends consuman el API correcto en producción, sin referencias residuales a dominios alternos.

## Dominio canónico

- Frontend público y apps relacionadas: `serviciosdigitalesmx.online`
- API base canónica: `https://api.serviciosdigitalesmx.online`

## Estado final verificado

- Render:
  - El servicio backend sigue siendo `sdmx-backend-api`
  - El custom domain creado para el API es `api.serviciosdigitalesmx.online`
- Vercel:
  - `web-public` usa `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_BASE_URL` y `NEXT_PUBLIC_RENDER_API_URL`
  - `web-clientes` usa las mismas variables de API
  - `web-admin` usa las mismas variables de API
- Backend:
  - CORS y validaciones quedaron alineados al dominio canónico `serviciosdigitalesmx.online`

## Qué se descartó

Durante el proceso aparecieron referencias a `serviciosdigitales.online`.

Ese dominio fue descartado como destino operativo porque no es el dominio canónico del proyecto.

## Fuentes de verdad

- [docs/DEPLOYMENT_SOURCE_OF_TRUTH.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/DEPLOYMENT_SOURCE_OF_TRUTH.md)
- [scripts/check-endpoints.mjs](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/scripts/check-endpoints.mjs)
- [scripts/setup-vercel.sh](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/scripts/setup-vercel.sh)

## Notas operativas

- El cambio de DNS no vive en GitHub ni en Render; se valida en el proveedor DNS/registrador.
- Si el dominio público no resuelve todavía, revisar la delegación del dominio `serviciosdigitalesmx.online` antes de tocar Vercel o Render.
