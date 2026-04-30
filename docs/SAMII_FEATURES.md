# Samii Feature Audit

Fuente de evidencia:
- Navegación E2E en navegador autenticado sobre `https://samiiweb.com`
- Inspección del monorepo local equivalente al producto servido en Samii

Nota operativa:
- `Verificado en UI` = se abrió y/o recorrió en el navegador.
- `Implementado` = existe en frontend/backend del producto, aunque no siempre se pudo completar el flujo visual por restricciones del navegador o del hosting.

## Resumen ejecutivo

Samii es un ERP de taller con:
- dashboard operativo
- órdenes de servicio con checklist, fotos, documentos y eventos
- clientes, técnicos, inventario, proveedores, compras, gastos y reportes
- configuración de branding/portal/PDF por tenant
- portal público por tenant y consulta pública por folio
- billing y suscripciones

## Flujos verificados en UI

### Dashboard
- `Verificado en UI`
- Muestra estado de órdenes, métricas financieras, progreso de onboarding y accesos rápidos.
- Acción disponible: entrar a `Configurar mi negocio`, crear orden, acceder a módulos.

### Alta de orden
- `Verificado en UI`
- Ruta: `https://samiiweb.com/orders/create`
- Inputs visibles:
  - cliente
  - placa
  - tipo de dispositivo
  - marca
  - modelo
  - accesorios
  - checklist template
  - descripción/falla
- Outputs visibles:
  - creación de orden
  - portal del cliente
  - link de WhatsApp

### Business setup
- `Verificado en UI`
- Ruta: `https://samiiweb.com/administration/business`
- Inputs visibles:
  - nombre
  - país
  - teléfono
  - moneda
  - zona horaria
  - formato de fecha
  - dirección
  - logo
  - impuestos fijos

## Inventario de features por módulo

### Órdenes / Servicios
- `Implementado`
- Crear orden de servicio
- Editar orden
- Cambiar estado
- Registrar notas internas y públicas
- Asociar checklist template
- Generar eventos de orden
- Subir fotos de evidencia
- Generar PDF de orden
- Enviar enlace por WhatsApp

### Clientes
- `Implementado`
- Listado
- Crear cliente
- Actualizar cliente
- Reutilización por teléfono/email en flujo público

### Técnicos
- `Implementado`
- Listado
- Crear técnico
- Actualizar técnico

### Inventario
- `Implementado`
- Listado de productos
- Crear producto
- Ajuste manual de stock
- Registro de movimientos
- Alertas de stock bajo

### Proveedores
- `Implementado`
- Listado
- Crear proveedor
- Actualizar proveedor

### Compras
- `Implementado`
- Listado de órdenes de compra
- Crear orden de compra
- Recepción de compra
- Total por orden

### Gastos / Finanzas
- `Implementado`
- Listado de gastos
- Crear gasto
- Resumen financiero
- Categorías sugeridas

### Reportes
- `Implementado`
- Resumen operacional
- Conteo por estado
- Exportación CSV

### Configuración
- `Implementado`
- Branding público del tenant
- Branding del portal
- Textos de PDFs
- Contacto / WhatsApp / dirección / email
- Colores primarios/secundarios

### Portal cliente
- `Implementado`
- Consulta pública por folio
- Vista de seguimiento
- Acciones públicas vinculadas a orden

### Landing / marketing
- `Implementado`
- Página pública por tenant
- Copy editable por tenant
- CTA principal editable
- Servicios visibles en sitio público

### Billing
- `Implementado`
- Estado de suscripción
- Checkout
- Reconciliación
- Cuota de almacenamiento

### Auditoría
- `Implementado`
- Eventos de auditoría
- Trazabilidad de acciones sensibles

## Inventario resumido

| Módulo | Feature | Acción | Flujo | Complejidad | Observaciones |
|---|---|---:|---|---:|---|
| Dashboard | KPIs operativos | Ver | Lectura | Media | Dashboard con estado y métricas |
| Órdenes | Crear orden | Crear | Cliente + vehículo + checklist | Alta | Genera folio, evento, WhatsApp y portal |
| Órdenes | Editar orden | Editar | Cambiar datos y estado | Alta | Incluye checklist y notificación |
| Órdenes | Fotos | Subir | Evidencia visual | Alta | Usa almacenamiento y cuota |
| Órdenes | PDF | Generar | Documento | Alta | Flujo de documentos por tenant |
| Clientes | CRUD base | Crear/editar/listar | CRM | Media | Reutilizado por órdenes públicas |
| Técnicos | CRUD base | Crear/editar/listar | Asignación | Media | Soporta responsable de orden |
| Inventario | Stock | Crear/ajustar | Control operativo | Alta | Movimientos + alertas |
| Proveedores | CRUD base | Crear/editar/listar | Abastecimiento | Media | Entrada a compras |
| Compras | OC | Crear/recibir | Procurement | Alta | Flujo completo de compra |
| Gastos | Egreso | Crear/listar | Finanzas | Media | Categorías y resumen |
| Reportes | CSV/KPIs | Ver/descargar | Analytics | Media | Exportación operativa |
| Configuración | Branding | Editar | Tenant setup | Alta | Impacta web, portal y PDFs |
| Portal | Tracking | Consultar | Público | Media | Por folio |
| Landing | Marketing | Ver/editar | Público | Media | Página pública del tenant |
| Billing | Suscripción | Ver/reconciliar | SaaS | Alta | Controla acceso y storage |

