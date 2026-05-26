# Source Truth UI Audit

Fecha de auditoría: 2026-05-26

Repositorio fuente de verdad:
- [Sr-Fix](https://github.com/serviciosdigitalesmx/Sr-Fix)

Repositorio objetivo:
- [Sdmx-pagina-principal](/Users/jesusvilla/Desktop/Sdmx-pagina-principal)

Alcance de esta auditoría:
- Solo inventario y comparación
- Sin implementación
- Sin mocks
- Sin propuestas de rediseño
- Solo evidencia real por archivo

## 1. Inventario UI

### 1.1 Páginas y rutas

#### Source: Sr-Fix

- [index.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/index.html)
- [integrador.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/integrador.html)
- [portal-cliente.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/portal-cliente.html)
- [panel-operativo.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-operativo.html)
- [panel-tecnico.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-tecnico.html)
- [panel-clientes.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-clientes.html)
- [panel-solicitudes.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-solicitudes.html)
- [panel-archivo.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-archivo.html)
- [panel-stock.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-stock.html)
- [panel-proveedores.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-proveedores.html)
- [panel-compras.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-compras.html)
- [panel-gastos.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-gastos.html)
- [panel-finanzas.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-finanzas.html)
- [panel-reportes.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-reportes.html)
- [panel-sucursales.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-sucursales.html)
- [panel-seguridad.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-seguridad.html)
- [panel-tareas.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-tareas.html)

#### Target: Sdmx-pagina-principal

- [apps/web-public/src/app/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/page.tsx)
- [apps/web-public/src/app/[tenant]/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/%5Btenant%5D/page.tsx)
- [apps/web-public/src/app/[tenant]/cotizar/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/%5Btenant%5D/cotizar/page.tsx)
- [apps/web-public/src/app/[tenant]/tracking/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/%5Btenant%5D/tracking/page.tsx)
- [apps/web-public/src/app/t/[tenantSlug]/portal/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/t/%5BtenantSlug%5D/portal/page.tsx)
- [apps/web-public/src/app/login/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/login/page.tsx)
- [apps/web-public/src/app/onboarding/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/onboarding/page.tsx)
- [apps/web-public/src/app/auth/bridge/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/auth/bridge/page.tsx)
- [apps/web-public/src/app/hub/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/hub/page.tsx)
- [apps/web-admin/src/app/dashboard/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/page.tsx)
- [apps/web-admin/src/app/dashboard/clientes/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/clientes/page.tsx)
- [apps/web-admin/src/app/dashboard/solicitudes/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/solicitudes/page.tsx)
- [apps/web-admin/src/app/dashboard/archivo/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/archivo/page.tsx)
- [apps/web-admin/src/app/dashboard/stock/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/stock/page.tsx)
- [apps/web-admin/src/app/dashboard/proveedores/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/proveedores/page.tsx)
- [apps/web-admin/src/app/dashboard/compras/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/compras/page.tsx)
- [apps/web-admin/src/app/dashboard/gastos/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/gastos/page.tsx)
- [apps/web-admin/src/app/dashboard/finanzas/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/finanzas/page.tsx)
- [apps/web-admin/src/app/dashboard/reportes/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/reportes/page.tsx)
- [apps/web-admin/src/app/dashboard/sucursales/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/sucursales/page.tsx)
- [apps/web-admin/src/app/dashboard/seguridad/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/seguridad/page.tsx)
- [apps/web-admin/src/app/dashboard/ordenes/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/ordenes/page.tsx)
- [apps/web-admin/src/app/dashboard/tareas/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/tareas/page.tsx)
- [apps/web-clientes/src/app/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/page.tsx)
- [apps/web-clientes/src/app/t/[tenantSlug]/portal/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/t/%5BtenantSlug%5D/portal/page.tsx)

### 1.2 Layouts

#### Source

- `index.html` funciona como landing pública.
- `integrador.html` funciona como acceso único al panel interno.
- `portal-cliente.html` funciona como portal de seguimiento del cliente.
- `panel-operativo.html` y `panel-tecnico.html` actúan como módulos de recepción y seguimiento técnico.

#### Target

- `web-public` usa layout propio con tipografía Geist + Cormorant y fondo oscuro ámbar.
- `web-admin` usa layout propio con branding de tenant y shell de administración.
- `web-clientes` usa layout propio para portal de cliente con fondo oscuro, pero no replica el contrato completo del prototipo fuente.

### 1.3 Navegación

#### Source

- Navegación pública corta: `Inicio`, `Cotizar`, `Opiniones`, `Ubicación`, `Estado`.
- Navegación interna centralizada en `integrador.html`.
- Módulos expuestos en una sola barra: `Recepción`, `Técnico`, `Solicitudes`, `Archivo`, `Clientes`, `Tareas`, `Stock`, `Proveedores`, `Compras`, `Gastos`, `Finanzas`, `Reportes`, `Sucursales`, `Seguridad`.

#### Target

- Navegación pública fragmentada por rutas públicas, tenant y portal.
- Navegación interna distribuida por `web-admin` con sidebar por grupos y header operativo.

### 1.4 Componentes UI inventariados

#### Source

- Modales:
  - confirmación de orden
  - edición de cliente
  - detalle de proveedor
  - nuevo gasto
  - nueva orden de compra
  - nuevo usuario
- Drawers / paneles laterales:
  - detalle de orden
  - detalle de archivo
  - detalle de proveedor
  - detalle de cliente
- Tablas:
  - clientes
  - stock
  - solicitudes
  - archivo
  - proveedores
  - compras
  - gastos
  - reportes
  - sucursales
  - tareas
- Cards:
  - métricas de estado
  - resumen financiero
  - KPI de reportes
  - estado del equipo
  - servicio/landing
- Botones:
  - `Actualizar`
  - `Nuevo cliente`
  - `Nueva orden`
  - `Nuevo gasto`
  - `Nueva sucursal`
  - `Guardar`
  - `Cargar más`
  - `Archivar`
  - `Entregar`
  - `Guardar usuario`
- Badges / chips:
  - estado de orden
  - severidad de stock
  - prioridad de tarea
  - estado de sucursal
  - permisos / rol

#### Target

- Botones redondeados y paneles oscuros en `web-public` y `web-admin`.
- Tabla compartida en `packages/ui`.
- Shell de administración con sidebar por módulos.
- Cards de stats y tablas en `ModuleShell`.
- Portal del cliente con cards y timeline, pero menos rico que el contrato del prototipo fuente.

### 1.5 Tipografía, espaciado, iconografía

#### Source

- Tipografía visual basada en HTML/CSS del prototipo, con jerarquía fuerte en títulos y copy operativo.
- Iconografía de botones y módulos basada en el propio HTML/JS del integrador.
- Espaciado denso, con cards compactas y formularios de varias columnas.

#### Target

- `web-public`: Geist + Cormorant en [apps/web-public/src/app/layout.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/layout.tsx)
- `web-admin`: shell oscuro con layout denso en [apps/web-admin/src/components/dashboard/dashboard-shell.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/dashboard-shell.tsx)
- `web-clientes`: solo Geist, sin Cormorant en [apps/web-clientes/src/app/layout.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/layout.tsx)
- Iconografía de `web-admin` depende de `i` classes y componentes de módulo.

## 2. Inventario Funcional

### 2.1 Acciones

#### Source

- `Actualizar`
- `Entrar`
- `Nueva recepción`
- `Nueva orden`
- `Nueva tarea`
- `Nuevo proveedor`
- `Nuevo producto`
- `Nuevo gasto`
- `Nueva sucursal`
- `Nueva orden de compra`
- `Guardar`
- `Guardar cambios`
- `Guardar configuración`
- `Guardar usuario`
- `Copiar folio`
- `Enviar por WhatsApp`
- `Descargar PDF`
- `Reabrir para edición`
- `Archivar cotización`
- `Registrar transferencia`
- `Registrar recepción`
- `Entregar`

#### Target

- `web-public`
  - enviar solicitud de cotización
  - consultar tracking
  - ir al portal del cliente
  - login / onboarding / bridge auth
- `web-admin`
  - crear cliente
  - cargar órdenes
  - abrir detalle
  - abrir modal de recepción
  - guardar cambios por módulo
  - cambiar sucursal activa
- `web-clientes`
  - consultar orden por folio
  - navegar a cotizar

### 2.2 Estados

#### Source

- carga inicial
- sin sesión
- módulo activo
- folio no encontrado
- no hay registros
- filtrado activo
- alertas activas
- estado por color
- guardando
- entregado
- cancelado

#### Target

- loading / saving / error / success en formularios
- loading de tablas y detalle en módulos
- estado de rol en `web-admin`
- lookup de folio en portal/tracking
- respuesta de API real sin mocks

### 2.3 Validaciones

#### Source

- campos obligatorios en recepción, clientes, stock, compras, gastos, seguridad
- selección de estado y prioridad
- folio relacionado cuando aplica
- confirmación de contraseña/admin
- campos numéricos para costo, precio, monto, cantidad

#### Target

- validación HTML nativa en formularios públicos
- validación por formulario en módulos de admin
- validación de API real para cotización y tracking
- guardado condicionado por rol en `web-admin`

### 2.4 Loaders

#### Source

- `Cargando clientes...`
- `Cargando productos...`
- `Cargando solicitudes...`
- `Cargando gastos...`
- `Cargando órdenes...`
- `Cargando proveedores...`
- `Cargando tareas...`

#### Target

- loading states en `web-admin` para tablas y detalles
- `Enviando...` / `Consultando...` en rutas públicas
- `Guardando...` en formularios de admin

### 2.5 Errores

#### Source

- `Folio no encontrado`
- `No hay registros archivados con esos filtros`
- `No hay clientes con esos filtros`
- `No hay proveedores con esos filtros`
- `No hay órdenes con esos filtros`
- `No hay productos con esos filtros`
- `No hay tareas con esos filtros`

#### Target

- mensajes de API real en `web-public`
- errores de fetch y de rol en `web-admin`
- estados de vacío en `ModuleShell`

### 2.6 Animaciones y feedback

#### Source

- cambios de módulo dentro del integrador
- cambios de pestaña
- expansión / cierre de paneles
- apertura de modal/drawer
- feedback visual inmediato en estados críticos

#### Target

- transiciones CSS en sidebar, botones y cards
- no se observa contrato equivalente completo a la interacción del integrador fuente

### 2.7 Permisos

#### Source

- `panel-seguridad.html` define acciones críticas y usuarios internos
- acceso interno por contraseña / sesión ligera
- control por rol y sucursal en integrador

#### Target

- `RequireRole` en `web-admin`
- tenant isolation por rutas y backend real
- no existe un equivalente visual/funcional 1:1 del panel de seguridad de Sr-Fix como pantalla fuente

## 3. Mapeo SOURCE → TARGET

| SR-FIX | SDMX | Estado |
|--------|------|--------|
| `index.html` | `apps/web-public/src/app/page.tsx` | PARCIAL |
| `integrador.html` | `apps/web-admin/src/components/dashboard/dashboard-shell.tsx` + `apps/web-admin/src/app/dashboard/page.tsx` | PARCIAL |
| `portal-cliente.html` | `apps/web-clientes/src/app/t/[tenantSlug]/portal/page.tsx` | PARCIAL |
| `panel-operativo.html` | `apps/web-admin/src/app/dashboard/ordenes/page.tsx` | PARCIAL |
| `panel-tecnico.html` | `apps/web-admin/src/app/dashboard/ordenes/page.tsx` | PARCIAL |
| `panel-clientes.html` | `apps/web-admin/src/app/dashboard/clientes/page.tsx` | PARCIAL |
| `panel-solicitudes.html` | `apps/web-admin/src/app/dashboard/solicitudes/page.tsx` | PARCIAL |
| `panel-archivo.html` | `apps/web-admin/src/app/dashboard/archivo/page.tsx` | PARCIAL |
| `panel-stock.html` | `apps/web-admin/src/app/dashboard/stock/page.tsx` | PARCIAL |
| `panel-proveedores.html` | `apps/web-admin/src/app/dashboard/proveedores/page.tsx` | PARCIAL |
| `panel-compras.html` | `apps/web-admin/src/app/dashboard/compras/page.tsx` | PARCIAL |
| `panel-gastos.html` | `apps/web-admin/src/app/dashboard/gastos/page.tsx` | PARCIAL |
| `panel-finanzas.html` | `apps/web-admin/src/app/dashboard/finanzas/page.tsx` | PARCIAL |
| `panel-reportes.html` | `apps/web-admin/src/app/dashboard/reportes/page.tsx` | PARCIAL |
| `panel-sucursales.html` | `apps/web-admin/src/app/dashboard/sucursales/page.tsx` | PARCIAL |
| `panel-seguridad.html` | `apps/web-admin/src/app/dashboard/seguridad/page.tsx` | PARCIAL |
| `panel-tareas.html` | `apps/web-admin/src/app/dashboard/tareas/page.tsx` | PARCIAL |
| `integrador.html` acceso interno | `apps/web-admin/src/components/dashboard/dashboard-shell.tsx` | PARCIAL |
| `Recepción` del integrador | `apps/web-admin/src/app/dashboard/ordenes/page.tsx` | PARCIAL |
| `Técnico` del integrador | `apps/web-admin/src/app/dashboard/ordenes/page.tsx` | PARCIAL |
| `panel-seguridad.html` | `apps/web-admin/src/app/dashboard/seguridad/page.tsx` | PARCIAL |
| `panel-clientes.html` | `apps/web-admin/src/app/dashboard/clientes/page.tsx` | PARCIAL |

### Estados usados

- `IDENTICO`: no detectado en el frontend target actual
- `PARCIAL`: existe la capacidad, pero el contrato visual/funcional no replica el prototipo
- `INEXISTENTE`: no hay equivalente funcional claro en el target actual
- `REGRESIÓN`: el target existe pero rompe o reduce el contrato del source

### Observación de estado

- En esta auditoría, el target conserva la mayoría de dominios funcionales, pero ninguno quedó `IDENTICO` al prototipo fuente.
- Los mayores desvíos están en:
  - landing pública
  - portal cliente
  - integrador interno
  - panel técnico / recepción
  - panel de seguridad

## 4. Contrato Visual

### 4.1 Fuente

El contrato visual real del prototipo fuente se concentra en:

- jerarquía de títulos grandes
- cards densas
- layout oscuro
- acentos ámbar/amarillo
- paneles con bordes finos
- navegación compacta por módulo
- formularios largos y operativos
- feedback de estado visible en cada módulo

### 4.2 Target

El target ya usa una dirección visual oscura y consistente en:

- [apps/web-public/src/app/layout.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/layout.tsx)
- [apps/web-public/src/app/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/page.tsx)
- [apps/web-admin/src/components/dashboard/dashboard-shell.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/dashboard-shell.tsx)
- [apps/web-admin/src/components/dashboard/module-shell.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/module-shell.tsx)
- [packages/ui/src/components/srfix-theme.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/packages/ui/src/components/srfix-theme.tsx)

Pero el contrato sigue siendo una interpretación, no una réplica exacta del source.

## 5. Checklist Ejecutable

### 5.1 Auditoría de equivalencia visual

- [ ] Comparar landing pública source contra `apps/web-public/src/app/page.tsx`
- [ ] Comparar `index.html` source contra landing por tenant en `apps/web-public/src/app/[tenant]/page.tsx`
- [ ] Comparar `portal-cliente.html` contra `apps/web-clientes/src/app/t/[tenantSlug]/portal/page.tsx`
- [ ] Comparar `integrador.html` contra `apps/web-admin/src/components/dashboard/dashboard-shell.tsx`
- [ ] Comparar `panel-operativo.html` contra `apps/web-admin/src/app/dashboard/ordenes/page.tsx`
- [ ] Comparar `panel-tecnico.html` contra `apps/web-admin/src/app/dashboard/ordenes/page.tsx`
- [ ] Comparar `panel-clientes.html` contra `apps/web-admin/src/app/dashboard/clientes/page.tsx`
- [ ] Comparar `panel-solicitudes.html` contra `apps/web-admin/src/app/dashboard/solicitudes/page.tsx`
- [ ] Comparar `panel-archivo.html` contra `apps/web-admin/src/app/dashboard/archivo/page.tsx`
- [ ] Comparar `panel-stock.html` contra `apps/web-admin/src/app/dashboard/stock/page.tsx`
- [ ] Comparar `panel-proveedores.html` contra `apps/web-admin/src/app/dashboard/proveedores/page.tsx`
- [ ] Comparar `panel-compras.html` contra `apps/web-admin/src/app/dashboard/compras/page.tsx`
- [ ] Comparar `panel-gastos.html` contra `apps/web-admin/src/app/dashboard/gastos/page.tsx`
- [ ] Comparar `panel-finanzas.html` contra `apps/web-admin/src/app/dashboard/finanzas/page.tsx`
- [ ] Comparar `panel-reportes.html` contra `apps/web-admin/src/app/dashboard/reportes/page.tsx`
- [ ] Comparar `panel-sucursales.html` contra `apps/web-admin/src/app/dashboard/sucursales/page.tsx`
- [ ] Comparar `panel-seguridad.html` contra `apps/web-admin/src/app/dashboard/seguridad/page.tsx`
- [ ] Comparar `panel-tareas.html` contra `apps/web-admin/src/app/dashboard/tareas/page.tsx`

### 5.2 Auditoría funcional

- [ ] Validar que cada módulo target consume API real
- [ ] Validar que no existan mocks o datasets de prueba
- [ ] Validar que el tenant se respeta en cada ruta pública y privada
- [ ] Validar que los loaders y errores sean equivalentes al source
- [ ] Validar que los permisos del admin no permitan acciones fuera del rol
- [ ] Validar que el portal de cliente responda a folio real
- [ ] Validar que el tracking público responda a folio real

### 5.3 Criterio de aceptación

- [ ] La landing pública debe replicar el contrato de `index.html`
- [ ] El admin debe replicar la densidad, navegación y flujo de `integrador.html`
- [ ] El portal cliente debe replicar `portal-cliente.html`
- [ ] Cada módulo del dashboard debe respetar la estructura funcional del panel fuente correspondiente
- [ ] Cualquier diferencia visible debe estar documentada como `PARCIAL` o `REGRESIÓN`

## 6. Evidencia por archivo

### Fuente

- [index.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/index.html)
- [integrador.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/integrador.html)
- [portal-cliente.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/portal-cliente.html)
- [panel-operativo.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-operativo.html)
- [panel-tecnico.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-tecnico.html)
- [panel-clientes.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-clientes.html)
- [panel-solicitudes.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-solicitudes.html)
- [panel-archivo.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-archivo.html)
- [panel-stock.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-stock.html)
- [panel-proveedores.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-proveedores.html)
- [panel-compras.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-compras.html)
- [panel-gastos.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-gastos.html)
- [panel-finanzas.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-finanzas.html)
- [panel-reportes.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-reportes.html)
- [panel-sucursales.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-sucursales.html)
- [panel-seguridad.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-seguridad.html)
- [panel-tareas.html](https://raw.githubusercontent.com/serviciosdigitalesmx/Sr-Fix/main/panel-tareas.html)

### Target

- [apps/web-public/src/app/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/page.tsx)
- [apps/web-public/src/app/layout.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/layout.tsx)
- [apps/web-public/src/app/[tenant]/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/%5Btenant%5D/page.tsx)
- [apps/web-public/src/app/[tenant]/cotizar/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/%5Btenant%5D/cotizar/page.tsx)
- [apps/web-public/src/app/[tenant]/tracking/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/%5Btenant%5D/tracking/page.tsx)
- [apps/web-public/src/app/t/[tenantSlug]/portal/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/t/%5BtenantSlug%5D/portal/page.tsx)
- [apps/web-public/src/app/login/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/login/page.tsx)
- [apps/web-public/src/app/onboarding/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/onboarding/page.tsx)
- [apps/web-public/src/app/auth/bridge/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/auth/bridge/page.tsx)
- [apps/web-public/src/app/hub/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/hub/page.tsx)
- [apps/web-admin/src/app/layout.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/layout.tsx)
- [apps/web-admin/src/app/dashboard/layout.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/layout.tsx)
- [apps/web-admin/src/components/dashboard/dashboard-shell.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/dashboard-shell.tsx)
- [apps/web-admin/src/components/dashboard/module-shell.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/module-shell.tsx)
- [apps/web-admin/src/app/dashboard/clientes/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/clientes/page.tsx)
- [apps/web-admin/src/app/dashboard/ordenes/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/ordenes/page.tsx)
- [apps/web-admin/src/app/dashboard/stock/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/stock/page.tsx)
- [apps/web-admin/src/app/dashboard/solicitudes/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/solicitudes/page.tsx)
- [apps/web-admin/src/app/dashboard/archivo/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/archivo/page.tsx)
- [apps/web-admin/src/app/dashboard/proveedores/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/proveedores/page.tsx)
- [apps/web-admin/src/app/dashboard/compras/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/compras/page.tsx)
- [apps/web-admin/src/app/dashboard/gastos/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/gastos/page.tsx)
- [apps/web-admin/src/app/dashboard/finanzas/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/finanzas/page.tsx)
- [apps/web-admin/src/app/dashboard/reportes/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/reportes/page.tsx)
- [apps/web-admin/src/app/dashboard/sucursales/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/sucursales/page.tsx)
- [apps/web-admin/src/app/dashboard/seguridad/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/seguridad/page.tsx)
- [apps/web-admin/src/app/dashboard/tareas/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/tareas/page.tsx)
- [apps/web-clientes/src/app/layout.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/layout.tsx)
- [apps/web-clientes/src/app/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/page.tsx)
- [apps/web-clientes/src/app/t/[tenantSlug]/portal/page.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/t/%5BtenantSlug%5D/portal/page.tsx)
- [packages/ui/src/components/srfix-theme.tsx](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/packages/ui/src/components/srfix-theme.tsx)

