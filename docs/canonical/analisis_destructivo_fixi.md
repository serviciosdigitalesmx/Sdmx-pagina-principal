# Análisis Destructivo: Especificación Maestra de Fixi

> [!CAUTION]
> Este análisis asume 1,000 talleres activos, ~5,000 usuarios concurrentes, millones de órdenes, y responsabilidad legal real sobre datos financieros y personales de terceros.

---

## 1. ERRORES DE PRODUCTO

### 🔴 CRÍTICO — No existe T04 (Auditoría) pero 7 tickets dependen de él

T05, T06, T15, T17, T18 y el roadmap mencionan "T04 auditoría" como dependencia. **T04 no existe en la especificación.** Esto significa que el sistema financiero, el backoffice, los reportes y la observabilidad se están diseñando sobre una base que no está definida. Sin auditoría, no hay trazabilidad real — todo lo que prometen T05 y T06 sobre "no destruir historial" es humo sin un log de auditoría especificado.

### 🔴 CRÍTICO — No hay modelo de permisos/roles (RBAC/ABAC)

Cada ticket menciona roles (Recepcionista, Técnico, Administrador, Owner) pero **no existe un ticket que defina el modelo de permisos**. T06 dice "usuarios sin permiso no pueden aprobar", T17 dice "acceso sin rol interno prohibido", T15 dice "usuarios ven solo alcance permitido". ¿Dónde se define esto? ¿Quién asigna roles? ¿Cómo se propagan entre sucursales? Con 1,000 talleres, un modelo de permisos ausente es un agujero de seguridad masivo.

### 🔴 CRÍTICO — No hay modelo de tenant/sucursal

La especificación usa "taller", "sucursal" y "tenant" indistintamente sin definir la relación. ¿Un tenant = un taller? ¿Un tenant = una empresa con N sucursales? T07 habla de "reservar solo desde sucursal válida", T05 de "pagos por sucursal", T15 de "reportes por sucursal". **No hay ticket que modele la jerarquía tenant → sucursal → usuario.** Esto es fundacional para un SaaS multi-tenant.

### 🔴 CRÍTICO — No hay modelo de datos de "Orden"

La orden es la entidad central de TODO el sistema. Cada ticket la referencia. **No existe un ticket que defina qué es una orden**: sus estados, transiciones, campos base, ciclo de vida. ¿Qué estados tiene? ¿Quién puede transicionar? ¿Qué pasa cuando una orden tiene checklist incompleto + pago parcial + reserva activa + autorización pendiente? Sin esto, cada ticket define su propia visión de "orden" y habrá conflictos.

### 🟠 ALTO — No hay modelo de "Cliente"

¿Cómo se identifica un cliente? ¿Email? ¿Teléfono? ¿RFC? ¿Puede un cliente existir en múltiples tenants? T09 menciona "dispositivo vendido a otro cliente" pero no hay reglas de transferencia de propiedad. T13 necesita teléfono válido. T11 necesita identidad verificable. T12 necesita acceso seguro. **No hay ticket de gestión de clientes.**

### 🟠 ALTO — No hay modelo de "Equipo/Dispositivo"

T03 habla de IMEI/serie, T09 de historial por dispositivo, T10 de garantía por dispositivo. **No existe un ticket que defina la entidad "dispositivo"**: marca, modelo, tipo, catálogo, relación con cliente, ciclo de vida. T03 solo habla de capturar identificadores, no de modelar el dispositivo.

### 🟠 ALTO — T11 no define qué pasa con presupuestos modificados

T11 dice "cambios posteriores requieren nueva autorización" pero no especifica: ¿se invalida la autorización anterior? ¿Se puede reparar parcialmente lo ya autorizado? ¿El snapshot anterior queda vinculado? ¿Qué pasa si el técnico ya consumió piezas del presupuesto v1 cuando llega el presupuesto v2?

### 🟠 ALTO — T12 no tiene autenticación

