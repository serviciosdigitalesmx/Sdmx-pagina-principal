# Matriz De Dependencias T01-T20

Fuente canónica:

- `docs/canonical/especificacion_aprobada.md`
- `docs/canonical/spec_00_modelo_datos_maestro.md`
- `docs/canonical/index_documentacion_canonica.md`

T04 (Auditoría inmutable) está cerrado, aprobado e impacta transversalmente a todos los tickets de escritura.

## Matriz Principal

| Ticket | Depende De | Desbloquea |
|---|---|---|
| Fundaciones | `spec_00` canónico | Todo el ecosistema operativo |
| T01 | Fundaciones | T02 |
| T02 | Fundaciones | T12, validación de evidencia |
| T03 | Fundaciones | T09, T10 |
| T05 | Fundaciones, T04 | T06, T15 (Finanzas) |
| T06 | T05, T04 | Conciliación confiable |
| T07 | Fundaciones | T08 |
| T08 | T07 | T15 (Inventario) |
| T09 | T03 | T10, T14 |
| T10 | T03, T09 | T12 |
| T11 | Fundaciones | T12, Autorización de reparación |
| T12 | T02, T10, T11 | Autoservicio cliente |
| T13 | T02, T11, T12 | Comunicación automatizada |
| T14 | Fundaciones, T09, T10 | T15 (Productividad) |
| T15 | T05, T06, T07, T08, T14 | Reportes ejecutivos |
| T18 | Flujos críticos, T04 | Diagnóstico temprano y monitoreo de T16 |
| T16 | Flujos críticos, T18 | Estabilidad para releases |
| T17 | T04, Fundaciones, T18 | T19, T20 |
| T19 | T17, Fundaciones | Control de facturación |
| T20 | T17, T19, Fundaciones | Portabilidad |

## Notas de Dependencias
- **T18 antes de T16:** La observabilidad y monitoreo temprano de errores (T18) debe existir de manera mínima antes de construir las pruebas E2E formales (T16), de modo que si un flujo falla, se cuente con las herramientas de monitoreo.
- **Respeto Canónico:** Todas las dependencias asumen que se utiliza exclusivamente el modelo definido en `docs/canonical/`. Si un ticket requiere datos de otro, debe leerlos usando las tablas canónicas vigentes.
