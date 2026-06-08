# FIXI Enterprise Gap Analysis

## Scope
This document inventories the current Fixi codebase as it exists in this repository and maps the gap toward an Enterprise architecture built on:

- Event Log
- Workflow Engine
- Rules Engine

Non-goals:

- No rewrite
- No replacement of working modules
- No mocks or synthetic entities
- No renaming existing concepts just to make them fit a target model

The analysis is based on the current code in:

- `apps/web-admin`
- `apps/web-public`
- `apps/web-clientes`
- `apps/api`
- `supabase`

## Executive Summary

Fixi already has most of the primitives needed for an enterprise system:

- multi-tenant isolation with `tenant_id`
- explicit business entities for orders, requests, inventory, purchases, finance, tasks, users, security
- audit tables and order event tables
- tenant-scoped workflow configuration tables
- runtime module gating and billing gating
- status-driven state changes in orders and purchase orders

What is missing is not the domain model. What is missing is a unifying runtime layer:

- a canonical event log that captures every business mutation in one place
- a workflow engine that interprets transitions from configuration instead of hardcoded route logic
- a rules engine that externalizes authorization, transition constraints, scope constraints, and plan/module constraints

The good news is that the current code already emits many of the right signals. The gap is mostly structural and orchestration-related.

---

## Phase 1: Current Inventory

### 1) What already exists

#### Entities already present in code

| Area | Current entities |
|---|---|
| Tenant / org | `tenants`, `branches`, `sucursales`, `tenant_industry_profiles`, `tenant_enabled_modules`, `tenant_label_overrides`, `tenant_workflow_statuses`, `tenant_field_definitions` |
| Identity / access | `users`, `security_sessions`, `audit_logs` |
| Customers / requests / orders | `customers`, `service_requests`, `service_orders`, `service_order_checklists`, `service_order_status_history`, `service_order_documents`, `service_order_events` |
| Inventory / procurement | `products`, `inventory`, `branch_inventory`, `sucursal_inventory`, `inventory_movements`, `purchase_orders`, `purchase_order_items`, `stock_alerts`, `suppliers` |
| Finance | `finances`, `expenses`, `customer_payments` |
| Work management | `tasks`, `task_history` |
| Public / comms | `file_assets`, `notification_events`, `pwa_push_subscriptions` |

#### Business states already present

| Entity | Current states / status fields |
|---|---|
| `service_requests` | `pendiente`, plus normalized variants used in code (`convertida`, `en_revision`, `rechazada`) |
| `service_orders` | `recibido`, `diagnostico`, `en_reparacion`, `listo`, `entregado`, plus tenant-configurable status labels / options |
| `purchase_orders` | `borrador`, `enviada`, `parcial`, `recibida`, `cancelada` |
| `tasks` | `pendiente`, `en_proceso`, `bloqueada`, `hecha` |
| `stock_alerts` | `severity` values are domain-driven rather than lifecycle states |
| `security_sessions` | active vs revoked via `revoked_at` |
| `audit_logs` | event-like but not lifecycle states |

#### Events already present even if not called `event_log`

| Table / source | Role |
|---|---|
| `service_order_events` | Canonical-ish order event stream for documents, notes, and status changes |
| `service_order_status_history` | Older/parallel order status history |
| `audit_logs` | Security/admin audit log |
| `task_history` | Task lifecycle history |
| `notification_events` | Notification delivery log |
| `service_order_documents` | Document attachment ledger, not an event log but part of order history |
| `evidence_metadata` in `service_orders` | Legacy embedded event/document ledger still used as fallback |

#### Validations already present even if not called `rules`

| Layer | Existing rule behavior |
|---|---|
| `requireRole` | Role-based authorization with rank ordering |
| `validateTenant` | Route tenant slug must match token tenant slug |
| `attachScope` / `resolveScope` | Sucursal / branch scope is derived from token + route |
| `requireTenantBillingActive` | Billing-block gate with master tenant bypass |
| `requireTenantModule` | Module access gate based on plan / enabled modules / billing state |
| Zod schemas in controllers | Request-level validation for create/update actions |
| Status allowlists | `service_orders` status keys are validated against tenant runtime config |
| Sucursal ownership checks | Many routes validate `sucursales` ownership before writes |
| Product/supplier ownership checks | Inventory and purchase flows validate tenant ownership |

