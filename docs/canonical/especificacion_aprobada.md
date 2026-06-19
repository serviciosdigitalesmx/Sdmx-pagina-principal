# Especificación Maestra Fundacional de Fixi

Antes de seguir con T01-T20, Fixi necesita cerrar su modelo base. Si estas entidades no están definidas, los tickets posteriores quedan ambiguos y se vuelven frágiles.

T04 se asume cerrado y vigente: toda acción crítica debe ser auditable.

---

# 1. Tenant

## Definición

Un tenant es una empresa/taller que usa Fixi como unidad legal, comercial, operativa y de aislamiento de datos.

## Objetivo de negocio

Permitir que múltiples talleres operen dentro de Fixi sin compartir datos, usuarios, clientes, órdenes, dinero, inventario ni reportes entre sí.

## Información requerida

- Nombre comercial.
- Razón social, cuando aplique.
- Identificador fiscal, cuando aplique.
- País.
- Zona horaria principal.
- Moneda principal.
- Estado del tenant: activo, suspendido, cancelado.
- Plan contratado.
- Configuración legal y operativa.
- Configuración de privacidad.
- Configuración de folios.
- Configuración de módulos habilitados.

## Relaciones funcionales

- Un tenant tiene una o más sucursales.
- Un tenant tiene usuarios miembros.
- Un tenant tiene clientes.
- Un tenant tiene órdenes.
- Un tenant tiene inventario.
- Un tenant tiene configuración propia.
- Un tenant tiene auditoría propia.

## Reglas de negocio

- Ningún dato operativo puede existir sin tenant.
- Un usuario puede pertenecer a varios tenants, pero cada acción ocurre dentro de un tenant activo.
- El cambio de tenant debe ser explícito para el usuario.
- Un tenant suspendido no puede crear nuevas órdenes, cobrar, subir evidencia ni modificar inventario.
- Un tenant cancelado conserva datos según política de retención y exportación.
- El tenant define zona horaria, moneda, reglas de campos obligatorios y módulos activos.

## Restricciones

- No existe historial global compartido entre tenants.
- No existe búsqueda cruzada de clientes, dispositivos, órdenes o evidencias entre tenants.
- Soporte interno de Fixi solo puede acceder bajo reglas explícitas, trazadas y limitadas.

## Casos límite

- Un dueño opera varias marcas o negocios separados.
- Un taller cambia de razón social.
- Un tenant tiene varias sucursales en distintas zonas horarias.
- Un tenant deja de pagar pero necesita exportar información.
- Un tenant solicita eliminación de datos.

## Criterios de aceptación

- Todo dato operativo pertenece inequívocamente a un tenant.
- Un usuario de un tenant no puede ver ni inferir datos de otro.
- Las configuraciones del tenant afectan todo el producto de forma consistente.
- La suspensión/cancelación tiene efectos claros y previsibles.

---

# 2. Sucursal

## Definición

Una sucursal es una unidad física u operativa dentro de un tenant donde se reciben, reparan, cobran, entregan y almacenan equipos.

## Objetivo de negocio

Permitir que un taller con varias ubicaciones opere con separación operativa, financiera e inventario local.

## Información requerida

- Nombre de la sucursal.
- Dirección.
- Teléfono.
- Zona horaria, si difiere del tenant.
- Estado: activa, inactiva.
- Responsable operativo.
- Configuración de folios, si aplica.
- Reglas de caja.
- Inventario asociado.

## Relaciones funcionales

- Una sucursal pertenece a un tenant.
- Una orden se crea en una sucursal.
- Una orden puede ser atendida por técnicos de una o varias sucursales solo si el tenant lo permite.
- El inventario pertenece a una sucursal.
- Los cobros pertenecen a una sucursal.
- Los reportes pueden filtrarse por sucursal.

## Reglas de negocio

- Toda orden debe tener sucursal de recepción.
- Todo cobro debe asociarse a una sucursal.
- Toda reserva o consumo de refacción debe asociarse a una sucursal.
- Un usuario puede tener acceso a todas las sucursales o solo a algunas.
- Una sucursal inactiva no puede recibir nuevas órdenes ni generar movimientos nuevos.

## Restricciones

- No se puede consumir inventario de una sucursal distinta sin transferencia o autorización.
- No se puede cerrar caja mezclando sucursales.
- No se puede mover una orden de sucursal sin trazabilidad.

## Casos límite

- Orden recibida en una sucursal y reparada en otra.
- Cliente recoge en sucursal distinta.
- Técnico trabaja para múltiples sucursales.
- Inventario centralizado pero consumo local.
- Sucursal temporalmente cerrada.

## Criterios de aceptación

- Cada operación relevante identifica sucursal.
- Permisos por sucursal se respetan siempre.
- Reportes, caja e inventario se pueden aislar por sucursal.
- Cambios de sucursal quedan trazados.

---

# 3. Usuario

## Definición

Un usuario es una persona autenticada que puede actuar dentro de uno o más tenants con permisos específicos.

## Objetivo de negocio

Controlar quién puede operar, administrar, cobrar, reparar, auditar o acceder a datos sensibles.

## Información requerida

- Nombre.
- Correo.
- Teléfono opcional.
- Estado: activo, invitado, suspendido, eliminado lógico.
- Tenants a los que pertenece.
- Sucursales permitidas.
- Roles asignados.
- Fecha de alta.
- Último acceso.
- Preferencias de idioma y zona horaria, si aplica.

## Relaciones funcionales

- Un usuario puede pertenecer a varios tenants.
- Un usuario puede tener roles distintos por tenant.
- Un usuario puede tener acceso limitado por sucursal.
- Un usuario puede ser asignado a órdenes.
- Un usuario puede ejecutar acciones auditables.

## Reglas de negocio

- Un usuario suspendido no puede operar.
- Un usuario eliminado no debe perder trazabilidad histórica.
- Las acciones históricas conservan el nombre o identidad del usuario en ese momento.
- El owner puede invitar y revocar usuarios según su plan.
- Nadie puede elevarse permisos a sí mismo sin autorización superior.

## Restricciones

- No se deben compartir credenciales.
- No se debe operar sin usuario identificado.
- Soporte Fixi no debe actuar como usuario del tenant sin modo de soporte trazable.

## Casos límite

- Usuario trabaja en dos talleres distintos.
- Usuario cambia de rol.
- Usuario sale de la empresa.
- Usuario fue técnico y luego administrador.
- Usuario intenta acceder a una sucursal no autorizada.

## Criterios de aceptación

- Toda acción operativa tiene usuario responsable.
- Los permisos aplican por tenant y sucursal.
- La baja de usuario no rompe historial.
- El sistema distingue identidad, rol y alcance.

---

# 4. Roles y Permisos

## Definición

El modelo de permisos define qué puede hacer cada usuario, en qué tenant, en qué sucursal, sobre qué entidad y en qué estado del flujo.

## Objetivo de negocio

Evitar accesos indebidos, errores operativos, fraudes financieros y exposición de información sensible.

## Roles base

- Owner.
- Administrador.
- Recepcionista.
- Técnico.
- Caja/Finanzas.
- Supervisor.
- Soporte Fixi.
- Cliente.

## Capacidades por rol

### Owner
- Administra tenant.
- Administra usuarios y roles.
- Ve reportes completos.
- Configura plan, sucursales y reglas.
- Accede a auditoría.
- Autoriza acciones críticas.

