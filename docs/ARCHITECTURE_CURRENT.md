# Current Architecture

## Conclusión

Fixi opera como SaaS horizontal multi-tenant con verticalización por configuración.

## Flujo correcto

```txt
UI
  ↓
Domain Services
  ↓
ApiGateway
  ↓
Backend API
```

## UI

La UI vive principalmente en:

- `apps/web-admin/src/app`
- `apps/web-admin/src/components`
- `apps/web-public/src/app`
- `apps/web-clientes/src/app`

La UI debe llamar servicios de dominio.

## Domain Services

Ubicación esperada:

- `apps/web-admin/src/services`

Servicios esperados:

- `ordersService`
- `inventoryService`
- `procurementService`
- `financeService`
- `securityService`
- `usersService`
- `tasksService`
- `requestsService`
- `reportsService`
- `tenantSettingsService`

## ApiGateway

El gateway HTTP centraliza llamadas hacia API.

Regla:

- UI no llama ApiGateway directamente.
- Domain Services sí pueden usar ApiGateway.

## Backend API

El backend es el contrato real. Antes de cambiar frontend, revisar endpoints existentes.

No inventar endpoints por intuición.