#### Audit already present

| Audit source | Scope |
|---|---|
| `audit_logs` | Tenant security / admin / billing-ish audit |
| `service_order_events` | Operational order event stream |
| `service_order_status_history` | Order status history |
| `task_history` | Task changes |
| `notification_events` | Notification delivery history |

#### Modules already dependent on implicit workflow

| Module | Implicit workflow dependency |
|---|---|
| Recepción (`apps/web-admin/src/app/dashboard/operativo`) | Step-driven intake, photo upload, receipt PDF, order creation |
| Técnico (`apps/web-admin/src/app/dashboard/tecnico`) | Order status progression and technician assignment |
| Solicitudes (`apps/web-admin/src/app/dashboard/solicitudes`) | Request -> order conversion |
| Compras (`apps/web-admin/src/app/dashboard/compras`) | PO status progression and inventory receipt |
| Finanzas (`apps/web-admin/src/app/dashboard/finanzas`) | Balance / cashflow / expense gating by sucursal |
| Portal cliente (`apps/web-public/src/app/t/[tenantSlug]/portal`) | Public order tracking and timeline rendering |
| Reportes (`apps/api/src/controllers/reports.ts`) | Status-derived metrics and overdue logic |
| Seguridad (`apps/web-admin/src/app/dashboard/seguridad`) | Security config, sessions, MFA, audit logs |

---

### 2) Table ACTUAL vs DESEADA vs GAP

#### A. Current data model

| Domain | ACTUAL | DESEADA (Enterprise target) | GAP |
|---|---|---|---|
| Business events | `service_order_events`, `audit_logs`, `task_history`, `notification_events` | One canonical append-only event log with typed domain events | Events are fragmented and partially duplicated |
| Order workflow | `service_orders.status` plus `service_order_status_history` | Workflow definitions + transition registry + transition audit | State machine logic lives in controllers and tenant config |
| Public order evidence | `service_order_documents`, `evidence_metadata` | Single document/event projection with consistent read model | Dual-write / legacy fallback pattern |
| Security audit | `audit_logs`, `security_sessions` | Unified security audit stream with actor/context metadata | Security audit is separate from business event stream |
| Workflow config | `tenant_workflow_statuses`, `tenant_industry_profiles`, `tenant_enabled_modules`, `tenant_label_overrides` | Workflow engine config store | Config exists, but runtime engine is not centralized |
| Rules | `requireRole`, `requireTenantModule`, `validateTenant`, `requireTenantBillingActive`, Zod schemas | Rules engine with reusable policies | Rules are hardcoded across middleware/controllers |
| Sucursal scoping | `scope`, `sucursal_id`, `branch_id`, `tenant_id` | Consistent policy evaluation layer | Scope resolution is duplicated in route-level logic |
| Inventory movement | `inventory_movements` | Event-sourced inventory ledger with projections | Ledger exists, projection is not unified |
| Purchase order lifecycle | `purchase_orders.status` | Workflow engine + transition graph | Status is hardcoded and route-driven |
| Task lifecycle | `tasks.status`, `task_history` | Workflow engine for internal work items | Works, but remains isolated |

---

## Phase 2: Event Log

### What already exists

Fixi already persists business mutations in multiple places:

- `service_order_events`
- `service_order_status_history`
- `task_history`
- `audit_logs`
- `notification_events`
- `inventory_movements`
- `service_order_documents`
- `security_sessions`

The strongest candidate for a canonical enterprise event log is `service_order_events`, because it already stores:

- `event_type`
- `previous_status`
- `new_status`
- `note`
- `actor_name`
- `tenant_id`
- `service_order_id`
- `created_at`

### Where events are created today

