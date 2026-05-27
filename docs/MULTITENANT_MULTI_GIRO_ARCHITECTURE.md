# Multitenant Multi-Giro Architecture

## Core horizontal

SDMX/Fixi operates as a horizontal SaaS core for service businesses. The core domain is:

- customer
- request / order / appointment
- asset or item being serviced
- workflow status
- evidence
- payment
- document
- follow-up / warranty / closure

The implementation stays tenant-isolated through `tenant_id` at every operational layer.

## Tenant configuration

Tenant-specific behavior lives in configuration rows and runtime settings, not in forks.

Primary configuration sources:

- `tenant_industry_profiles`
- `tenant_enabled_modules`
- `tenant_label_overrides`
- `tenant_workflow_statuses`
- `tenant_field_definitions`
- `tenant_semaphore_rules`
- `tenant_runtime_config` returned through settings/meta endpoints

## Labels

Labels are runtime-facing strings used by the UI and portal/landing copy.

Examples:

- `order`
- `request`
- `asset`
- `customer`
- `diagnosis`
- `quote`
- `warranty`

If a tenant has no custom labels, the system falls back to the legacy repair-oriented defaults.

## Enabled modules

Modules are centralized in a registry and then resolved per tenant with plan/access/industry fallback.

Examples:

- `dashboard`
- `customers`
- `requests`
- `orders`
- `appointments`
- `assets`
- `inventory`
- `expenses`
- `documents`
- `portal`
- `landing`
- `whatsapp`
- `warranty`
- `reports`

Frontend may hide modules, but backend remains the source of truth for enforcement.

## Workflows and statuses

Workflow statuses are configurable per tenant and workflow key.

If no tenant-specific workflow exists, the system falls back to the legacy repair statuses:

- `recibido`
- `diagnostico`
- `reparacion`
- `listo`
- `entregado`

## Field definitions

Dynamic field definitions are stored per tenant and entity.

Supported field types:

- `text`
- `textarea`
- `number`
- `select`
- `boolean`
- `date`
- `money`

Dynamic values are stored in `metadata` JSONB when available. Legacy fields remain intact.

## Metadata

`metadata` is used as an extension surface for industry-specific data that should not create one column per field.

Rules:

- do not store secrets
- do not rely on frontend-provided `tenant_id`
- validate server-side before persist

## Templates

Template layers are configuration-driven and can be used for:

- WhatsApp link messages
- landing copy
- portal copy
- document/PDF content

The system keeps fallback legacy rendering for tenants without templates.

## Semaphore rules

Operational risk is calculated with `tenant_semaphore_rules`.

The backend computes color/reason/action and the frontend only renders it.

## Capabilities

`resolveTenantCapabilities()` combines:

1. plan allowlist
2. tenant enabled modules
3. industry defaults
4. billing/access state
5. safe overrides for `billing_exempt` and master tenant

This prevents frontend-only authorization.

## Fallbacks

Fallbacks are required for backward compatibility:

- no `industry_profile` -> legacy repair defaults
- no `field_definitions` -> legacy forms
- no `workflow_statuses` -> legacy statuses
- no `templates` -> legacy WhatsApp/PDF/landing/portal copy
- no `enabled_modules` -> industry defaults or current safe defaults

## What must not be hardcoded

Do not hardcode:

- tenant slug
- tenant id
- URLs
- secrets
- plan rules
- industry-specific labels
- workflow status names in UI components

Any hardcoded fallback must be clearly documented as legacy compatibility, not as a new domain rule.