### Administrador
- Opera configuración delegada.
- Supervisa órdenes.
- Gestiona clientes.
- Ve reportes según alcance.
- Puede autorizar ajustes si el owner lo permite.

### Recepcionista
- Crea clientes.
- Recibe dispositivos.
- Crea órdenes.
- Captura checklist legal.
- Sube evidencias permitidas.
- Comunica presupuesto al cliente.
- No debe modificar caja histórica ni inventario crítico.

### Técnico
- Ve órdenes asignadas o permitidas.
- Registra diagnóstico.
- Propone refacciones.
- Actualiza avance técnico.
- Registra tiempos.
- No debe modificar cobros ni datos legales de recepción.

### Caja/Finanzas
- Registra cobros.
- Registra gastos.
- Consulta caja.
- Gestiona ajustes según permiso.
- No debe alterar diagnóstico ni checklist legal.

### Supervisor
- Reasigna órdenes.
- Autoriza cambios de estado sensibles.
- Valida calidad.
- Puede intervenir en conflictos operativos.

### Soporte Fixi
- Acceso excepcional.
- Alcance limitado.
- Siempre trazado.
- Nunca debe tener acceso silencioso.
- No debe modificar datos financieros o legales sin autorización del tenant.

### Cliente
- Consulta sus órdenes.
- Autoriza presupuestos.
- Consulta documentos visibles.
- Consulta evidencias permitidas.
- Acepta entrega o garantía cuando aplique.

## Reglas de permisos

- Todo permiso depende de tenant.
- Todo permiso operativo depende de sucursal cuando aplique.
- Todo permiso financiero requiere rol explícito.
- Todo permiso crítico requiere auditoría.
- Los permisos dependen también del estado de la orden.
- Un técnico no debe ver órdenes de otro tenant.
- Un cliente solo puede ver sus propias órdenes.
- Soporte interno no debe romper aislamiento multi-tenant.

## Casos límite

- Dueño también atiende como técnico.
- Recepcionista también cobra.
- Técnico necesita ver historial del dispositivo.
- Administrador de una sucursal no puede ver otra.
- Soporte Fixi necesita diagnosticar un problema real.

## Criterios de aceptación

- Cada acción sensible tiene permiso explícito.
- No existen permisos implícitos por estar autenticado.
- No existe acceso global operativo salvo soporte controlado.
- Las restricciones por tenant, sucursal, rol y estado son consistentes.

---

# 5. Cliente

## Definición

Un cliente es la persona o empresa que solicita reparación, diagnóstico, garantía, cotización o seguimiento.

## Objetivo de negocio

Centralizar relación comercial, historial, comunicación, consentimiento y documentos del cliente dentro de cada tenant.

## Tipos de cliente

- Persona física.
- Empresa.
- Contacto de empresa.
- Cliente recurrente.
- Cliente eventual.

## Información requerida

- Nombre.
- Teléfono.
- Correo opcional.
- Tipo de cliente.
- Datos fiscales opcionales.
- Preferencias de contacto.
- Consentimientos.
- Estado: activo, bloqueado, eliminado lógico.
- Relación con dispositivos.
- Relación con órdenes.

## Relaciones funcionales

- Un cliente pertenece a un tenant.
- Un cliente puede tener múltiples dispositivos.
- Un cliente puede tener múltiples órdenes.
- Una empresa puede tener múltiples contactos.
- Un contacto puede autorizar o recoger si está permitido.

## Reglas de negocio

- No se debe duplicar cliente si puede identificarse razonablemente.
- El cliente debe aceptar tratamiento de datos según política del tenant.
- El cliente puede solicitar corrección o eliminación según reglas legales.
- El cliente puede tener restricciones de comunicación.
- El historial del cliente nunca cruza tenants.

## Restricciones

- No enviar mensajes sin consentimiento cuando la ley lo requiera.
- No mostrar información de otro cliente por coincidencia de teléfono.
- No permitir que cualquier contacto empresarial autorice sin relación definida.

## Casos límite

- Cliente trae equipo de otra persona.
- Empresa manda empleado con equipo corporativo.
- Cliente cambia de número.
- Cliente pide borrar sus datos pero tiene órdenes fiscales o legales.
- Cliente abandona equipo.

## Criterios de aceptación

- Cada orden tiene cliente responsable.
- El cliente tiene identidad suficiente para contacto y entrega.
- Los consentimientos son claros.
- El historial está aislado por tenant.

---

# 6. Dispositivo

## Definición

Un dispositivo es el equipo físico que entra a diagnóstico, reparación, garantía o revisión.

## Objetivo de negocio

Crear trazabilidad técnica y legal por equipo, evitando confusión entre órdenes, garantías, piezas, historial y evidencias.

## Información requerida

- Tipo de dispositivo.
- Marca.
- Modelo.
- Color opcional.
- Número de serie, IMEI u otro identificador.
- Estado físico al ingreso.
- Daños visibles reportados.
- Accesorios recibidos.
- Evidencia inicial.
- Cliente asociado.
- Orden asociada.
- Estado de custodia.

## Relaciones funcionales

- Un cliente puede tener varios dispositivos.
- Un dispositivo puede tener varias órdenes en el tiempo.
- Una orden puede contener uno o más dispositivos solo si el flujo lo permite.
- Un dispositivo puede tener garantías.
- Un dispositivo puede tener historial técnico.
- Un dispositivo puede tener evidencias.

## Reglas de negocio

- La obligatoriedad de IMEI o serie depende del tipo de dispositivo y configuración del tenant.
- Si el identificador no existe o no es visible, debe registrarse motivo.
- El dispositivo debe tener descripción física al ingresar.
- Los accesorios recibidos deben quedar registrados.
- La custodia del dispositivo inicia en recepción y termina en entrega.
- El historial del dispositivo es solo dentro del tenant.

## Restricciones

- No debe existir historial global por IMEI entre tenants.
- No se debe permitir entrega sin confirmar identidad o autorización.
- No se debe modificar información legal de recepción sin trazabilidad.
- No se debe mezclar evidencia de dispositivos distintos.

## Casos límite

- Equipo sin IMEI visible.
- Equipo bloqueado y no verificable.
- Equipo mojado, quemado o destruido.
- Cliente trae varios dispositivos.
- Equipo reportado como robado o con procedencia dudosa.
- Equipo se pierde o daña dentro del taller.

## Criterios de aceptación

- Cada equipo tiene identidad operativa suficiente.
- La custodia es clara.
- El historial técnico se puede reconstruir.
- El sistema evita confundir dispositivos similares.

---

# 7. Orden

## Definición

La orden es el expediente central de una reparación, diagnóstico, garantía, revisión o servicio.

## Objetivo de negocio

Coordinar todo el ciclo operativo, legal, técnico, financiero y documental de una reparación.

## Información requerida

- Folio.
- Tenant.
- Sucursal.
- Cliente.
- Dispositivo o dispositivos.
- Tipo de servicio.
- Estado actual.
- Prioridad.
- Responsable de recepción.
- Técnico asignado.
- Diagnóstico.
- Presupuesto vigente.
- Autorizaciones.
- Evidencias.
- Refacciones.
- Cobros.
- Eventos.
- Garantía.
- Fecha de ingreso.
- Fecha estimada.
- Fecha de entrega.
- Motivo de cancelación, si aplica.

## Estados maestros

- Borrador.
- Recibida.
- En diagnóstico.
- Diagnóstico completado.
- Presupuesto enviado.
- Esperando autorización.
- Autorizada.
- Rechazada.
- En reparación.
- Esperando refacción.
- Reparación completada.
- En control de calidad.
- Lista para entrega.
- Entregada.
- Cancelada.
- Abandonada.
- Reabierta por garantía.

