# Documentación Oficial de Fixi

Este directorio contiene documentación histórica y documentación canónica vigente del producto Fixi.

## Source of Truth

- `docs/canonical/especificacion_aprobada.md` es el **SOURCE OF TRUTH funcional** de Fixi.
- `docs/canonical/spec_00_modelo_datos_maestro.md` es el **SOURCE OF TRUTH técnico de datos** de Fixi.
- `docs/canonical/index_documentacion_canonica.md` es el índice oficial de la documentación canónica.
- `docs/canonical/analisis_destructivo_fixi.md` conserva el análisis crítico usado para consolidar la especificación vigente.

## Estado de T04

T04, Auditoría crítica inmutable, ya está aprobado para producción temprana.

## Documentación Superseded

La documentación anterior dentro de `docs/` se conserva solo como referencia histórica. Queda marcada como **superseded** por la documentación canónica en `docs/canonical/`.

No se debe usar documentación histórica para definir comportamiento futuro cuando contradiga los documentos canónicos.

## Regla para Implementaciones Futuras

Cualquier implementación futura debe respetar los documentos canónicos. Si existe conflicto entre documentos, prevalecen:

1. `docs/canonical/especificacion_aprobada.md`
2. `docs/canonical/spec_00_modelo_datos_maestro.md`
3. `docs/canonical/index_documentacion_canonica.md`