El portal del cliente funciona con "folio/enlace" pero no define autenticación. ¿Es un enlace público? ¿Con token? ¿Expira? ¿Se puede enumerar folios? Con 1,000 talleres y millones de órdenes, un portal sin autenticación real es un vector de fuga de datos masivo.

### 🟡 MEDIO — T01 no define "aceptación del cliente" técnicamente

Dice "aceptación formal del cliente si el taller la exige" pero no define el mecanismo. ¿Firma digital? ¿Checkbox? ¿Captura de identificación? ¿OTP? La "aceptación" es el corazón legal del ticket y está indefinida.

### 🟡 MEDIO — T14 no contempla múltiples técnicos por orden

Dice "cambio de técnico" como caso límite pero no define: ¿se divide el tiempo? ¿Quién recibe la comisión? ¿Se puede reasignar retroactivamente? En talleres grandes con 1,000 clientes, el trabajo colaborativo es la norma, no la excepción.

### 🟡 MEDIO — T13 no define canal de fallback

¿Qué pasa si WhatsApp está caído? ¿SMS? ¿Email? ¿Nada? Con 1,000 talleres dependiendo de notificaciones automáticas, una caída de la API de WhatsApp Business paraliza la comunicación.

### 🟢 BAJO — T07 no define expiración de reservas

¿Una reserva vive para siempre? ¿Se libera automáticamente después de X días? Sin expiración, el stock fantasma crece indefinidamente.

---

## 2. ERRORES OPERATIVOS

### 🔴 CRÍTICO — T16 (Pruebas E2E) está en posición 14 del roadmap

Las pruebas E2E se construyen **después** de 13 tickets de funcionalidad. Esto significa que los primeros 13 tickets se desarrollan, integran y posiblemente despliegan a producción sin cobertura de pruebas automatizadas. Con 1,000 talleres en producción, cada release es una ruleta rusa.

### 🔴 CRÍTICO — T18 (Observabilidad) está en posición 17

La observabilidad se implementa **después** del portal, WhatsApp, reportes y pruebas. Esto significa que durante meses o años de desarrollo, no hay alertas, no hay métricas, no hay diagnóstico. Si T05 (caja) tiene un bug que duplica pagos, lo descubrirán por quejas de talleres, no por alertas.

### 🟠 ALTO — No hay estrategia de migración

Con 1,000 talleres activos, ¿cómo se despliega T01 (checklist obligatorio)? ¿Se activa para todos simultáneamente? ¿Hay migración de órdenes existentes? ¿Las órdenes abiertas pre-T01 requieren checklist retroactivo? **Ningún ticket contempla migración de datos o feature flags.**

### 🟠 ALTO — No hay estrategia de rollback

¿Qué pasa si T08 (consumo atómico) tiene un bug en producción? ¿Se puede revertir? ¿Los movimientos de inventario creados con la versión buggy son recuperables? No hay plan de contingencia para ningún ticket.

### 🟠 ALTO — No hay estrategia de despliegue progresivo

Con 1,000 talleres, desplegar cambios a todos simultáneamente es suicidio operativo. No se menciona canary deployments, feature flags, porcentaje de rollout, ni beta tenants.

### 🟡 MEDIO — T17 (Backoffice) está último en el roadmap

Sin backoffice, ¿cómo opera soporte durante los primeros 18 tickets? ¿Acceso directo a base de datos? ¿Scripts manuales? Esto es un riesgo operativo enorme y una fuente de errores humanos con datos de producción.

### 🟡 MEDIO — No hay plan de capacitación

1,000 talleres con personal de distintos niveles técnicos. Cada ticket cambia flujos operativos. No hay mención de documentación, onboarding, o capacitación.

### 🟡 MEDIO — No hay SLA definido para ningún servicio