## Reglas de negocio

- Una orden no puede avanzar sin datos mínimos del cliente y dispositivo.
- Una orden recibida debe tener aceptación legal cuando aplique.
- Una orden con presupuesto debe conservar versiones.
- Una orden no debe repararse sin autorización cuando hay costo nuevo.
- Una orden no debe entregarse si hay saldo pendiente, salvo permiso explícito.
- Una orden cancelada no debe seguir generando consumo de inventario o cobros nuevos salvo ajustes permitidos.
- Una orden entregada no debe modificarse salvo garantía, corrección autorizada o auditoría.
- Todo cambio de estado crítico debe ser trazado.

## Restricciones

- No saltar estados que implican aceptación legal, financiera o técnica.
- No borrar órdenes.
- No sobrescribir diagnóstico o presupuesto aceptado.
- No mezclar pagos de órdenes distintas sin trazabilidad.
- No reabrir sin motivo.

## Casos límite

- Cliente rechaza presupuesto.
- Cliente abandona equipo.
- Cliente autoriza verbalmente.
- Cliente cambia de opinión.
- Reparación falla después de entrega.
- Equipo se daña durante reparación.
- Se detecta daño adicional.
- El técnico encuentra refacción agotada.
- Pago parcial.
- Entrega a tercero autorizado.

## Criterios de aceptación

- La orden cuenta una historia completa.
- Cada estado tiene significado operativo.
- Cada transición tiene reglas.
- Finanzas, inventario, evidencia, garantía y comunicación se conectan a la orden.
- La orden puede auditarse de principio a fin.

---

# 8. Presupuesto

## Definición

El presupuesto es la propuesta económica y técnica presentada al cliente para autorizar o rechazar una reparación.

## Objetivo de negocio

Evitar disputas con clientes, controlar márgenes y asegurar que el taller no trabaje sin autorización válida.

## Información requerida

- Orden.
- Versión.
- Diagnóstico relacionado.
- Conceptos de mano de obra.
- Refacciones.
- Descuentos.
- Impuestos, si aplican.
- Total.
- Moneda.
- Vigencia.
- Estado: borrador, enviado, aceptado, rechazado, vencido, reemplazado.
- Persona que autorizó.
- Fecha de autorización.
- Canal de autorización.
- Evidencia de aceptación, cuando aplique.

## Relaciones funcionales

- Una orden puede tener varios presupuestos versionados.
- Solo un presupuesto puede estar vigente.
- Una autorización corresponde a una versión exacta.
- Un presupuesto aceptado puede generar reserva de refacciones.
- Un presupuesto aceptado puede habilitar reparación.
- Un presupuesto puede generar garantía posterior.

## Reglas de negocio

- No se puede modificar un presupuesto aceptado.
- Cualquier cambio posterior crea nueva versión.
- El cliente debe aceptar la versión exacta.
- Si sube el costo, se requiere nueva autorización.
- Si el presupuesto vence, debe renovarse o confirmarse.
- Una reparación con costo debe tener presupuesto aceptado, salvo política explícita del tenant.

## Restricciones

- No usar presupuestos ambiguos.
- No aceptar sin identidad del cliente o autorizado.
- No cambiar conceptos después de aceptación.
- No mezclar presupuesto con cobro final sin trazabilidad.

## Casos límite

- Cliente acepta una parte.
- Cliente rechaza todo.
- Cliente pide descuento.
- Refacción cambia de precio.
- Diagnóstico cambia.
- Presupuesto vencido.
- Autorización por tercero.

## Criterios de aceptación

- Cada presupuesto aceptado es legal y comercialmente defendible.
- El total cobrado puede reconciliarse contra lo autorizado.
- Los cambios quedan versionados.
- La orden sabe exactamente qué fue autorizado.

---

# 9. Flujo Completo de una Reparación

## Flujo maestro

1. Cliente solicita servicio.
2. Recepción identifica cliente.
3. Recepción identifica dispositivo.
4. Recepción registra estado físico, daños y accesorios.
5. Cliente acepta condiciones de recepción y tratamiento de datos.
6. Se crea la orden en una sucursal.
7. Se suben evidencias iniciales permitidas.
8. Se asigna técnico o cola técnica.
9. Técnico realiza diagnóstico.
10. Técnico registra hallazgos, riesgos y posibles refacciones.
11. Se genera presupuesto versionado.
12. Cliente acepta, rechaza o solicita cambios.
13. Si acepta, se habilita reparación.
14. Si requiere refacciones, se reservan.
15. Técnico ejecuta reparación.
16. Si se consumen refacciones, se registra consumo.
17. Se registra avance, tiempos y observaciones.
18. Se completa reparación.
19. Se realiza control de calidad.
20. Se notifica al cliente.
21. Cliente paga saldo pendiente.
22. Se entrega dispositivo al cliente o autorizado.
23. Cliente confirma recepción.
24. Inicia garantía, si aplica.
25. El cliente puede consultar documentos, evidencias permitidas, estado e historial.
26. Si hay falla cubierta, se reabre por garantía.
27. Si el cliente abandona, se aplica flujo de abandono.
28. Si se cancela, se aplica flujo de cancelación y ajustes.

## Reglas transversales

- Todo ocurre dentro de tenant y sucursal.
- Todo actor tiene permisos explícitos.
- Toda acción crítica queda auditada.
- La orden nunca pierde historial.
- El cliente solo ve información autorizada.
- El dispositivo conserva trazabilidad.
- Finanzas, inventario y garantía dependen del estado real de la orden.
- El presupuesto aceptado define lo permitido comercialmente.
- La entrega cierra custodia.
- La garantía reabre flujo sin borrar historia.

## Estados finales posibles

- Entregada.
- Cancelada.
- Rechazada.
- Abandonada.
- Reabierta por garantía.
- Cerrada administrativamente.

---

# T01 Checklist Legal Obligatorio De Recepción

## Objetivo De Negocio
Reducir disputas con clientes y formalizar la recepción del equipo con evidencia operativa mínima.

## Problema Que Resuelve
Evita órdenes creadas sin registrar el estado físico del equipo, accesorios recibidos y aceptación del cliente.

## Flujo Completo Del Usuario
- Recepcionista: captura condición física, daños reportados, accesorios, encendido, pantalla, respaldo y aceptación.
- Técnico: consulta el estado recibido antes de diagnosticar.
- Administrador: revisa que la recepción cumpla con el estándar del taller.
- Owner: define qué campos son obligatorios por operación.
- Cliente: reconoce el estado inicial del equipo.

## Estado Final Esperado
Ninguna orden de recepción queda operativamente completa sin checklist legal cuando el taller lo exige. El checklist queda visible en detalle, recepción y vista técnica.

## Modelo Funcional
- Entidades involucradas: orden, cliente, equipo, checklist, responsable de recepción.
- Información requerida: condición cosmética, daño físico, accesorios, encendido, pantalla, respaldo, aceptación.
- Relaciones funcionales: cada orden tiene un checklist de recepción asociado.

## Reglas De Negocio
- Obligatorio: checklist en recepción cuando el taller lo tenga activado.
- Opcional: aceptación formal del cliente si el taller no la exige.
- Validaciones: campos requeridos no pueden quedar vacíos.
- Restricciones: el checklist inicial no debe confundirse con diagnóstico técnico.
- Bloqueos: si el checklist obligatorio falta, la orden no debe avanzar como recepción completa.

