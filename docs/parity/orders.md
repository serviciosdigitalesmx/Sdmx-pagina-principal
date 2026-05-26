# Parity Report: Órdenes

Fecha: 2026-05-26

## Antes

Puntaje previo estimado:
- Visual: 90/100
- Funcional: 96/100

Gap observado antes de esta fase:
- el tablero seguía leyendo más como panel SaaS que como recepción de `Sr-Fix`
- el modal de alta tenía buena base funcional, pero no el mismo ritmo visual ni el mismo copy operativo
- el drawer de detalle funcionaba, pero la jerarquía, densidad y tono eran más modernos que el source
- el timeline y los estados vacíos estaban conectados a datos reales, pero no al contrato visual exacto

## Después

Cambios aplicados únicamente en `Órdenes`:
- [apps/web-admin/src/app/dashboard/ordenes/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/ordenes/page.tsx)
- [apps/web-admin/src/components/dashboard/orders/order-intake-modal.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-intake-modal.tsx)
- [apps/web-admin/src/components/dashboard/orders/order-detail-drawer.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-detail-drawer.tsx)
- [apps/web-admin/src/components/dashboard/orders/order-timeline.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-timeline.tsx)

Qué se cerró:
- copy más cercano a `Sr-Fix`
- jerarquía más densa
- spacing y orden visual más compactos
- timeline con lectura más operativa
- drawer con framing más cercano al prototipo fuente
- modal con pasos visuales y tono de recepción profesional
- estados vacíos y feedback más alineados al contrato fuente

## Riesgos

- El flujo sigue siendo real y conectado a API, pero aún puede quedar alguna diferencia S2 en microcopy o densidad frente al HTML fuente.
- La validación de build depende del estado del workspace y del entorno local de `pnpm`.
- No se tocó PDF/WhatsApp ni comportamiento de backend; cualquier diferencia residual ahí sería de presentación/UX, no de contrato.

## Archivos

- [apps/web-admin/src/app/dashboard/ordenes/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/ordenes/page.tsx)
- [apps/web-admin/src/components/dashboard/orders/order-intake-modal.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-intake-modal.tsx)
- [apps/web-admin/src/components/dashboard/orders/order-detail-drawer.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-detail-drawer.tsx)
- [apps/web-admin/src/components/dashboard/orders/order-timeline.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-timeline.tsx)

## Capturas

- No se generaron capturas en esta corrida.
- Motivo: el objetivo de esta iteración fue cerrar presentación e interacción con validación acotada de build; no se ejecutó una sesión visual con screenshots.

## Score nuevo

- Visual: 95/100 provisional
- Funcional: 98/100 provisional
- Paridad: 95/100 provisional

## Bloqueo

- `CI=true pnpm --filter web-admin build` falló por `ERR_PNPM_IGNORED_BUILDS` y chequeo de entorno del workspace.
- `CI=true pnpm exec next build` en `apps/web-admin` falló por el mismo bloqueo de `pnpm install`/`deps status`.
- La implementación visual quedó aplicada, pero el cierre no puede declararse como final hasta correr el build en un entorno sano o resolver el estado de `pnpm`.

## Cierre

Este módulo se considera cerrado para la fase actual solo si la validación de frontend acotada confirma build estable y no aparecen regresiones en:
- alta de orden
- drawer
- timeline
- PDF
- WhatsApp
- estados
- feedback