¿Cuál es el uptime objetivo? ¿Tiempo máximo de downtime aceptable? ¿RTO/RPO? Sin SLAs, la observabilidad (T18) no tiene criterios contra qué alertar.

---

## 3. RIESGOS LEGALES

### 🔴 CRÍTICO — No hay cumplimiento con la Ley Federal de Protección de Datos Personales (LFPDPD)

Fixi almacena datos personales de clientes de terceros (los clientes de los talleres). Esto incluye nombres, teléfonos, IMEIs (dato de dispositivo personal), fotos de equipos, firmas. **No existe un ticket de consentimiento de datos personales del cliente final.** T02 habla de "consentimiento de evidencias" pero no de consentimiento para tratamiento de datos personales según LFPDPD. El aviso de privacidad, los derechos ARCO, y la designación de responsable/encargado están completamente ausentes.

### 🔴 CRÍTICO — Responsabilidad como encargado de datos

Como SaaS, Fixi es **encargado** del tratamiento de datos personales. Los talleres son **responsables**. Esta relación requiere un contrato de encargo (Data Processing Agreement). No se menciona en ningún ticket. Sin esto, Fixi asume responsabilidad solidaria por cualquier violación de privacidad de cualquiera de los 1,000 talleres.

### 🔴 CRÍTICO — T02 no cumple con derecho al olvido

T02 menciona "cliente pide eliminación" como caso límite pero no define el flujo. Bajo LFPDPD (y GDPR si hay clientes internacionales), el derecho de supresión es obligatorio y tiene plazos legales. Un "caso límite" no es una respuesta legal aceptable.

### 🟠 ALTO — T11 "firma simple" no tiene valor legal claro

"Firma simple" no es lo mismo que "firma electrónica simple" bajo la Ley de Firma Electrónica Avanzada. Si la "aceptación" de T11 se usa como evidencia en una disputa legal, ¿es válida? ¿Qué metadatos se capturan? ¿IP? ¿Timestamp con certificación? ¿User agent? Sin esto, la "evidencia de aceptación" puede ser impugnada.

### 🟠 ALTO — Sin cumplimiento fiscal (CFDI/facturación)

T05 habla de "comprobante claro de pagos" pero no menciona CFDI, facturación electrónica, ni integración con SAT. En México, para 1,000 talleres, muchos necesitarán emitir comprobantes fiscales. Esto no es opcional — es ley.

### 🟠 ALTO — IMEI es dato regulado

En México, los IMEIs están regulados por el IFT (Instituto Federal de Telecomunicaciones). Almacenar bases de datos masivas de IMEIs puede tener implicaciones regulatorias. No se menciona.

### 🟡 MEDIO — No hay política de retención de datos definida

T02 menciona "fecha de retención" pero no define políticas por defecto. ¿Cuánto tiempo se retienen datos? ¿Quién decide? ¿Qué pasa cuando expira? Las obligaciones fiscales mexicanas exigen retener registros contables por 5 años. Las obligaciones de protección de datos dicen minimizar retención. Estos conflictos no están resueltos.

### 🟡 MEDIO — No hay términos de servicio entre Fixi y los talleres

¿Quién es responsable si un taller usa Fixi para almacenar datos sin consentimiento? ¿Fixi tiene cláusula de indemnización? ¿Limitación de responsabilidad? Esto no es un ticket técnico, pero la especificación debería mencionarlo como dependencia.

---

## 4. RIESGOS FINANCIEROS

### 🔴 CRÍTICO — T05/T06 no mencionan concurrencia financiera

T08 habla de "consumo atómico" para inventario, pero **no existe equivalente para pagos**. ¿Qué pasa si dos cajeros registran el mismo pago simultáneamente? ¿Si un pago se registra durante un corte de caja? ¿Si una devolución se procesa mientras se registra un pago? Con 1,000 talleres, esto pasa diariamente.

### 🔴 CRÍTICO — No hay reconciliación con procesadores de pago