## Casos Límite
- Cliente no sabe describir daño.
- Equipo no enciende.
- Accesorios ambiguos.
- Cliente deja equipo sin firmar.
- Orden creada por canal rápido.

## Riesgos Operativos
- Captura lenta en mostrador.
- Personal omite detalles por presión.
- Talleres antiguos podrían resistirse al cambio.

## Dependencias Con Otros Tickets
- T03 para identificar equipo correctamente.
- T02 para evidencias.
- T09 para historial confiable.
- T10/T11 para garantía/autorización.

## Criterios Exactos De Aceptación
- Orden con checklist obligatorio no puede completarse sin datos mínimos.
- Checklist visible para recepción, detalle y técnico.
- Se distingue estado recibido de diagnóstico.
- Se registra responsable y momento de aceptación cuando aplique.

## Definición Exacta De Terminado
T01 está terminado cuando todo taller puede exigir legalmente checklist de recepción, todo usuario autorizado puede consultarlo, y ninguna orden obligatoria queda sin captura completa.

---

## T02 Consentimiento, Retención Y Control De Evidencias

### Objetivo De Negocio
Evitar exposición indebida de fotos, videos o documentos y controlar qué evidencia ve el cliente.

### Problema Que Resuelve
Actualmente una evidencia interna puede terminar visible para el cliente sin control claro de consentimiento o retención.

### Flujo Completo Del Usuario
- Recepcionista: adjunta evidencias iniciales y define visibilidad.
- Técnico: agrega evidencias de diagnóstico o reparación.
- Administrador: revisa y corrige clasificación de evidencias.
- Owner: define políticas de visibilidad y retención.
- Cliente: ve solo evidencias autorizadas.

### Estado Final Esperado
Toda evidencia tiene visibilidad, consentimiento, responsable, fecha de retención y regla clara de exposición al cliente.

### Modelo Funcional
- Entidades involucradas: orden, evidencia, cliente, consentimiento, documento.
- Información requerida: tipo, visibilidad, responsable, fecha, alcance de consentimiento.
- Relaciones funcionales: evidencias pertenecen a una orden y pueden o no ser visibles para cliente.

### Reglas De Negocio
- Obligatorio: toda evidencia debe tener clasificación.
- Opcional: evidencia pública si el taller decide compartirla.
- Validaciones: evidencia sin visibilidad no se publica.
- Restricciones: evidencia interna nunca aparece en portal.
- Bloqueos: no mostrar evidencia al cliente sin permiso explícito.

### Casos Límite
- Foto contiene datos personales.
- Evidencia subida por error.
- Cliente pide eliminación.
- Orden cerrada con evidencias vencidas.
- Técnico marca como pública evidencia sensible.

### Riesgos Operativos
- Fuga de información.
- Costos por almacenamiento.
- Mala clasificación manual.
- Retención legal mal entendida.

### Dependencias Con Otros Tickets
- T01 para recepción.
- T12 para portal.
- T11 para autorizaciones.
- T18 para monitoreo de errores.

### Criterios Exactos De Aceptación
- Toda evidencia tiene visibilidad definida.
- Cliente solo ve evidencias permitidas.
- Admin puede revisar visibilidad.
- Retención queda explícita.
- Evidencia interna no se filtra por ningún flujo.

### Definición Exacta De Terminado
T02 está terminado cuando el taller controla de forma segura qué evidencia existe, quién la subió, quién puede verla y hasta cuándo debe conservarse.

---

## T03 IMEI/Serie Obligatorio Configurable

### Objetivo De Negocio
Identificar dispositivos de forma confiable para historial, garantía, reclamos y trazabilidad.

### Problema Que Resuelve
Órdenes sin IMEI/serie reducen capacidad de rastrear historial y resolver disputas.

### Flujo Completo Del Usuario
- Recepcionista: captura IMEI, serie u otro identificador según tipo de equipo.
- Técnico: usa identificador para confirmar que trabaja sobre el equipo correcto.
- Administrador: define cuándo es obligatorio.
- Owner: establece reglas por tipo de dispositivo.
- Cliente: recibe confianza de que su equipo está correctamente identificado.

### Estado Final Esperado
Fixi exige IMEI/serie cuando el taller lo configura y permite excepción justificada cuando no sea visible o aplicable.

### Modelo Funcional
- Entidades involucradas: equipo, orden, cliente, regla de identificación.
- Información requerida: tipo de equipo, marca/modelo, IMEI, serie, razón de excepción.
- Relaciones funcionales: dispositivo se vincula a órdenes e historial.

### Reglas De Negocio
- Obligatorio: si el tipo de equipo requiere identificador.
- Opcional: identificadores alternos.
- Validaciones: no aceptar valores vacíos cuando aplica.
- Restricciones: excepción requiere motivo.
- Bloqueos: no cerrar recepción si falta identificador obligatorio o excepción.

### Casos Límite
- Equipo no enciende.
- IMEI ilegible.
- Dispositivo sin serie visible.
- Cliente no permite desbloquear.
- Refacción o accesorio sin identificador propio.

### Riesgos Operativos
- Captura incorrecta.
- Duplicados.
- Bloquear recepción legítima.
- Historial mezclado por errores humanos.

### Dependencias Con Otros Tickets
- T01 recepción.
- T09 historial.
- T10 garantía.
- T12 portal.
- T15 reportes.

### Criterios Exactos De Aceptación
- Reglas configurables por taller.
- Recepción respeta obligatoriedad.
- Excepción documentada.
- Historial puede agrupar por IMEI/serie.
- Cliente y técnico ven identificador relevante.

### Definición Exacta De Terminado
T03 está terminado cuando Fixi puede identificar dispositivos de forma consistente sin bloquear casos legítimos donde el identificador no existe o no es visible.

---

## T05 Motor De Caja Ligado A Órdenes

### Objetivo De Negocio
Asegurar que todo ingreso relacionado con una orden quede reflejado en caja y finanzas.

### Problema Que Resuelve
Evita cobros aislados, saldos incorrectos y conciliaciones manuales.

### Flujo Completo Del Usuario
- Recepcionista: registra anticipo o pago al recibir/entregar.
- Técnico: consulta si la orden tiene saldo pendiente.
- Administrador: revisa pagos por orden y sucursal.
- Owner: ve flujo de caja consolidado.
- Cliente: recibe comprobante claro de pagos y saldo.

### Estado Final Esperado
Cada pago queda asociado a una orden, caja, sucursal, método de pago y responsable.

### Modelo Funcional
- Entidades involucradas: orden, pago, caja, sucursal, cliente.
- Información requerida: monto, método, fecha, responsable, concepto.
- Relaciones funcionales: una orden puede tener varios pagos; caja resume movimientos.

### Reglas De Negocio
- Obligatorio: pago debe tener orden o motivo financiero válido.
- Opcional: anticipo parcial.
- Validaciones: monto positivo, método válido.
- Restricciones: no editar pagos históricos destructivamente.
- Bloqueos: no marcar como pagado si saldo no está cubierto.

### Casos Límite
- Pago parcial.
- Pago mixto.
- Devolución posterior.
- Pago duplicado.
- Cliente paga en sucursal distinta.

### Riesgos Operativos
- Duplicidad de ingresos.
- Cajeros registran fuera de orden.
- Reportes financieros inconsistentes.

### Dependencias Con Otros Tickets
- T04 auditoría.
- T06 ajustes.
- T15 reportes.
- T12 portal para saldos.

