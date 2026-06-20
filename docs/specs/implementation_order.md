# Orden De Implementación

Fuente canónica:

- `docs/canonical/especificacion_aprobada.md`
- `docs/canonical/spec_00_modelo_datos_maestro.md`
- `docs/canonical/index_documentacion_canonica.md`

T04 ya está aprobado para producción temprana y se considera base cerrada.

## Principio Rector

No implementar funcionalidades visibles antes de cerrar contratos de datos, estados, permisos, auditoría y reglas de negocio del flujo correspondiente, acatando de manera irrestricta la base canónica.

## Orden Definitivo De Implementación

1. **Fundaciones:** Revisión y consolidación de la operación sobre `tenants`, `users` y `repair_orders` canónicos.
2. T01 Checklist legal obligatorio de recepción.
3. T03 IMEI/Serie obligatorio configurable.
4. T02 Consentimiento, retención y control de evidencias.
5. T05 Motor de caja ligado a órdenes.
6. T06 Cancelaciones, reembolsos y ajustes financieros.
7. T07 Reserva automática de refacciones por orden.
8. T08 Consumo atómico de inventario.
9. T09 Historial clínico por dispositivo.
10. T10 Garantías completas.
11. T11 Autorización online con aceptación/firma.
12. T12 Portal cliente completo con documentos.
13. T13 WhatsApp automatizado con cola y bitácora.
14. T14 Tiempos, productividad y comisiones.
15. T15 Reportes operativos confiables.
16. T18 Observabilidad y alertas.
17. T16 Pruebas E2E de flujos críticos.
18. T17 Backoffice interno FIXI.
19. T19 Límites de plan y billing enforcement.
20. T20 Exportación/importación de datos por tenant.

## Primer Bloque Recomendado (Recepción Segura)
- Fundaciones
- T01
- T03
- T02
- Observabilidad mínima (T18) para monitorear estas áreas.

## Segundo Bloque Recomendado (Flujo Financiero)
- T05
- T06
- Observabilidad (T18)

## Tercer Bloque Recomendado (Inventario)
- T07
- T08

## Cuarto Bloque Recomendado (Cliente y Retención)
- T09
- T10
- T11
- T12
- T13

## Quinto Bloque Recomendado (Operación y Calidad)
- T14
- T15
- T16 (Pruebas robustas con todo el ciclo base construido)

## Sexto Bloque Recomendado (Escalamiento SaaS)
- T17
- T19
- T20