| Action | Current write path |
|---|---|
| Create order | `apps/api/src/controllers/orders.ts` -> inserts `service_orders`, `service_order_checklists`, then `service_order_events` |
| Update order status | `apps/api/src/controllers/orders.ts` -> updates `service_orders`, appends to `evidence_metadata`, inserts `service_order_events` |
| Add order note/message | `apps/api/src/controllers/orders.ts` -> appends to `evidence_metadata`, inserts `service_order_events` |
| Upload order evidence / receipt | `apps/api/src/controllers/orders.ts` -> inserts `service_order_documents`, appends to `evidence_metadata`, may generate receipt PDF |
| Convert request to order | `apps/api/src/controllers/requests.ts` -> creates `service_orders`, updates `service_requests.status` |
| Create purchase order | `apps/api/src/controllers/purchase-orders.ts` -> inserts `purchase_orders` and `purchase_order_items` |
| Receive purchase order | `apps/api/src/controllers/purchase-orders.ts` -> calls RPC `receive_purchase_inventory` and refreshes stock alerts |
| Create/update expense | `apps/api/src/controllers/finance.ts` -> inserts `finances` |
| Security actions | `apps/api/src/controllers/security.ts` -> `audit_logs`, `security_sessions`, MFA and key rotation |
| Public quote / public portal lookups | `apps/api/src/controllers/public.ts` -> `service_requests`, `service_orders`, `service_order_documents`, `service_order_events` |

### Event schema strategy

Do not replace current tables. Add a canonical event projection on top of what exists.

#### Proposed canonical event envelope

| Field | Purpose |
|---|---|
| `event_id` | Stable id for deduplication |
| `tenant_id` | Mandatory tenant boundary |
| `aggregate_type` | `service_order`, `service_request`, `purchase_order`, `inventory_movement`, `task`, `security_session`, `tenant` |
| `aggregate_id` | Target row id |
| `event_type` | Domain event name |
| `event_version` | Schema version |
| `actor_user_id` | Who caused it |
| `actor_role` | Role at time of event |
| `actor_name` | Human-readable actor |
| `sucursal_id` | Operational scope when applicable |
| `previous_state` | Previous workflow state |
| `next_state` | Next workflow state |
| `payload` | Business-specific details |
| `source` | API route / subsystem |
| `correlation_id` | Flow correlation across events |
| `created_at` | Event time |

### Producers

| Producer | What it should emit |
|---|---|
| Order create | `order.created` |
| Order status change | `order.status_changed` |
| Order note | `order.note_added` |
| Order evidence upload | `order.document_uploaded` |
| Request create | `request.created` |
| Request convert | `request.converted_to_order` |
| Purchase order create | `purchase_order.created` |
| Purchase order receive | `purchase_order.received` / `inventory.received` |
| Expense create | `finance.expense_created` |
| Security session revoke | `security.session.revoked` |
| MFA enable / key rotate | `security.mfa.enabled`, `security.keys.rotated` |

### Consumers

| Consumer | Use |
|---|---|
| Portal cliente | timeline, docs, PDF, status labels |
| Dashboard técnico | order cards, transitions, aging, overdue |
| Reportes | KPIs, counts, overdue, productivity |
| Auditoría / seguridad | access logs, admin history |
| Inventory projections | movement summaries, stock alerts |
| Notifications | push / WhatsApp / email notifications |

### Impact

- Low-risk if implemented as a read/write append layer, not as a replacement
- Existing tables remain the source of truth during migration
- Legacy `evidence_metadata` can be treated as a compatibility projection until fully retired

---

## Phase 3: Workflow Engine

### Current workflows

#### 1. Solicitudes

Current states:

- `pendiente`
- `en_revision`
- `convertida`
- `rechazada`

Current transitions:

- public quote creation -> `pendiente`
- admin conversion -> `convertida`

Current validation:

- tenant ownership
- request id existence
- payload validation
- optional customer creation

Current implementation:

- `apps/api/src/controllers/public.ts`
- `apps/api/src/controllers/requests.ts`
- `apps/web-admin/src/app/dashboard/solicitudes/page.tsx`

#### 2. Recepción

Current states:

- implicit step state in UI
- resulting order status `recibido`

Current transitions:

- step 1 intake
- step 2 validation
- step 3 confirmation
- create order

Current validation:

- form-level checks
- promised date present
- required fields present
- request-to-order conversion and direct order creation

Current implementation:

- `apps/web-admin/src/app/dashboard/operativo/page.tsx`
- `apps/web-admin/src/components/operativo/step-1.tsx`
- `apps/web-admin/src/components/operativo/step-2.tsx`
- `apps/web-admin/src/components/operativo/step-3.tsx`
- `apps/api/src/controllers/orders.ts`