### Criterios Exactos De Aceptación
- Pago aparece en orden y caja.
- Saldo de orden se calcula correctamente.
- Historial financiero no se borra.
- Owner ve ingresos por sucursal y periodo.
- Cliente puede entender pagos realizados.

### Definición Exacta De Terminado
T05 está terminado cuando cada peso recibido por una orden queda trazado, conciliable y visible en caja sin registros duplicados.

---

## T06 Cancelaciones, Reembolsos Y Ajustes Financieros

### Objetivo De Negocio
Controlar dinero histórico sin permitir ediciones destructivas.

### Problema Que Resuelve
Evita que usuarios borren pagos, modifiquen ingresos pasados o hagan reembolsos sin motivo.

### Flujo Completo Del Usuario
- Recepcionista: solicita cancelación o devolución con motivo.
- Técnico: ve si una orden fue cancelada.
- Administrador: aprueba ajustes según permisos.
- Owner: revisa impacto financiero y auditoría.
- Cliente: recibe claridad sobre reembolso/cancelación.

### Estado Final Esperado
Toda cancelación, devolución o ajuste queda como movimiento nuevo vinculado al original.

### Modelo Funcional
- Entidades involucradas: orden, pago, ajuste, reembolso, autorización.
- Información requerida: motivo, monto, responsable, aprobación, referencia original.
- Relaciones funcionales: ajuste siempre apunta a movimiento original.

### Reglas De Negocio
- Obligatorio: motivo para todo ajuste.
- Opcional: comentario adicional.
- Validaciones: no reembolsar más de lo pagado.
- Restricciones: no borrar dinero histórico.
- Bloqueos: usuarios sin permiso no pueden aprobar.

### Casos Límite
- Reembolso parcial.
- Pago mixto.
- Orden cancelada con piezas usadas.
- Cliente no tiene comprobante.
- Error de cajero detectado días después.

### Riesgos Operativos
- Fraude interno.
- Reportes inconsistentes.
- Confusión entre cancelación operativa y financiera.

### Dependencias Con Otros Tickets
- T05 caja.
- T04 auditoría.
- T15 reportes.

### Criterios Exactos De Aceptación
- Ajuste no elimina movimiento original.
- Reembolso exige motivo y responsable.
- Permisos diferencian solicitud y aprobación.
- Reportes muestran pago y reversa.
- Orden refleja estado financiero real.

### Definición Exacta De Terminado
T06 está terminado cuando Fixi permite corregir dinero sin destruir historial y todo ajuste queda explicado, autorizado y trazable.

---

## T07 Reserva Automática De Refacciones Por Orden

### Objetivo De Negocio
Evitar vender o usar piezas que ya están comprometidas para una reparación.

### Problema Que Resuelve
Inventario disponible se confunde con inventario reservado.

### Flujo Completo Del Usuario
- Recepcionista: informa disponibilidad estimada.
- Técnico: reserva pieza para una orden.
- Administrador: revisa piezas reservadas/consumidas.
- Owner: entiende demanda real de refacciones.
- Cliente: recibe tiempos más confiables.

### Estado Final Esperado
Una orden puede reservar refacciones, consumirlas o liberarlas según avance.

### Modelo Funcional
- Entidades involucradas: orden, refacción, inventario, reserva, sucursal.
- Información requerida: pieza, cantidad, sucursal, estado reserva.
- Relaciones funcionales: reserva pertenece a una orden y afecta disponibilidad.

### Reglas De Negocio
- Obligatorio: reserva requiere stock disponible.
- Opcional: reserva parcial.
- Validaciones: cantidad positiva.
- Restricciones: reservar solo desde sucursal válida.
- Bloqueos: no reservar más de lo disponible.

### Casos Límite
- Pieza reservada pero orden cancelada.
- Técnico cambia diagnóstico.
- Pieza en otra sucursal.
- Reserva parcial por falta de stock.
- Varios técnicos compiten por misma pieza.

### Riesgos Operativos
- Sobre-reserva.
- Stock fantasma.
- Reservas olvidadas.
- Desbalance entre sucursales.

### Dependencias Con Otros Tickets
- T08 consumo atómico.
- T05/T06 si piezas se cobran.
- T15 reportes.

### Criterios Exactos De Aceptación
- Disponible excluye reservado.
- Orden muestra piezas reservadas.
- Cancelar orden libera reserva.
- Consumir pieza cambia estado.
- Admin ve reservas por sucursal.

### Definición Exacta De Terminado
T07 está terminado cuando Fixi distingue con precisión stock disponible, reservado y consumido por orden.

---

## T08 Consumo Atómico De Inventario

### Objetivo De Negocio
Evitar stock negativo, duplicado o inconsistente durante consumo de piezas.

### Problema Que Resuelve
Condiciones de carrera cuando varios usuarios consumen inventario al mismo tiempo.

### Flujo Completo Del Usuario
- Recepcionista: consulta disponibilidad confiable.
- Técnico: consume pieza una sola vez.
- Administrador: revisa movimientos exactos.
- Owner: confía en inventario financiero.
- Cliente: recibe reparación sin promesas falsas.

### Estado Final Esperado
Cada consumo de inventario ocurre una sola vez, valida stock y deja movimiento irreversible.

### Modelo Funcional
- Entidades involucradas: inventario, movimiento, orden, refacción, sucursal.
- Información requerida: cantidad, pieza, orden, responsable, referencia.
- Relaciones funcionales: movimiento reduce stock y se vincula a orden/refacción.

### Reglas De Negocio
- Obligatorio: consumo exige stock suficiente.
- Opcional: motivo adicional.
- Validaciones: cantidad positiva.
- Restricciones: no permitir stock negativo.
- Bloqueos: reintentos no deben duplicar consumo.

### Casos Límite
- Doble click.
- Pérdida de conexión.
- Dos técnicos consumen misma pieza.
- Reintento automático.
- Pieza ya consumida previamente.

### Riesgos Operativos
- Stock negativo.
- Costo de reparación incorrecto.
- Pérdida financiera.
- Inventario no confiable.

### Dependencias Con Otros Tickets
- T07 reservas.
- T15 reportes.
- T06 ajustes.

### Criterios Exactos De Aceptación
- No existe consumo duplicado por reintento.
- Stock nunca queda negativo.
- Movimiento es trazable.
- Error de stock insuficiente es claro.
- Inventario y orden quedan sincronizados.

### Definición Exacta De Terminado
T08 está terminado cuando Fixi garantiza que el inventario se consume de forma única, consistente y segura bajo concurrencia.

---

## T09 Historial Clínico Por Dispositivo

### Objetivo De Negocio
Permitir ver todo el historial de reparaciones de un equipo específico.

### Problema Que Resuelve
Sin historial por IMEI/serie, el taller no sabe si un problema es recurrente.

### Flujo Completo Del Usuario
- Recepcionista: detecta visitas previas.
- Técnico: revisa reparaciones anteriores.
- Administrador: identifica reincidencias.
- Owner: analiza calidad y garantías.
- Cliente: recibe atención más informada.

### Estado Final Esperado
Cada dispositivo tiene historial de órdenes, diagnósticos, evidencias, garantías y eventos relevantes.

### Modelo Funcional
- Entidades involucradas: dispositivo, orden, cliente, historial, evidencia.
- Información requerida: IMEI/serie, fechas, fallas, reparaciones, garantías.
- Relaciones funcionales: dispositivo agrupa órdenes pasadas.

