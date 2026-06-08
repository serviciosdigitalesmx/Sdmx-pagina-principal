# Fixi Frontend Modernization Master Plan

Fecha: 2026-06-08

Objetivo: modernizar la UI/UX de Fixi sin romper backend, contratos, auth ni multitenancy.

## Principios de ejecución

- No cambiar contratos API existentes.
- No hardcodear tenant, URLs ni llaves.
- No usar mocks ni datos falsos.
- No llamar Supabase directo si ya existe API para ese flujo.
- No romper rutas actuales.
- Mantener `process.env` como fuente de configuración.
- Cada fase debe poder ejecutarse de forma independiente.
- Cada fase debe incluir validaciones antes de pasar a la siguiente.

## Referencias externas usadas

- [computerrepairmaster](https://github.com/akashmahlaz/computerrepairmaster)
- [RepCellPOS_Web](https://github.com/NicolasSt01/RepCellPOS_Web)
- [Servis-Hub-BengkelLaptopTI](https://github.com/RFDTYAA/Servis-Hub-BengkelLaptopTI)
- [Mobile-care-Inventory](https://github.com/Piyush-s03/Mobile-care-Inventory)
- [Appwrite](https://github.com/appwrite/appwrite) para documentación, módulos y workers

## Alcance real de Fixi

Base auditada:
- [fixi-current-state-audit.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/research/fixi-current-state-audit.md)
- [external-repos-comparison.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/research/external-repos-comparison.md)

Apps involucradas:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes`

Backend que no se debe romper:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api`

## 1) Pantallas prioritarias

### 1. Dashboard

Objetivo:
- Convertir el dashboard en una capa ejecutiva clara con KPIs, actividad reciente y atajos operativos.

Archivos probables a tocar:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/dashboard-shell.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/header.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/sidebar.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/module-shell.tsx`

Validaciones:
- Renderiza con tenant real.
- No rompe rutas existentes.
- Respeta sesión y rol.
- No cambia contratos API de reportes.

### 2. Órdenes

Objetivo:
- Unificar la experiencia de lista, filtro, estado y flujo operativo.

Archivos probables a tocar:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/ordenes/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-intake-modal.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-detail-drawer.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-timeline.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/tecnico/order-modal.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/tecnico/order-card.tsx`

Validaciones:
- Crear, ver y actualizar órdenes sigue funcionando.
- No se rompen attachments, notes, checklist ni status updates.
- La navegación a detalle de orden sigue viva.

### 3. Detalle de orden

Objetivo:
- Diseñar una vista con claridad operacional para diagnóstico, evidencia, timeline y cobro.

Archivos probables a tocar:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/tecnico/order-modal.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-detail-drawer.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-timeline.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-intake-modal.tsx`

Validaciones:
- El detalle muestra datos reales de API.
- No rompe los PATCH/PUT existentes.
- No introduce campos no soportados por backend.

### 4. Clientes

Objetivo:
- Dar a clientes una tabla, historial y acceso a acciones rápidas.

Archivos probables a tocar:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/clientes/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/clientes/customer-modal.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/clientes/customer-history.tsx`

Validaciones:
- Lista de clientes desde API real.
- Creación/edición sin romper contratos.
- No usar local-only data como fuente primaria.

### 5. Inventario

Objetivo:
- Hacer más clara la lectura de stock, alertas y movimientos.

Archivos probables a tocar:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/stock/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/stock/product-modal.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/stock/movement-modal.tsx`

Validaciones:
- La lista de inventario sigue leyendo `tenant_id`.
- Las alertas no cambian contrato.
- Los movimientos siguen consultando API real.

### 6. Compras

Objetivo:
- Mejorar la relación entre órdenes de compra, recepción y stock.

Archivos probables a tocar:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/compras/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/proveedores/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/sucursales/transfer-modal.tsx`

Validaciones:
- Crear/recibir órdenes de compra sigue funcionando.
- No se rompe el listado de proveedores.
- No se duplica lógica de inventario.

### 7. Finanzas / Caja

Objetivo:
- Consolidar lectura de balance, gastos y flujo de caja.

Archivos probables a tocar:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/finanzas/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/gastos/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/ui/*`

Validaciones:
- No cambia el contrato de `finance`.
- Sigue respetando `sucursalId` y scope.
- Los importes se muestran con formato consistente.

### 8. Portal cliente

Objetivo:
- Hacer más claro el seguimiento del folio, el estado y las evidencias.

Archivos probables a tocar:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/[tenant]/tracking/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/portal/[folio]/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/t/[tenantSlug]/portal/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/t/[tenantSlug]/portal/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/[tenant]/cotizar/page.tsx`

Validaciones:
- No cambia el contrato de `GET /api/public/tenant/:tenantSlug/orders/:folio`.
- Sigue funcionando con tenant real.
- No rompe las rutas públicas existentes.

### 9. Settings

Objetivo:
- Hacer visibles y editables los ajustes críticos por tenant sin salir del modelo actual.

Archivos probables a tocar:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/landing/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/seguridad/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/usuarios/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/seguridad/user-modal.tsx`

Validaciones:
- No romper auth ni settings por tenant.
- No introducir config sin respaldo en API.
- No cambiar el modelo de multitenancy.

## 2) Componentes base

Componentes a crear o consolidar:
- `AppShell`
- `Sidebar`
- `Header`
- `DataTable`
- `StatusBadge`
- `OrderKanban`
- `MoneyCard`
- `EmptyState`
- `ConfirmDialog`
- `FormDrawer`
- `Timeline`
- `EvidenceUploader`

Ubicación sugerida:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/base/`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/components/base/` solo si se requiere compartir UI pública

Regla:
- Primero consolidar en `web-admin` si el componente solo aplica al panel.
- Solo extraer a compartido cuando exista una necesidad real en `web-public` o `web-clientes`.

## 3) Reglas de integración

- No cambiar contratos API.
- No hardcodear tenant.
- No usar mocks.
- No llamar Supabase directo si ya existe API.
- No romper rutas actuales.
- Mantener `process.env`.
- Usar `tenant_id` en toda pantalla que consuma datos multi-tenant.
- Respetar auth y roles existentes.
- Mantener `Render` como backend y `Vercel` como frontend.
- No sustituir Supabase.

## 4) Fases

### Fase 1: UI shell

Objetivo:
- Unificar estructura visual, navegación y estado vacío/base sin tocar lógica de negocio.

Archivos que tocará:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/dashboard-shell.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/sidebar.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/header.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/module-shell.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/ui/button.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/ui/input.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/ui/textarea.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/ui/dialog.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/ui/tabs.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/layout.tsx`

Validaciones:
- Dashboard y módulos abren sin romper rutas.
- Login y auth permanecen intactos.
- No se toca API.

### Fase 2: órdenes

Objetivo:
- Rehacer la experiencia de órdenes con foco en triage, detalle y seguimiento.

Archivos que tocará:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/ordenes/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-intake-modal.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-detail-drawer.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/dashboard/orders/order-timeline.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/tecnico/order-modal.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/tecnico/order-card.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/operativo/step-1.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/operativo/step-2.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/operativo/step-3.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/operativo/success.tsx`

Validaciones:
- Crear, editar y cambiar estado sigue funcionando.
- Attachments y checklist no se rompen.
- No cambia el payload de API.

### Fase 3: clientes/inventario

Objetivo:
- Elevar claridad, búsqueda, historial y control de stock.

Archivos que tocará:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/clientes/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/clientes/customer-modal.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/clientes/customer-history.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/stock/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/stock/product-modal.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/stock/movement-modal.tsx`

Validaciones:
- Clientes e inventario siguen cargando desde API real.
- No se alteran contratos ni rutas.
- No se usa Supabase directo en frontend para estos flujos.

### Fase 4: caja/finanzas

Objetivo:
- Dar consistencia visual y operativa a gastos, balance y flujo.

Archivos que tocará:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/finanzas/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/app/dashboard/gastos/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/ui/*`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/src/routes/finance.ts` solo si hace falta documentar/validar contrato, no para cambiarlo

Validaciones:
- Balance, cashflow y expenses siguen estables.
- Se respeta `sucursalId`.
- No se toca el contrato de backend.

### Fase 5: portal cliente

Objetivo:
- Consolidar landing, tracking y portal en una experiencia más clara y confiable.

Archivos que tocará:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/[tenant]/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/[tenant]/tracking/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/portal/[folio]/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/t/[tenantSlug]/portal/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/[tenantSlug]/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/app/t/[tenantSlug]/portal/page.tsx`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/app/[tenant]/cotizar/page.tsx`

Validaciones:
- El portal sigue resolviendo folio real.
- No cambia el contrato público del API.
- WhatsApp y tracking siguen operativos.

### Fase 6: limpieza y tests

Objetivo:
- Reducir duplicación, reforzar consistencia y validar flujos críticos.

Archivos que tocará:
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-admin/src/components/*`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-public/src/components/*`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/web-clientes/src/components/*`
- `/Users/jesusvilla/Desktop/Sdmx-pagina-principal/apps/api/tests/*` solo si hace falta ajustar cobertura, sin cambiar contratos

Validaciones:
- No quedan rutas rotas obvias.
- Los formularios clave conservan comportamiento.
- No se introducen dependencias nuevas innecesarias.
- Se valida el flujo end-to-end con API real.

## 5) Reglas por fase

Cada fase debe seguir este orden:
1. Identificar archivos reales a tocar.
2. Aislar cambios por pantalla o componente.
3. No romper contrato API.
4. Validar en navegador o con pruebas de integración reales.
5. No avanzar a la siguiente fase si la actual altera auth, tenant o rutas.

## 6) Criterio de éxito

El rediseño se considera correcto si:
- La navegación principal queda consistente.
- Las pantallas críticas son más legibles y más rápidas de usar.
- No se rompe ninguna ruta existente.
- Auth y multitenancy se mantienen intactas.
- El frontend sigue consumiendo el backend real y Supabase según el contrato actual.

## 7) Riesgos a vigilar

- Duplicación entre `web-public` y `web-clientes`.
- Puentes de sesión por URL.
- Cualquier intento de saltarse `apps/api`.
- Confusión entre módulos de stock, compras y caja.
- Cambios visuales que oculten errores de scope o tenant.

## 8) Próximo paso recomendado

Implementar primero la Fase 1 en `web-admin`, sin tocar todavía órdenes ni portal cliente.