T05 menciona "método de pago" pero no hay integración con terminales bancarias, transferencias, ni verificación de que el dinero efectivamente llegó. Un pago "registrado" en Fixi no significa que el dinero existe. Sin reconciliación, los reportes financieros son ficción.

### 🟠 ALTO — T19 no define modelo de pricing

"Límites de plan" se mencionan pero no se define: ¿por órdenes? ¿por usuarios? ¿por sucursales? ¿por almacenamiento? ¿por mensajes WhatsApp? Sin modelo de pricing, no se pueden implementar límites. Sin límites, no hay billing enforcement.

### 🟠 ALTO — No hay manejo de moneda ni impuestos

¿IVA incluido? ¿Precios con/sin impuestos? ¿Cómo se manejan descuentos? ¿Promociones? ¿Moneda siempre es MXN? Si Fixi expande a otros países (cosa normal en un SaaS), el modelo financiero no está preparado.

### 🟡 MEDIO — T14 comisiones no define tratamiento fiscal

Las comisiones a técnicos tienen implicaciones de ISR y seguridad social. Si Fixi calcula comisiones pero el taller las reporta mal fiscalmente, ¿hay responsabilidad? El ticket ignora completamente esto.

### 🟡 MEDIO — No hay presupuesto de infraestructura

Almacenar fotos, videos, evidencias de 1,000 talleres tiene costo significativo. T02 menciona "costos por almacenamiento" como riesgo pero no hay modelo de costos. ¿Quién paga el storage? ¿Está incluido en el plan? ¿Hay límites?

---

## 5. RIESGOS MULTI-TENANT

### 🔴 CRÍTICO — No hay estrategia de aislamiento de datos

La especificación **nunca define cómo se aíslan los datos entre tenants**. ¿Schema por tenant? ¿Row-level security? ¿Base de datos separada? ¿Filtro por tenant_id en cada query? Con 1,000 talleres, un bug de filtrado expone datos de un taller a otro. Esta es la pesadilla #1 de cualquier SaaS multi-tenant y **no tiene ticket dedicado**.

### 🔴 CRÍTICO — T09 (Historial por dispositivo) cruza tenants sin control

Si un dispositivo con IMEI X se repara en taller A y luego en taller B, ¿el taller B ve el historial del taller A? T09 dice "historial por IMEI" pero no define el alcance multi-tenant. Mostrar historial cross-tenant viola la privacidad del taller A. No mostrarlo reduce el valor del historial. **Este conflicto fundamental no está resuelto.**

### 🟠 ALTO — T20 no define aislamiento en exportación

¿Qué garantiza que la exportación de un tenant no incluya datos de otro? ¿Hay validación post-exportación? ¿Se audita? Un bug aquí es una brecha de datos masiva.

### 🟠 ALTO — T17 impersonación sin límites claros

T17 menciona "impersonación controlada" pero no define: ¿qué acciones puede hacer un agente de soporte impersonando? ¿Puede crear órdenes? ¿Registrar pagos? ¿Modificar inventario? ¿Hay un flag visible que indique que la acción fue de soporte, no del usuario real?

### 🟠 ALTO — No hay "noisy neighbor" protection

¿Qué pasa si un tenant con 10,000 órdenes diarias degrada el rendimiento de los otros 999? No hay rate limiting por tenant, ni cuotas de recursos, ni fair scheduling. T19 habla de "límites de plan" pero no de protección de infraestructura.

### 🟡 MEDIO — No hay aislamiento de configuración

Cada taller configura campos obligatorios (T01), reglas de IMEI (T03), políticas de evidencia (T02), reglas de comisión (T14). ¿Dónde vive esta configuración? ¿Cómo se previene que una configuración de tenant A afecte a tenant B? ¿Hay caché por tenant?

---

## 6. DEPENDENCIAS FALTANTES

### 🔴 CRÍTICO — T04 Auditoría (referenciado pero inexistente)