### Reglas De Negocio
- Obligatorio: historial por identificador confiable.
- Opcional: búsqueda por cliente.
- Validaciones: no mezclar dispositivos distintos.
- Restricciones: proteger información de otros clientes.
- Bloqueos: no mostrar historial si identificador es ambiguo sin confirmación.

### Casos Límite
- Dispositivo vendido a otro cliente.
- Serial duplicado.
- IMEI mal capturado.
- Orden antigua sin identificador.
- Cliente trae equipo de tercero.

### Riesgos Operativos
- Exponer datos de otro cliente.
- Decisiones técnicas basadas en historial incorrecto.
- Confundir garantía vigente.

### Dependencias Con Otros Tickets
- T03 obligatorio.
- T01 recepción.
- T10 garantías.
- T12 portal.

### Criterios Exactos De Aceptación
- Búsqueda por IMEI/serie.
- Historial visible en orden y cliente.
- Datos sensibles protegidos.
- Garantías anteriores visibles.
- Ambigüedades se muestran claramente.

### Definición Exacta De Terminado
T09 está terminado cuando el taller puede entender la vida operativa de un dispositivo sin mezclar clientes ni equipos.

---

## T10 Garantías Completas

### Objetivo De Negocio
Gestionar garantías de reparaciones de forma clara y defendible.

### Problema Que Resuelve
Evita promesas informales, fechas ambiguas y reclamos sin contexto.

### Flujo Completo Del Usuario
- Recepcionista: consulta si una garantía aplica.
- Técnico: evalúa si falla corresponde a garantía.
- Administrador: activa o ajusta garantía.
- Owner: define políticas de garantía.
- Cliente: ve condiciones y vigencia.

### Estado Final Esperado
Cada garantía tiene alcance, vigencia, condiciones, responsable y relación con orden/pieza/servicio.

### Modelo Funcional
- Entidades involucradas: orden, garantía, cliente, dispositivo, concepto.
- Información requerida: fecha inicio, vencimiento, cobertura, exclusiones.
- Relaciones funcionales: garantía se origina en una orden y puede aplicar a conceptos específicos.

### Reglas De Negocio
- Obligatorio: vigencia y alcance.
- Opcional: garantía por pieza o servicio.
- Validaciones: fecha válida.
- Restricciones: garantía no debe cubrir daños nuevos no relacionados.
- Bloqueos: no prometer garantía sin orden base.

### Casos Límite
- Daño por mal uso.
- Pieza distinta falla.
- Cliente reclama fuera de plazo.
- Garantía parcial.
- Orden reabierta por garantía.

### Riesgos Operativos
- Pérdidas por garantías mal definidas.
- Conflictos con cliente.
- Técnicos aplican garantía incorrecta.

### Dependencias Con Otros Tickets
- T03 dispositivo.
- T09 historial.
- T12 portal.
- T11 aceptación.

### Criterios Exactos De Aceptación
- Garantía visible en orden.
- Cliente ve vigencia y condiciones.
- Reclamo identifica garantía origen.
- Garantía puede cerrarse o cumplirse.
- Owner puede revisar garantías activas.

### Definición Exacta De Terminado
T10 está terminado cuando Fixi administra garantías como compromisos formales, claros y consultables.

---

## T11 Autorización Online Con Aceptación/Firma

### Objetivo De Negocio
Reducir fricción para aprobar presupuestos y dejar evidencia de aceptación.

### Problema Que Resuelve
Presupuestos aprobados por WhatsApp o verbalmente no son defendibles.

### Flujo Completo Del Usuario
- Recepcionista: envía solicitud de autorización.
- Técnico: espera aprobación antes de reparar.
- Administrador: revisa estado de autorización.
- Owner: controla riesgo legal.
- Cliente: acepta o rechaza presupuesto desde enlace.

### Estado Final Esperado
Cada autorización guarda decisión, fecha, nombre, evidencia de aceptación y presupuesto congelado.

### Modelo Funcional
- Entidades involucradas: orden, presupuesto, autorización, cliente.
- Información requerida: snapshot del presupuesto, decisión, identidad, fecha.
- Relaciones funcionales: autorización pertenece a una orden y cubre un presupuesto específico.

### Reglas De Negocio
- Obligatorio: snapshot antes de aceptar.
- Opcional: firma simple.
- Validaciones: no aceptar presupuesto vacío.
- Restricciones: cambios posteriores requieren nueva autorización.
- Bloqueos: reparación no avanza si requiere autorización pendiente.

### Casos Límite
- Cliente rechaza.
- Cliente acepta y luego cambia de opinión.
- Presupuesto cambia.
- Enlace compartido.
- Cliente no tiene acceso digital.

### Riesgos Operativos
- Autorización sin presupuesto congelado.
- Suplantación.
- Reparación sin aprobación.

### Dependencias Con Otros Tickets
- T10 garantía.
- T12 portal.
- T13 mensajería.
- T05 pagos si requiere anticipo.

### Criterios Exactos De Aceptación
- Cliente puede aceptar/rechazar.
- Autorización muestra presupuesto exacto.
- Admin ve estado.
- Reparación respeta autorización.
- Evidencia queda en historial.

### Definición Exacta De Terminado
T11 está terminado cuando ninguna autorización depende de mensajes informales y toda aprobación queda respaldada.

---

## T12 Portal Cliente Completo Con Documentos

### Objetivo De Negocio
Dar al cliente autoservicio y transparencia sin exponer información interna.

### Problema Que Resuelve
Clientes preguntan por estado, documentos, evidencias, garantías y autorizaciones por canales manuales.

### Flujo Completo Del Usuario
- Recepcionista: comparte folio/enlace.
- Técnico: actualiza estados que el cliente puede consultar.
- Administrador: controla documentos visibles.
- Owner: reduce carga operativa.
- Cliente: consulta estado, documentos, evidencias, garantía y autorizaciones.

### Estado Final Esperado
Portal muestra solo información pública y útil de la orden.

### Modelo Funcional
- Entidades involucradas: orden, cliente, documentos, evidencias, garantía, autorización.
- Información requerida: folio, estado, fechas, documentos visibles, eventos públicos.
- Relaciones funcionales: portal es vista pública filtrada de la orden.

### Reglas De Negocio
- Obligatorio: filtrar información interna.
- Opcional: evidencias visibles.
- Validaciones: folio/enlace válido.
- Restricciones: notas internas nunca se muestran.
- Bloqueos: orden no encontrada no revela datos.

### Casos Límite
- Folio incorrecto.
- Orden sin documentos.
- Evidencia no visible.
- Cliente comparte enlace.
- Orden cancelada.

### Riesgos Operativos
- Fuga de notas internas.
- Confusión por estados técnicos.
- Documentos incorrectos visibles.

### Dependencias Con Otros Tickets
- T02 evidencias.
- T10 garantía.
- T11 autorización.
- T13 notificaciones.

### Criterios Exactos De Aceptación
- Cliente ve estado.
- Cliente ve documentos permitidos.
- Cliente ve evidencias permitidas.
- No se filtran notas internas.
- Portal maneja vacío/error correctamente.

### Definición Exacta De Terminado
T12 está terminado cuando el cliente puede autoservirse sin comprometer seguridad ni privacidad.

---

## T13 WhatsApp Automatizado Con Cola Y Bitácora

### Objetivo De Negocio
Automatizar comunicación operativa sin duplicar mensajes ni perder trazabilidad.

