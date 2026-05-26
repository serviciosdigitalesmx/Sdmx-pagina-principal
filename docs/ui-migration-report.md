# UI Migration Report

Fecha: 2026-05-26

Alcance:
- Solo frontend visual
- Sin tocar lógica
- Sin tocar DTOs
- Sin tocar endpoints
- Sin tocar RLS
- Sin tocar `tenant_id`

## Antes

El frontend de `web-admin` ya operaba con un shell oscuro, pero todavía estaba más cerca de un SaaS genérico que del contrato visual de `Sr-Fix`.

Desalineaciones principales detectadas en la auditoría:
- jerarquía menos densa que el integrador fuente
- copy de cabecera más genérico
- navegación lateral menos parecida a la barra de módulos del prototipo
- superficies de cards y tablas con menos contraste operativo
- estados vacíos menos cercanos al lenguaje del prototipo

## Después

Se ajustó la capa visual de `web-admin` para acercarla al contrato de `Sr-Fix` sin tocar la lógica:

- [apps/web-admin/src/components/dashboard/dashboard-shell.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/dashboard-shell.tsx)
  - cabecera más cercana al integrador
  - sidebar más denso
  - barra superior con contexto de tenant y sucursal más visible

- [apps/web-admin/src/components/dashboard/module-shell.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/module-shell.tsx)
  - cards de métricas y tabla con apariencia más operativa
  - estados vacíos más compatibles con el contrato fuente
  - jerarquía visual más compacta y uniforme

- [apps/web-admin/src/components/dashboard/operational-hub.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/operational-hub.tsx)
  - portada operativa con copy más cercano a `Sr-Fix`
  - CTA y bloques de actividad más alineados al prototipo
  - mayor densidad visual sin cambiar la data real

## Archivos tocados

- [apps/web-admin/src/components/dashboard/dashboard-shell.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/dashboard-shell.tsx)
- [apps/web-admin/src/components/dashboard/module-shell.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/module-shell.tsx)
- [apps/web-admin/src/components/dashboard/operational-hub.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/operational-hub.tsx)

## Riesgos

- El ajuste es visual, no un clon pixel-perfect del HTML fuente.
- Algunos módulos específicos todavía dependen de su propio contenido y pueden requerir una segunda pasada si se busca equivalencia total por pantalla.
- `npm run build` en el monorepo no quedó verde por el paquete móvil; el error no proviene de los cambios visuales de `web-admin`.
- La validación específica de `web-admin` también quedó bloqueada por el estado del entorno `pnpm` en esta máquina.

## Capturas generadas

- No se generaron capturas en esta pasada.
- Motivo: la validación quedó bloqueada por el entorno de build de `pnpm` antes de levantar una sesión visual estable.

## Validación ejecutada

- `npm run build` falló por `@fixi/mobile`
- `CI=true npm run build` falló por `@fixi/mobile`
- `CI=true pnpm --filter web-admin build` falló por estado del entorno `pnpm`

## Notas

La auditoría fuente de verdad para esta migración sigue siendo:
- [docs/ui/source-truth.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/ui/source-truth.md)