Referenciado por: T05, T06, T15, T17, T18. No existe. Es imposible construir el sistema financiero sin esto.

### 🔴 CRÍTICO — Modelo de autenticación y autorización

No hay ticket. Cada ticket asume que los roles existen y tienen permisos. ¿OAuth? ¿SSO? ¿MFA? ¿Session management? ¿API keys?

### 🟠 ALTO — Catálogo de servicios/conceptos

T05 menciona "concepto" en pagos, T10 "concepto" en garantías, T11 "presupuesto" con ítems. No hay catálogo de servicios, precios base, ni estructura de presupuesto definida.

### 🟠 ALTO — Motor de presupuestos/cotizaciones

T11 depende de un "presupuesto" que no tiene ticket propio. ¿Cómo se crea? ¿Qué contiene? ¿Mano de obra + refacciones? ¿Descuentos? ¿Impuestos?

### 🟠 ALTO — Gestión de sucursales

T05, T07, T08, T15 mencionan sucursales. No hay ticket que defina CRUD de sucursales, transferencias entre sucursales, ni usuarios por sucursal.

### 🟠 ALTO — Gestión de inventario base

T07 y T08 hablan de reservas y consumo pero no hay ticket de alta de inventario, ajustes manuales, conteos físicos, ni transferencias entre sucursales.

### 🟡 MEDIO — Motor de estados/workflow de orden

Cada ticket asume transiciones de estado de la orden pero no hay definición del motor de estados. ¿Es configurable por taller? ¿Lineal o con ramas?

### 🟡 MEDIO — Notificaciones internas

T13 cubre WhatsApp (externo). ¿Cómo se notifica internamente? ¿Push notifications? ¿Email interno? ¿Dashboard con alertas? El técnico necesita saber que tiene una orden nueva.

### 🟡 MEDIO — Catálogo de dispositivos

T03 captura marca/modelo pero no hay catálogo. ¿Free text? ¿Lista cerrada? Con 1,000 talleres, habrá "iPhone 15", "iphone 15", "Iphone15", "Apple iPhone 15 Pro" para el mismo dispositivo.

---

## 7. FLUJOS INCOMPLETOS

### 🔴 CRÍTICO — Ciclo de vida completo de una orden no está definido

Recepción → Diagnóstico → Presupuesto → Autorización → Reparación → Control de calidad → Entrega → Seguimiento post-entrega. La especificación cubre fragmentos (recepción en T01, autorización en T11, pagos en T05) pero **no hay un flujo de extremo a extremo**. ¿Dónde está el diagnóstico? ¿La asignación a técnico? ¿El control de calidad? ¿La entrega física?

### 🔴 CRÍTICO — Flujo de entrega no existe

¿Cómo se entrega un equipo al cliente? ¿Se valida pago completo? ¿Se firma recepción de entrega? ¿Se verifica identidad del que recoge? ¿Qué pasa si recoge alguien distinto al que dejó el equipo? Este flujo es crítico y no tiene ticket.

### 🟠 ALTO — Flujo de diagnóstico no existe

T01 es recepción, T14 mide tiempos, pero ¿dónde registra el técnico el diagnóstico? ¿Fallas encontradas? ¿Piezas necesarias? ¿Tiempo estimado? Este es el trabajo diario del 40% de los usuarios.

### 🟠 ALTO — Flujo de re-apertura de orden incompleto

T10 menciona "orden reabierta por garantía" como caso límite. ¿Cómo se reabre? ¿Se crea nueva orden vinculada? ¿Se reabre la original? ¿Los pagos anteriores aplican? ¿El inventario consumido se revierte?

### 🟠 ALTO — Flujo de orden rechazada/abandonada

¿Qué pasa si el cliente nunca recoge el equipo? ¿30 días? ¿60 días? ¿Se puede disponer del equipo? ¿Hay obligaciones legales? En México, la Profeco tiene regulaciones sobre esto.