### Problema Que Resuelve
Mensajes manuales son inconsistentes, duplicados o no quedan registrados.

### Flujo Completo Del Usuario
- Recepcionista: dispara comunicaciones estándar.
- Técnico: actualiza estado y genera mensajes automáticos.
- Administrador: revisa bitácora de mensajes.
- Owner: define plantillas.
- Cliente: recibe actualizaciones oportunas.

### Estado Final Esperado
Cada mensaje tiene evento origen, plantilla, destinatario, estado, reintentos y resultado.

### Modelo Funcional
- Entidades involucradas: orden, cliente, mensaje, plantilla, evento.
- Información requerida: destinatario, contenido, estado, intento, resultado.
- Relaciones funcionales: mensajes se vinculan a eventos de orden.

### Reglas De Negocio
- Obligatorio: no duplicar por mismo evento.
- Opcional: reintento manual.
- Validaciones: teléfono válido.
- Restricciones: no enviar sin consentimiento cuando aplique.
- Bloqueos: plantilla inválida no se envía.

### Casos Límite
- Teléfono inválido.
- Cliente bloquea mensajes.
- Reintento después de fallo.
- Estado cambia varias veces.
- Plantilla no aprobada.

### Riesgos Operativos
- Spam involuntario.
- Duplicados.
- Costos de mensajería.
- Mensajes con información sensible.

### Dependencias Con Otros Tickets
- T02 consentimiento.
- T11 autorizaciones.
- T12 portal.
- T18 observabilidad.

### Criterios Exactos De Aceptación
- Mensajes no se duplican.
- Bitácora visible por orden.
- Fallos quedan registrados.
- Reintentos son controlados.
- Cliente recibe mensajes correctos.

### Definición Exacta De Terminado
T13 está terminado cuando Fixi comunica automáticamente con trazabilidad y control de duplicados.

---

## T14 Tiempos, Productividad Y Comisiones

### Objetivo De Negocio
Medir productividad técnica y calcular incentivos de forma justa.

### Problema Que Resuelve
No se sabe cuánto tarda cada reparación ni cómo calcular comisiones.

### Flujo Completo Del Usuario
- Recepcionista: ve disponibilidad estimada.
- Técnico: inicia, pausa y termina trabajo.
- Administrador: revisa productividad.
- Owner: define reglas de comisión.
- Cliente: recibe tiempos más realistas.

### Estado Final Esperado
Cada trabajo técnico tiene tiempos, responsable, pausas, resultado y posible comisión.

### Modelo Funcional
- Entidades involucradas: técnico, orden, trabajo, comisión, regla.
- Información requerida: inicio, pausa, fin, motivo, monto, responsable.
- Relaciones funcionales: trabajos pertenecen a órdenes y técnicos.

### Reglas De Negocio
- Obligatorio: cierre de trabajo para medir.
- Opcional: pausas.
- Validaciones: tiempos coherentes.
- Restricciones: no comisionar sin regla.
- Bloqueos: no cerrar comisión si orden no cumple condiciones.

### Casos Límite
- Cambio de técnico.
- Trabajo pausado varios días.
- Técnico olvida iniciar.
- Orden compartida.
- Retrabajo por garantía.

### Riesgos Operativos
- Incentivos injustos.
- Manipulación de tiempos.
- Conflictos laborales.

### Dependencias Con Otros Tickets
- T09 historial.
- T15 reportes.
- T10 garantías.

### Criterios Exactos De Aceptación
- Técnico registra tiempo.
- Admin ve productividad.
- Comisiones se calculan con reglas.
- Pausas no inflan tiempo.
- Cambios quedan trazados.

### Definición Exacta De Terminado
T14 está terminado cuando Fixi mide trabajo técnico de forma confiable y calculable.

---

## T15 Reportes Operativos Confiables

### Objetivo De Negocio
Dar a owners información real para operar y crecer.

### Problema Que Resuelve
Reportes lentos, inconsistentes o calculados de forma distinta por módulo.

### Flujo Completo Del Usuario
- Recepcionista: no interactúa directamente salvo datos base.
- Técnico: genera datos de tiempos/estados.
- Administrador: analiza operación diaria.
- Owner: revisa ventas, caja, inventario, productividad.
- Cliente: no interactúa directamente.

### Estado Final Esperado
Reportes muestran métricas consistentes por periodo, sucursal, estado, técnico y finanzas.

### Modelo Funcional
- Entidades involucradas: órdenes, pagos, inventario, técnicos, sucursales.
- Información requerida: fechas, estados, montos, movimientos, productividad.
- Relaciones funcionales: reportes consolidan datos operativos.

### Reglas De Negocio
- Obligatorio: métricas definidas de forma única.
- Opcional: filtros avanzados.
- Validaciones: periodos válidos.
- Restricciones: usuarios ven solo alcance permitido.
- Bloqueos: no mostrar datos incompletos como definitivos.

### Casos Límite
- Periodos grandes.
- Sucursal sin datos.
- Orden cancelada.
- Ajustes financieros.
- Inventario sin costo.

### Riesgos Operativos
- Decisiones con datos incorrectos.
- Reportes lentos.
- Diferencias entre caja y ventas.

### Dependencias Con Otros Tickets
- T05/T06 dinero.
- T07/T08 inventario.
- T14 productividad.
- T04 auditoría.

### Criterios Exactos De Aceptación
- Reportes consistentes.
- Filtros claros.
- Datos respetan permisos.
- Métricas documentadas.
- Rendimiento aceptable para operación diaria.

### Definición Exacta De Terminado
T15 está terminado cuando owner puede dirigir el negocio con datos confiables y consistentes.

---

## T16 Pruebas E2E De Flujos Críticos

### Objetivo De Negocio
Proteger los flujos que sostienen operación y ventas.

### Problema Que Resuelve
Cambios rompen recepción, caja, inventario o portal sin detectarse.

### Flujo Completo Del Usuario
- Recepcionista: flujo recepción probado.
- Técnico: flujo diagnóstico/estado probado.
- Administrador: caja/inventario probado.
- Owner: seguridad/reportes básicos probados.
- Cliente: portal/autorización probado.

### Estado Final Esperado
Flujos críticos se validan de punta a punta con datos controlados.

### Modelo Funcional
- Entidades involucradas: tenant prueba, usuarios prueba, orden, pago, inventario, portal.
- Información requerida: escenarios y resultados esperados.
- Relaciones funcionales: pruebas recorren el ciclo operativo completo.

### Reglas De Negocio
- Obligatorio: no depender de datos reales cambiantes.
- Opcional: pruebas visuales.
- Validaciones: cada flujo confirma resultado observable.
- Restricciones: no contaminar producción.
- Bloqueos: release no avanza si flujo crítico falla.

### Casos Límite
- Datos de prueba vencidos.
- Usuario sin permiso.
- Ambiente caído.
- Prueba flaky.
- Cambios de UI.

### Riesgos Operativos
- Falsa confianza.
- Tests frágiles.
- Costos de mantenimiento.

### Dependencias Con Otros Tickets
- Todos los P0 operativos.
- T18 observabilidad.

### Criterios Exactos De Aceptación
- Recepción probada.
- Caja probada.
- Inventario probado.
- Portal probado.
- Fallas son claras y accionables.

### Definición Exacta De Terminado
T16 está terminado cuando Fixi puede validar automáticamente sus flujos críticos antes de liberar cambios.

---

## T17 Backoffice Interno FIXI

### Objetivo De Negocio
Permitir soporte y operación interna segura sobre tenants.

