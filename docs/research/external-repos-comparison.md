# Comparative audit of external references for Fixi

Fecha: 2026-06-08

Objetivo: comparar referencias externas para detectar ideas reutilizables en Fixi sin copiar código, datos mock, `.env`, ni reemplazar Supabase.

Fuentes revisadas:
- [Appwrite](https://github.com/appwrite/appwrite)
- [Computer Repair Master](https://github.com/akashmahlaz/computerrepairmaster)
- [Servis Hub Bengkel Laptop TI](https://github.com/RFDTYAA/Servis-Hub-BengkelLaptopTI)
- [Mobile Care Inventory](https://github.com/Piyush-s03/Mobile-care-Inventory)
- [RepCellPOS Web](https://github.com/NicolasSt01/RepCellPOS_Web)

Disponibilidad local verificada:
- `RepCellPOS_Web-main.zip`: no encontrado
- `Plataforma-SaaS-main.zip`: no encontrado
- `carbafiv-os-main.zip`: no encontrado

## Fixi baseline contra la cual se compara

Partes reales de Fixi ya verificadas en el repo local:
- `apps/web-admin` como panel operativo Next.js
- `apps/web-public` como landing, onboarding, billing y puente de sesión
- `apps/web-clientes` como portal/landing del cliente
- `apps/api` como backend Express para Render
- Supabase como base de datos y auth en backend/frontend

Auditoría base disponible en:
- [fixi-current-state-audit.md](/Users/jesusvilla/Desktop/Sdmx-pagina-principal/docs/research/fixi-current-state-audit.md)

## 1) Appwrite

Repositorio:
- [appwrite/appwrite](https://github.com/appwrite/appwrite)

Resumen real:
- Plataforma backend completa tipo BaaS.
- Incluye auth, databases, storage, functions, messaging, realtime y hosting.
- Usa arquitectura de microservicios y background workers.

Clasificación por categoría:
- Arquitectura: usar parcial
- UI: descartar
- Órdenes: descartar
- POS / Caja: descartar
- Inventario: usar parcial
- Kardex: descartar
- Portal cliente: descartar
- Tracking: descartar
- Auth: usar parcial
- Multitenancy: usar parcial
- Workers / eventos: usar parcial
- Documentación: usar

Qué sí aporta a Fixi:
- Modelo mental de plataforma modular con auth, storage, realtime y functions.
- Patrones de eventos y workers para procesos asíncronos.
- Orden de documentación y separación de productos/capacidades.

Qué no debe copiarse:
- La plataforma completa no reemplaza Supabase en Fixi.
- No hay razón para introducir MongoDB o una capa BaaS propia ahora.

Mapeo a Fixi:
- `apps/api` para jobs/eventos asíncronos si hacen falta.
- `apps/web-admin/src/lib/pwa/*` y `apps/api/src/routes/pwa.ts` para capacidades de mensajería/eventos.
- `apps/api/src/routes/billing.ts` para flujos tipo plataforma.

Gap en Fixi:
- No existe una capa propia de functions/realtime equivalente a Appwrite.
- No existe hosting integrado; Fixi depende de Vercel/Render/Supabase.

Veredicto:
- usar parcial

## 2) Computer Repair Master

Repositorio:
- [akashmahlaz/computerrepairmaster](https://github.com/akashmahlaz/computerrepairmaster)

Resumen real:
- Proyecto Next.js sincronizado con v0/Vercel.
- El README solo confirma que es un sistema de repair management con customer portal y admin dashboard.
- En GitHub se ve una estructura de frontend: `app`, `components`, `lib`, `public`, `scripts`, `store`, `styles`.
- Los topics del repo incluyen `mongodb`, `zustand`, `nextjs`, `repair-shop-management`.

Clasificación por categoría:
- Arquitectura: usar parcial
- UI: usar parcial
- Órdenes: usar parcial
- POS / Caja: descartar
- Inventario: usar parcial
- Kardex: descartar
- Portal cliente: usar parcial
- Tracking: usar parcial
- Auth: usar parcial
- Multitenancy: descartar
- Workers / eventos: descartar
- Documentación: usar

Qué sí aporta a Fixi:
- Idea de estructura Next.js para dashboard + portal cliente.
- Referencia de navegación y módulos para taller.

Qué no debe copiarse:
- El repo está planteado como proyecto v0 sincronizado; no es una base SaaS multi-tenant lista.
- Menciona MongoDB en tópicos; Fixi no debe introducir MongoDB sin justificación.
- No hay evidencia de aislamiento tenant real en lo revisado.

Mapeo a Fixi:
- `apps/web-admin/src/app/dashboard/*`
- `apps/web-public/src/app/[tenant]/*`
- `apps/web-clientes/src/app/t/[tenantSlug]/portal/page.tsx`

Gap en Fixi:
- Falta una capa clara de "portal + admin" como producto unificado de catálogo UI, pero ya existe parcialmente.
- Falta ver un modelo POS/caja real útil en el material revisado.

Veredicto:
- usar parcial

## 3) Servis Hub Bengkel Laptop TI

Repositorio:
- [RFDTYAA/Servis-Hub-BengkelLaptopTI](https://github.com/RFDTYAA/Servis-Hub-BengkelLaptopTI)

Resumen real:
- React + Vite + Tailwind + Supabase.
- README confirma landing responsiva, realtime tracking, catálogo de precios, WhatsApp, dashboard admin y gestión de transacciones.
- Es el más cercano en enfoque funcional al portal de taller con tracking.

Clasificación por categoría:
- Arquitectura: usar parcial
- UI: usar
- Órdenes: usar
- POS / Caja: descartar
- Inventario: usar parcial
- Kardex: descartar
- Portal cliente: usar
- Tracking: usar
- Auth: usar parcial
- Multitenancy: descartar
- Workers / eventos: descartar
- Documentación: usar

Qué sí aporta a Fixi:
- Confirmación de una experiencia simple de portal cliente + tracking + dashboard.
- Lenguaje de marketing/UX para transparencia del proceso.
- Uso de Supabase como backend de auth/datos.

Qué no debe copiarse:
- No hay evidencia de multi-tenant.
- No hay evidencia de POS/caja ni de kardex.
- No se debe copiar la estructura Vite si Fixi ya está estandarizado en Next.js.

Mapeo a Fixi:
- `apps/web-public/src/app/[tenant]/tracking/page.tsx`
- `apps/web-clientes/src/app/t/[tenantSlug]/portal/page.tsx`
- `apps/web-admin/src/components/dashboard/orders/*`

Gap en Fixi:
- La transparencia de tracking ya existe, pero puede estar fragmentada entre `web-public` y `web-clientes`.
- Falta una narrativa/UI más simple para el cliente final.

Veredicto:
- usar

## 4) Mobile Care Inventory

Repositorio:
- [Piyush-s03/Mobile-care-Inventory](https://github.com/Piyush-s03/Mobile-care-Inventory)

Resumen real:
- Portal web de inventario para talleres de móvil.
- README confirma gestión de productos, stock, reparaciones, clientes y ventas.
- Tecnología declarada: React, HTML, CSS, JavaScript.
- Por lo visto en GitHub, es un proyecto de inventario con dashboard simple.

Clasificación por categoría:
- Arquitectura: descartar
- UI: usar parcial
- Órdenes: usar parcial
- POS / Caja: usar parcial
- Inventario: usar
- Kardex: descartar
- Portal cliente: descartar
- Tracking: usar parcial
- Auth: descartar
- Multitenancy: descartar
- Workers / eventos: descartar
- Documentación: usar

Qué sí aporta a Fixi:
- Ideas de UI para inventario y ventas en un contexto de repair shop.
- Puede servir como referencia de dashboards sencillos de stock.

Qué no debe copiarse:
- No hay señal de auth robusta ni multi-tenant.
- No hay arquitectura adecuada para Fixi SaaS.

Mapeo a Fixi:
- `apps/web-admin/src/app/dashboard/stock/page.tsx`
- `apps/web-admin/src/app/dashboard/compras/page.tsx`
- `apps/web-admin/src/app/dashboard/gastos/page.tsx`

Gap en Fixi:
- Falta un inventario más claro para venta/cobro si se quiere una experiencia tipo POS ligera.
- Kardex no apareció como módulo explícito en el repositorio revisado.

Veredicto:
- usar parcial

## 5) RepCellPOS Web

Repositorio:
- [NicolasSt01/RepCellPOS_Web](https://github.com/NicolasSt01/RepCellPOS_Web)

Resumen real:
- El README y metadatos visibles lo describen como un SaaS enfocado en gestión de talleres de reparación de celulares.
- La estructura en GitHub sugiere un stack Laravel/PHP con carpetas `app`, `routes`, `database`, `storage`, `tests`, `resources`, `public`.
- El README visible no aportó suficientes detalles funcionales, pero sí indica orientación SaaS y presencia de piezas backend clásicas.

Clasificación por categoría:
- Arquitectura: usar parcial
- UI: usar parcial
- Órdenes: usar parcial
- POS / Caja: usar parcial
- Inventario: usar parcial
- Kardex: usar parcial
- Portal cliente: usar parcial
- Tracking: usar parcial
- Auth: usar parcial
- Multitenancy: usar parcial
- Workers / eventos: usar parcial
- Documentación: usar

Qué sí aporta a Fixi:
- Señal de que el problema de negocio objetivo es el mismo.
- Potencial referencia conceptual para módulos de taller, POS e inventario.

Qué no debe copiarse:
- No hay evidencia suficiente de que su arquitectura sea compatible con la base actual de Fixi.
- El stack visible apunta a Laravel; Fixi no debe introducirlo sin justificación.

Mapeo a Fixi:
- `apps/api/src/routes/orders.ts`
- `apps/api/src/routes/inventory.ts`
- `apps/api/src/routes/purchase-orders.ts`
- `apps/api/src/routes/finance.ts`
- `apps/web-admin/src/app/dashboard/finanzas/page.tsx`

Gap en Fixi:
- POS/caja no aparece como experiencia principal bien resuelta.
- Kardex no está confirmado como módulo explícito en Fixi.
- La comparativa sugiere que Fixi puede necesitar una historia más clara alrededor de ventas/caja si ese es el producto objetivo.

Veredicto:
- usar parcial

## Comparativa resumida

### Arquitectura
- Appwrite: plataforma infra/BaaS
- Computer Repair Master: frontend Next.js sin evidencia de multi-tenant fuerte
- Servis Hub Bengkel Laptop TI: app simple con React/Vite/Supabase
- Mobile Care Inventory: app de inventario simple
- RepCellPOS Web: SaaS taller con stack Laravel/PHP visible

### UI
- Mejor señal para Fixi: Servis Hub y Computer Repair Master
- Mejor señal de inventario simple: Mobile Care Inventory

### Órdenes
- Todos los repos de taller aportan al menos una idea parcial de workflow de órdenes
- Fixi ya tiene el módulo más desarrollado en `apps/api/src/routes/orders.ts` y `apps/web-admin/src/app/dashboard/ordenes/page.tsx`

### POS / Caja
- Solo RepCellPOS y Mobile Care Inventory sugieren algo cercano, pero sin evidencia suficiente de una caja robusta
- Fixi no tiene una caja/POS explícita consolidada; eso debe tratarse como gap, no como supuesto

### Inventario
- Appwrite aporta enfoque de plataforma
- Mobile Care Inventory aporta enfoque directo de stock
- Fixi ya tiene `stock`, `inventory`, `purchase-orders` y `gastos`

### Kardex
- No quedó confirmado como módulo fuerte en los repos revisados
- Si se quiere en Fixi, hoy es gap

### Portal cliente
- Servis Hub y Computer Repair Master son los mejores referentes funcionales
- Fixi ya tiene portal en `web-public` y `web-clientes`

### Tracking
- Servis Hub es el referente más claro
- Fixi ya tiene tracking público por tenant, pero repartido entre varias apps

### Auth
- Appwrite aporta el mejor modelo conceptual
- Servis Hub confirma Supabase como auth real
- Fixi ya usa Supabase en frontend y JWT propio en backend

### Multitenancy
- Appwrite no es referencia directa de multitenancy por tenant de negocio
- Computer Repair Master, Servis Hub y Mobile Care no mostraron multitenancy verificable
- RepCellPOS podría ser SaaS, pero sin evidencia suficiente para concluir aislamiento real
- Fixi debe mantener Supabase + tenant_id + RLS como base

### Workers / eventos
- Appwrite sí aporta la mejor señal
- Fixi ya tiene backend separado y rutas de billing/pwa/orders que pueden evolucionar hacia eventos

### Documentación
- Appwrite es el estándar más sólido en documentación
- Servis Hub y Computer Repair Master están más cerca de un README de proyecto que de una documentación operativa

## Veredicto final por repo

- Appwrite: usar parcial
- Computer Repair Master: usar parcial
- Servis Hub Bengkel Laptop TI: usar
- Mobile Care Inventory: usar parcial
- RepCellPOS Web: usar parcial

## Mapa de ideas a Fixi

- Tracking público y portal cliente: `apps/web-public/src/app/[tenant]/tracking/page.tsx`, `apps/web-clientes/src/app/t/[tenantSlug]/portal/page.tsx`
- Órdenes operativas: `apps/api/src/routes/orders.ts`, `apps/web-admin/src/app/dashboard/ordenes/page.tsx`
- Inventario y stock: `apps/api/src/routes/inventory.ts`, `apps/web-admin/src/app/dashboard/stock/page.tsx`
- Compras: `apps/api/src/routes/purchase-orders.ts`, `apps/web-admin/src/app/dashboard/compras/page.tsx`
- Finanzas/caja: `apps/api/src/routes/finance.ts`, `apps/web-admin/src/app/dashboard/finanzas/page.tsx`
- Auth y sesiones: `apps/api/src/routes/auth.ts`, `apps/web-admin/src/app/login/page.tsx`, `apps/web-public/src/app/login/page.tsx`
- Multitenancy y aislamiento: `apps/api/src/middleware/validateTenant.ts`, `apps/api/src/lib/resolve-scope.ts`

## Conclusión

Los cinco repos externos no justifican cambiar la base tecnológica de Fixi.
La señal más útil es de UI/flujo de usuario, no de arquitectura:
- tomar ideas de tracking, portal cliente, inventario y documentación
- mantener Supabase, Render y Vercel
- no introducir MongoDB, Laravel, NestJS, RabbitMQ o Redis sin una justificación funcional y verificable

Si algo no existe en Fixi, queda marcado aquí como gap y no como supuesto.
