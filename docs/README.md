# Documentación Oficial de Fixi

Este directorio contiene documentación histórica y documentación canónica vigente del producto Fixi.

## Source of Truth

- `docs/canonical/especificacion_aprobada.md` es el **SOURCE OF TRUTH funcional** de Fixi.
- `docs/canonical/spec_00_modelo_datos_maestro.md` es el **SOURCE OF TRUTH técnico de datos** de Fixi.
- `docs/specs/` contiene las **especificaciones técnicas aprobadas** para la implementación de T01-T20.

## Documentación Superseded

La documentación anterior dentro de `docs/` se conserva solo como referencia histórica. Queda marcada como **superseded** por la documentación canónica en `docs/canonical/` y las especificaciones técnicas en `docs/specs/`.

## Estado de T04

- **T04, Auditoría crítica inmutable, ya está aprobado para producción temprana.** Manda sobre toda la operación crítica del sistema.

## Orden de Implementación Inicial

- La implementación en código debe iniciar obligatoriamente por **T01, T03 y T02**, en ese orden, cerrando las fundaciones de recepción, trazabilidad de dispositivos y evidencias seguras.

## Reglas de Implementación

Cualquier implementación futura debe respetar los documentos canónicos. Si existe conflicto, prevalece el modelo canónico y las especificaciones técnicas en `docs/specs/` deben adaptarse a este.