### Problema Que Resuelve
Sin backoffice, soporte depende de accesos manuales o intervención directa riesgosa.

### Flujo Completo Del Usuario
- Recepcionista: sin interacción.
- Técnico: sin interacción.
- Administrador: puede recibir soporte.
- Owner: puede solicitar soporte.
- Cliente: sin interacción directa.
- Equipo Fixi: consulta tenants, estado, soporte y auditoría interna.

### Estado Final Esperado
Fixi opera soporte multi-tenant con permisos internos limitados y trazabilidad.

### Modelo Funcional
- Entidades involucradas: tenant, usuario interno, soporte, auditoría interna.
- Información requerida: tenant, motivo, acción, responsable.
- Relaciones funcionales: acciones internas se vinculan a tenant y caso de soporte.

### Reglas De Negocio
- Obligatorio: acceso interno mínimo.
- Opcional: impersonación controlada.
- Validaciones: motivo obligatorio.
- Restricciones: soporte no debe modificar sin autorización.
- Bloqueos: acceso sin rol interno prohibido.

### Casos Límite
- Urgencia de producción.
- Tenant solicita eliminación.
- Soporte necesita investigar datos sensibles.
- Error humano interno.
- Usuario interno cambia de rol.

### Riesgos Operativos
- Acceso excesivo.
- Fuga de datos.
- Soporte sin trazabilidad.

### Dependencias Con Otros Tickets
- T04 auditoría.
- T19 billing/planes.
- T18 observabilidad.

### Criterios Exactos De Aceptación
- Solo usuarios internos autorizados acceden.
- Toda acción tiene motivo.
- Owner puede identificar soporte recibido.
- Acceso queda trazado.
- No hay acceso indiscriminado.

### Definición Exacta De Terminado
T17 está terminado cuando Fixi puede dar soporte interno sin comprometer aislamiento ni confianza.

---

## T18 Observabilidad Y Alertas

### Objetivo De Negocio
Detectar fallas antes de que afecten masivamente a talleres.

### Problema Que Resuelve
Sin visibilidad, errores de producción se descubren por quejas de clientes.

### Flujo Completo Del Usuario
- Recepcionista: experimenta menos interrupciones.
- Técnico: menos errores en operación.
- Administrador: recibe estabilidad.
- Owner: confía en disponibilidad.
- Cliente: portal más confiable.
- Equipo Fixi: recibe alertas accionables.

### Estado Final Esperado
Fixi monitorea salud, errores, latencia y eventos operativos críticos.

### Modelo Funcional
- Entidades involucradas: servicio, incidente, alerta, operación crítica.
- Información requerida: error, severidad, contexto, hora, impacto.
- Relaciones funcionales: alertas se relacionan con módulos y tenants afectados.

### Reglas De Negocio
- Obligatorio: alertas para caídas y errores críticos.
- Opcional: dashboard interno.
- Validaciones: no alertar ruido excesivo.
- Restricciones: no registrar datos sensibles.
- Bloqueos: incidente crítico exige atención.

### Casos Límite
- Falla parcial.
- Error solo en un tenant.
- Latencia alta sin caída.
- Alertas repetidas.
- Datos sensibles en error.

### Riesgos Operativos
- Ruido de alertas.
- Falta de contexto.
- Exposición de información.

### Dependencias Con Otros Tickets
- T04 auditoría.
- T13 mensajería.
- T16 pruebas.

### Criterios Exactos De Aceptación
- Salud visible.
- Errores críticos alertan.
- Alertas tienen contexto.
- No se filtra información sensible.
- Equipo puede diagnosticar rápido.

### Definición Exacta De Terminado
T18 está terminado cuando Fixi detecta, prioriza y comunica fallas operativas de forma confiable.

---

## T19 Límites De Plan Y Billing Enforcement

### Objetivo De Negocio
Proteger monetización y evitar uso fuera de plan.

### Problema Que Resuelve
Tenants pueden consumir funciones o volumen no pagado.

### Flujo Completo Del Usuario
- Recepcionista: ve bloqueo claro si excede límite.
- Técnico: módulos no contratados no aparecen.
- Administrador: entiende límites operativos.
- Owner: ve plan, consumo y upgrade.
- Cliente: no interactúa directamente.

### Estado Final Esperado
Cada tenant opera dentro de su plan con límites claros y rutas de upgrade.

### Modelo Funcional
- Entidades involucradas: tenant, plan, módulo, límite, consumo.
- Información requerida: plan, estado, módulos, uso, límite.
- Relaciones funcionales: plan habilita capacidades y bloquea excedentes.

### Reglas De Negocio
- Obligatorio: no bloquear por error a tenants activos.
- Opcional: grace period.
- Validaciones: límites por acción.
- Restricciones: módulos no contratados no se usan.
- Bloqueos: plan vencido limita acciones críticas no esenciales.

### Casos Límite
- Pago recién realizado.
- Tenant en trial.
- Exceso temporal.
- Error de proveedor de pago.
- Owner necesita exportar datos aunque esté vencido.

### Riesgos Operativos
- Bloquear clientes buenos.
- Pérdida de ingresos.
- Mala experiencia de upgrade.

### Dependencias Con Otros Tickets
- T05/T06 billing operativo.
- T17 backoffice.
- T18 observabilidad.

### Criterios Exactos De Aceptación
- Límites visibles.
- Bloqueos claros.
- Upgrade disponible.
- Tenants activos no se bloquean indebidamente.
- Consumo se calcula de forma consistente.

### Definición Exacta De Terminado
T19 está terminado cuando Fixi puede monetizar planes sin dañar operación legítima.

---

## T20 Exportación/Importación De Datos Por Tenant

### Objetivo De Negocio
Facilitar onboarding, portabilidad y confianza del cliente.

### Problema Que Resuelve
Migrar datos manualmente es lento y riesgoso; salir de Fixi sin exportación reduce confianza.

### Flujo Completo Del Usuario
- Recepcionista: no interactúa directamente.
- Técnico: no interactúa directamente.
- Administrador: importa clientes/inventario.
- Owner: exporta datos del negocio.
- Cliente: no interactúa directamente.

### Estado Final Esperado
Tenant puede exportar datos propios e importar datos permitidos con validación.

### Modelo Funcional
- Entidades involucradas: tenant, exportación, importación, errores, módulos.
- Información requerida: tipo de datos, archivo, resultado, errores.
- Relaciones funcionales: jobs pertenecen a tenant y usuario solicitante.

### Reglas De Negocio
- Obligatorio: exportar solo datos del tenant.
- Opcional: importación por módulo.
- Validaciones: errores por fila.
- Restricciones: no sobrescribir sin confirmación.
- Bloqueos: archivos inválidos no se importan.

### Casos Límite
- Archivo gigante.
- Datos duplicados.
- Formato incorrecto.
- Campos faltantes.
- Exportación con información sensible.

### Riesgos Operativos
- Fuga de datos.
- Duplicados masivos.
- Sobrecarga operativa.
- Mala calidad de datos importados.

### Dependencias Con Otros Tickets
- T17 backoffice.
- T19 planes.
- T18 observabilidad.

### Criterios Exactos De Aceptación
- Exportación solo del tenant.
- Importación valida filas.
- Errores son claros.
- Progreso visible.
- Datos sensibles tratados con cuidado.

### Definición Exacta De Terminado
T20 está terminado cuando Fixi permite portabilidad y onboarding masivo sin comprometer aislamiento ni calidad de datos.