#### 3. Órdenes

Current states:

- `recibido`
- `diagnostico`
- `en_reparacion`
- `listo`
- `entregado`

Current transitions:

- status change via technician modal or API
- completion timestamps set on `listo` / `entregado`

Current validation:

- tenant ownership
- scope ownership
- allowed statuses pulled from tenant runtime config
- role-based access

Current implementation:

- `apps/api/src/controllers/orders.ts`
- `apps/web-admin/src/app/dashboard/tecnico/page.tsx`
- `apps/web-admin/src/components/tecnico/order-modal.tsx`
- `apps/web-public/src/app/t/[tenantSlug]/portal/page.tsx`

#### 4. Portal cliente

Current workflow:

- lookup by folio or token
- load tenant-specific runtime config
- load timeline, documents, events, PDF attachment
- render public timeline and actions

Current validation:

- tenant slug resolution
- folio / token lookup
- optional email cross-check

Current implementation:

- `apps/api/src/controllers/public.ts`
- `apps/web-public/src/app/t/[tenantSlug]/portal/page.tsx`
- `apps/web-clientes/src/app/t/[tenantSlug]/portal/page.tsx`

#### 5. Inventario

Current states:

- `purchase_orders.status`
- `inventory_movements.movement_type`
- `stock_alerts.severity`

Current transitions:

- purchase order create -> receive -> inventory movement generation
- low stock alerts updated after receipt

Current validation:

- tenant ownership
- sucursal ownership
- product ownership
- module access

Current implementation:

- `apps/api/src/controllers/purchase-orders.ts`
- `apps/api/src/controllers/finance.ts`
- `apps/api/src/services/stock-alerts.ts`
- `apps/web-admin/src/app/dashboard/compras/page.tsx`
- `apps/web-admin/src/app/dashboard/stock/page.tsx`

### Workflow migration strategy

Do not replace current status columns.

Instead:

1. Keep current status columns as the operational projection.
2. Add a canonical workflow definition keyed by `workflow_key` and `status_key`.
3. Centralize transition validation in one workflow service.
4. Keep existing controllers writing the same tables, but route state changes through the workflow service.
5. Treat `service_order_events` as the event emission source for the workflow engine.

### Practical enterprise target

| Layer | Role |
|---|---|
| Workflow definition | `tenant_workflow_statuses` + future transition table |
| Workflow executor | service in API that validates transition and writes projection |
| Projection | `service_orders.status`, `purchase_orders.status`, `tasks.status`, etc. |
| History | `service_order_events`, `task_history`, `audit_logs` |

---

## Phase 4: Rules Engine

### Hardcoded rules already present

#### Authorization / role rules

| Rule | Location |
|---|---|
| Owner/manager/technician access checks | `apps/api/src/middleware/requireRole.ts` |
| Tenant must exist in token | `apps/api/src/middleware/validateTenant.ts` |
| Billing-block bypass for master tenants | `apps/api/src/middleware/tenantBilling.ts` |
| Module activation gating | `apps/api/src/middleware/tenantCapabilities.ts` |
| Sucursal scope validation | `apps/api/src/middleware/scope.ts` and route handlers |

#### Transition rules

| Rule | Location |
|---|---|
| Allowed order statuses must match tenant config | `apps/api/src/controllers/orders.ts` (`getAllowedOrderStatusKeys`) |
| Purchase order status enum is fixed | `apps/api/src/controllers/purchase-orders.ts` |
| Request conversion always creates order in `recibido` | `apps/api/src/controllers/requests.ts` |
| Order completion timestamps are tied to specific statuses | `apps/api/src/controllers/orders.ts` |
| Finance scope is tied to sucursal | `apps/api/src/controllers/finance.ts` |

#### Data integrity rules

| Rule | Location |
|---|---|
| Sucursal ownership must match tenant | `apps/api/src/controllers/sucursales.ts`, `purchase-orders.ts`, `finance.ts`, `orders.ts` |
| Supplier / product ownership must match tenant | `purchase-orders.ts` |
| Token tenant slug must match route tenant slug | `validateTenant.ts` |
| Business payload validation | Zod schemas inside controllers |