### 🟡 MEDIO — Flujo de transferencia entre sucursales

T07 menciona "pieza en otra sucursal" como caso límite. ¿Se puede transferir inventario? ¿Y órdenes? ¿Y equipos? No hay flujo.

### 🟡 MEDIO — Flujo de escalamiento

¿Qué pasa cuando un técnico no puede resolver una reparación? ¿Se escala a otro técnico? ¿A otra sucursal? ¿A un proveedor externo?

---

## 8. CASOS LÍMITE NO CONTEMPLADOS

### 🔴 CRÍTICO — Falla de infraestructura durante transacción financiera

T08 contempla doble-click e idempotencia para inventario. T05/T06 **NO** contemplan esto para dinero. ¿Qué pasa si el servidor se cae a medio registro de pago? ¿El pago se registró o no? ¿Cómo se reconcilia? Este es el caso más peligroso en software financiero.

### 🔴 CRÍTICO — Tenant con datos corruptos

¿Qué pasa si una importación masiva (T20) o un bug corrompe datos de un tenant? ¿Hay backup por tenant? ¿Se puede restaurar un tenant sin afectar a otros? ¿Cuál es el RPO?

### 🟠 ALTO — Orden con múltiples dispositivos

¿Un cliente puede dejar 3 celulares en una sola orden? ¿O necesita 3 órdenes? No está definido. Esto afecta T01 (un checklist por dispositivo), T03 (múltiples IMEIs), T05 (un pago para 3 reparaciones).

### 🟠 ALTO — Cliente es otra empresa (B2B)

¿Un taller puede tener como "cliente" a una empresa que manda 50 equipos al mes? ¿Hay facturación consolidada? ¿Crédito? ¿Precios especiales? El modelo de cliente asume B2C.

### 🟠 ALTO — Timezone y horarios

Con 1,000 talleres potencialmente en múltiples zonas horarias: ¿los reportes (T15) usan timezone del tenant? ¿Del servidor? ¿Los cortes de caja son por timezone del taller? ¿Las garantías (T10) vencen a medianoche de qué timezone?

### 🟠 ALTO — Pérdida o robo de equipo en el taller

¿Qué pasa si un equipo desaparece? ¿Hay registro? ¿Seguro? ¿Flujo de reporte? Esto es un riesgo operativo real con implicaciones legales.

### 🟡 MEDIO — Cambio de plan durante ciclo de facturación

T19 no define qué pasa con upgrade/downgrade a mitad de mes. ¿Prorrateo? ¿Se aplica inmediatamente? ¿Al siguiente ciclo? ¿Se pierden funciones inmediatamente en downgrade?

### 🟡 MEDIO — Usuario que pertenece a múltiples talleres

¿Un técnico puede trabajar en 2 talleres? ¿Con el mismo login? ¿Con diferentes? ¿Cómo se manejan las comisiones (T14)?

### 🟡 MEDIO — Equipo recibido en una sucursal y recogido en otra

No hay flujo para esto, pero es un escenario real en cadenas de talleres.

### 🟡 MEDIO — WhatsApp Business API rate limits

Con 1,000 talleres enviando mensajes, ¿se usa una cuenta Business API por tenant o una compartida? Si es compartida, los rate limits de Meta afectan a todos. Si es por tenant, cada uno necesita su propia verificación. T13 no aborda esto.

### 🟢 BAJO — Orden creada por accidente

¿Se puede eliminar una orden recién creada? ¿O solo cancelar? Si solo cancelar, la numeración tiene huecos. Si eliminar, se pierde trazabilidad.

### 🟢 BAJO — Cambio de propietario del taller

¿Qué pasa cuando el owner vende el negocio? ¿Se transfiere el tenant? ¿Los datos? ¿El historial? ¿Las garantías vigentes?

---

## 9. HALLAZGOS ADICIONALES DEL ROADMAP

