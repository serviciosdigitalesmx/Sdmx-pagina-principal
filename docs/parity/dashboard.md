# Parity Report: Dashboard

Fecha: 2026-05-26

Módulo objetivo:
- `Dashboard`

Orden de análisis:
- 1. Dashboard
- 2. Órdenes
- 3. Clientes
- 4. Técnicos
- 5. Inventario
- 6. Compras
- 7. Finanzas
- 8. Portal Cliente
- 9. Configuración

## Fase A. Mapear UI

### Source of truth

- [integrador.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/integrador.html)

### Target

- [apps/web-admin/src/components/dashboard/dashboard-shell.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/dashboard-shell.tsx)
- [apps/web-admin/src/components/dashboard/operational-hub.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/operational-hub.tsx)
- [apps/web-admin/src/app/dashboard/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/page.tsx)

### Inventario UI observado en source

- acceso interno
- barra de módulos
- selector de sucursal
- hub central
- acceso directo a recepción
- acceso directo a técnico
- fallback de módulos con enlaces rápidos
- copy operativo centrado en control interno

### Inventario UI observado en target

- sidebar por grupos
- header operativo con tenant / rol / sucursal
- barra de accesos rápidos
- hub con métricas
- secciones de órdenes activas y actividad reciente
- CTA a órdenes, finanzas, clientes, stock y reportes

### Gap visual

- source: panel único y compacto, con sensación de integrador central
- target: shell más SaaS, aunque ya está más cerca del contrato fuente

## Fase B. Mapear lógica

### Source

- la navegación del dashboard depende de pestañas y enlaces internos del integrador
- el módulo principal actúa como entrada a recepción y a las demás piezas operativas
- el dashboard muestra contexto por sucursal y rol

### Target

- la navegación depende de `DashboardShell`
- el contexto de tenant y sucursal viene del auth y del host
- el hub carga órdenes y resumen financiero reales desde `fixService`
- no se toca backend ni DTOs

### Diferencias funcionales relevantes

- source: entrada única al integrador
- target: dashboard distribuido en sidebar + hub + módulos

## Fase C. Detectar regresiones

### Regresiones detectadas

- `Partial parity`: el copy y la densidad visual aún no son idénticos al integrador fuente
- `Partial parity`: el acceso interno del source está unificado en una sola superficie
- `Partial parity`: el target reparte más responsabilidades entre shell, hub y módulos

### Sin regresiones

- no se detectó pérdida de tenant isolation
- no se detectó cambio de endpoints
- no se detectó cambio de DTOs
- no se detectó cambio de RLS

## Fase D. Implementar

### Cambios ya aplicados en este módulo

- [`apps/web-admin/src/components/dashboard/dashboard-shell.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/dashboard-shell.tsx)
  - copy más cercano a `SR FIX · Integrador Interno`
  - selector renombrado para reflejar contexto de sucursal
  - sombra y framing más densos

- [`apps/web-admin/src/components/dashboard/module-shell.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/module-shell.tsx)
  - estados vacíos más compatibles con el source
  - cards y tabla con más densidad visual

- [`apps/web-admin/src/components/dashboard/operational-hub.tsx`](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/operational-hub.tsx)
  - CTA y hero ajustados a la lógica del integrador
  - copy más operativo

### Pendiente para cerrar paridad total

- alinear todavía más el hub al flujo de `integrador.html`
- seguir reduciendo el carácter genérico del shell
- validar si un solo entrypoint visual puede aproximarse más al source sin romper la arquitectura actual

## Fase E. E2E

### Estado actual

- build monorepo: no cerrado por `@fixi/mobile`
- build específico `web-admin`: bloqueado por el entorno local de `pnpm`
- E2E visual: pendiente
- deploy: pendiente de validación posterior al build estable

### Criterio para cerrar este módulo

- visual igual
- funcional igual
- build OK
- deploy OK
- E2E OK
- sin mocks

### Estado del módulo

- `Dashboard`: PARCIAL

