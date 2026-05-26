# Global Gap Report

Fecha: 2026-05-26

Source of truth:
- [Sr-Fix](https://github.com/serviciosdigitalesmx/Sr-Fix)

Target:
- [Sdmx-pagina-principal](/Users/jesusvilla/Desktop/Sdmx-pagina-principal)

## Resumen Ejecutivo

La base funcional de SDMX ya está conectada a APIs reales, tenant isolation y Supabase. El gap principal ya no es de contratos ni de backend: es de experiencia percibida, densidad visual, copy operativo y composición de pantallas frente a `Sr-Fix`.

## Clasificación de Diferencias

### S1

- Ninguna regresión crítica detectada en esta auditoría sobre el backend o los contratos.
- No se detectó una ruptura que impida operar login, tenant, órdenes, portal, PDF, WhatsApp o tracking.

### S2

- `Dashboard` todavía se percibe como shell distribuido y no como integrador compacto.
- `Órdenes` aún no clona el flujo exacto de recepción profesional.
- `Portal Cliente` difiere en densidad, jerarquía y framing respecto al HTML fuente.
- `Landing pública` conserva una interpretación moderna del contrato.
- Varios módulos internos siguen usando labels y vacíos más cercanos a SaaS que a Sr-Fix.

### S3

- Sombras, radios y microcopy en varias superficies.
- Diferencias menores de espaciado y peso tipográfico.
- Variaciones de botones secundarios y badges.

## Gaps por Área

### 1. Dashboard

- Source: integrador único, compacto, centrado en módulos.
- Target: shell + hub + módulos.
- Estado: `S2`

### 2. Órdenes

- Source: recepción profesional con pasos claros, confirmación y detalle.
- Target: funcionalmente real, pero todavía interpretado.
- Estado: `S2`

### 3. Portal Cliente

- Source: portal directo por folio con timeline, archivos y contacto.
- Target: funcional y real, pero menos denso.
- Estado: `S2`

### 4. Landing

- Source: landing comercial con copy directo y ruta pública clara.
- Target: landing real, más moderna y menos literal.
- Estado: `S2`

### 5. Módulos internos

- Source: paneles densos, estados y tablas muy explícitos.
- Target: módulo uniforme con shell común, pero aún genérico en vacíos y labels.
- Estado: `S2`

## Riesgos Detectados

- Si se fuerza demasiado la réplica visual sin cuidar contexto multi-tenant, se puede perder claridad operativa.
- Si se toca backend para “parecerse” al source, se rompe el alcance.
- Si se prioriza cosmética por encima de flujo, el resultado seguirá sin llegar a `95%+`.

## Recomendación

Priorizar:
1. `Órdenes`
2. `Portal Cliente`
3. `Landing`
4. `Dashboard`
5. `Módulos internos`

Con foco en:
- copy
- jerarquía
- densidad
- modales
- drawers
- estados vacíos
- CTA