### Rules engine gap

There is no reusable rules engine abstraction yet.

Today rules are:

- embedded in middleware
- embedded in route handlers
- embedded in Zod schemas
- embedded in string comparisons inside controllers

### Enterprise rules target

| Rule category | Desired source of truth |
|---|---|
| Authorization | role policy registry |
| Tenant isolation | tenant context policy |
| Billing / plan limits | billing rules registry |
| Module access | module capability registry |
| Workflow transitions | workflow rule registry |
| Sucursal scope | scope policy registry |
| State-specific validation | transition validators |

### Externalization strategy

Minimal change path:

1. Keep current middleware.
2. Extract repeated policy checks into rule services.
3. Back them with a registry keyed by:
   - tenant plan
   - module key
   - workflow key
   - status key
   - role
   - sucursal scope
4. Make controllers call the rule service before writing.

This preserves current behavior while making future transition rules configurable.

---

## File-Level Observations

### `apps/api`

Strong existing foundations:

- order lifecycle controller
- request conversion controller
- purchase order lifecycle controller
- security controller
- public controller with portal APIs
- tenant billing / capabilities / scope / auth middlewares
- runtime config loader for tenant workflows

### `apps/web-admin`

Already wired to:

- dashboard summary
- technical order board
- request conversion
- recepcion workflow
- security administration
- purchasing and finance
- stock and branch management

This UI is already a thin orchestration layer on top of the backend. That is favorable for an enterprise evolution because the UI is not the right place to solve workflow complexity.

### `apps/web-public`

Already provides:

- public landing pages
- public quote intake
- public tracking portal
- public portal by tenant slug and folio

It already depends on backend projections for:

- tenant config
- timeline
- documents
- status labels

### `apps/web-clientes`

This package has a richer public portal/tracking implementation and normalized response adapters. It appears to be a parallel client-facing app or an earlier generation of the portal experience. It is useful as reference material, but the current production public path is `apps/web-public`.

### `supabase`

The schema already includes the critical building blocks:

- tenant isolation
- order/request tables
- history/event tables
- workflow config tables
- RLS policies
- ownership indices

This is a solid base for enterprise evolution without schema replacement.

---

## Concrete Enterprise Gap

### What is still missing

1. One canonical event log for all aggregates.
2. One workflow engine that validates transitions from configuration.
3. One rules engine that centralizes authorization and business constraints.
4. One consistent read-model strategy that does not depend on embedded JSON history for correctness.
5. One migration path that turns the current tables into projections, not ad hoc state stores.

### What should not be changed

1. Current tenant isolation model.
2. Current order, purchase, finance, and security tables.
3. Existing public portal routes.
4. Existing admin modules.
5. Existing RLS strategy.

---

## Recommended Evolution Path

### Step 1: Normalize event capture

- Keep current tables.
- Make every business mutation emit a canonical event object.
- Write that event into an append-only event store or into a dedicated projection table that acts as the canonical log.

### Step 2: Introduce workflow service

- Use `tenant_workflow_statuses` as the starting config source.
- Add transition validation and event emission in one API service.
- Preserve current status columns as projections.

### Step 3: Introduce rules registry

- Extract existing authorization and scope checks into reusable policy services.
- Keep middlewares as entry points, but delegate decisions to the registry.

### Step 4: Unify read models

- Portal cliente should read from the same event-projected order view used by admin/reporting.
- Reports should consume the same projection instead of inferring business logic independently.

### Step 5: Retire legacy duplication gradually

- Keep `evidence_metadata` until the new event/log projection is stable.
- Keep `service_order_status_history` until the new event stream fully covers all needed history.

---

## Final Assessment

Fixi does **not** need a rewrite to become enterprise-grade.

It already has:

- tenant-aware persistence
- RLS
- order/request/purchase/finance/task/security tables
- event/history tables
- workflow config tables
- module / billing / scope rules

The enterprise gap is primarily in orchestration:

- unify events
- centralize workflow rules
- externalize policy decisions
- keep current modules as projections and clients of those services

That is the lowest-risk path from the current repository state to an enterprise architecture.