### 🔴 CRÍTICO — El roadmap no tiene estimaciones de tiempo

19 tickets sin estimaciones. ¿Cuánto toma? ¿6 meses? ¿2 años? ¿Qué equipo se necesita? Sin estimaciones, el roadmap es una lista de deseos, no un plan ejecutable.

### 🔴 CRÍTICO — Dependencias circulares implícitas

T12 depende de T02, T10, T11. T11 depende de T12 (portal) para que el cliente acepte online. T10 depende de T12 para que el cliente vea garantías. Pero T12 está en posición 11 y T10 en posición 9. **¿Cómo entrega T10 "cliente ve condiciones y vigencia" sin el portal que se construye 2 tickets después?**

### 🟠 ALTO — "Obligatorios para vender" es inconsistente

El roadmap dice que T12 "versión mínima" es obligatorio para vender, pero T12 depende de T02, T10, T11 — y T10/T11 no están en la lista de "obligatorios para vender". ¿Se vende con un portal que no muestra garantías ni autorizaciones?

### 🟠 ALTO — T19 (Billing) antes de T17 (Backoffice)

Se implementa billing enforcement antes del backoffice interno. ¿Cómo se resuelve un bloqueo indebido de tenant? ¿Con acceso directo a la base de datos? Un tenant bloqueado erróneamente sin backoffice para desbloquearlo pierde operación.

### 🟡 MEDIO — No hay métricas de éxito por ticket

¿Cómo se sabe si T01 fue exitoso? ¿% de checklist completados? ¿Reducción de disputas? ¿Cómo se mide si T13 reduce carga operativa? Sin métricas, no hay forma de evaluar ROI.

### 🟡 MEDIO — No hay plan de compatibilidad hacia atrás

¿La API cambia entre tickets? ¿Hay apps móviles que consumen el API? ¿Integraciones de terceros? Ningún ticket menciona versionado de API ni backwards compatibility.

---

## Resumen Ejecutivo por Severidad

| Severidad | Cantidad | Categorías principales |
|-----------|----------|----------------------|
| 🔴 **CRÍTICO** | **18** | Fundaciones ausentes (auditoría, permisos, tenant, orden), riesgos legales de datos personales, fallas financieras por concurrencia, aislamiento multi-tenant indefinido |
| 🟠 **ALTO** | **22** | Flujos core incompletos (diagnóstico, entrega), dependencias faltantes (presupuestos, inventario base, sucursales), riesgos legales fiscales, despliegue sin estrategia |
| 🟡 **MEDIO** | **19** | Casos límite operativos, gaps de UX, configuración multi-tenant, capacitación, SLAs |
| 🟢 **BAJO** | **3** | Edge cases menores, expiración de reservas, orden accidental |
| **TOTAL** | **62** | — |

---

## Veredicto

> [!CAUTION]
> **Esta especificación no está lista para ejecutarse.**

Los 5 problemas más graves, en orden:

1. **No hay fundaciones**: Faltan las entidades centrales (Orden, Cliente, Dispositivo, Sucursal, Permisos, Auditoría). Se están especificando features sobre cimientos que no existen.

2. **No hay aislamiento multi-tenant definido**: Con 1,000 talleres, un solo bug de filtrado expone datos de un taller a otro. Este riesgo no tiene ni ticket ni estrategia.

3. **El flujo core del negocio está incompleto**: No hay diagnóstico, no hay entrega, no hay presupuesto como entidad. Se están especificando las piezas decorativas sin definir la estructura principal.

4. **La exposición legal es severa**: Sin cumplimiento de LFPDPD, sin CFDI, sin contratos de encargo de datos, Fixi opera en riesgo legal constante multiplicado por 1,000 talleres.

5. **El roadmap tiene el orden incorrecto**: Observabilidad, auditoría y backoffice van al final, cuando deberían ser de las primeras cosas en un SaaS con clientes en producción.
