# Migration Audit

## Scope

| Item | Status | Notes |
|---|---:|---|
| Local migrations reviewed | Yes | Reviewed from `supabase/migrations` |
| Remote Supabase schema | Not touched | No destructive remote action taken |
| Canonical order confirmed remotely | No | Requires external validation before pruning |

## Migration Families

| Family | Files | Assessment |
|---|---|---|
| Baseline / snapshot | `20260424_baseline_schema.sql`, `20260514133525_remote_schema.sql` | Historical bootstrap / snapshot material |
| RLS hardening | `20260514120000_enable_rls_and_policies.sql`, `20260527083000_harden_tenant_isolation_rls.sql`, `20260528000600_harden_live_inventory_rls.sql`, `20260530193000_audit_hardening_multitenant.sql` | Active security surface |
| Tenant rollout | `20260527030000_tenant_industry_config_phase1.sql`, `20260527050000_tenant_field_definitions_phase2.sql`, `20260527070000_tenant_semaphore_rules.sql` | Active tenant feature rollout |
| Branches -> sucursales cutover | `20260527091000_cutover_branches_to_sucursales.sql`, `20260528001442_cutover_branches_to_sucursales.sql`, `20260527093000_migrate_branch_fks_to_sucursales.sql`, `20260528001652_migrate_branch_fks_to_sucursales.sql`, `20260527095000_drop_branch_compat_after_cutover.sql`, `20260528001842_drop_branch_compat_after_cutover.sql` | High duplication / cutover overlap |
| Security/backoffice | `20260530132000_security_backoffice_tables.sql`, `20260531110000_fix_security_backoffice_schema.sql` | Duplicate intent / schema overlap |
| User compatibility | `20260530120000_expand_users_admin_module.sql`, `20260531063159_add_users_activo_compatibility.sql`, `20260531063240_add_users_mfa_enabled_compatibility.sql` | Multiple compatibility passes on same model |
| Inventory RLS hardening | `20260527084500_harden_live_inventory_rls.sql`, `20260528000600_harden_live_inventory_rls.sql` | Duplicate hardening path |
| Product features | `20260530121000_add_assigned_user_to_service_orders.sql`, `20260530143000_add_public_token_to_service_orders.sql`, `20260530150000_add_pwa_push_subscriptions.sql`, `20260530180000_add_customer_sucursal_id.sql` | Active feature additions |

## Detailed Table

| File | What it does | Vigente | Legacy/Basura | Risk | Recommendation |
|---|---|---|---|---|---|
| `20260424_baseline_schema.sql` | Bootstraps core schema, tables, indexes, policies | Partly | Historical bootstrap | Medium | Keep as baseline reference only |
| `20260514120000_enable_rls_and_policies.sql` | Enables baseline RLS/policies | Yes | No | Low | Keep |
| `20260514133525_remote_schema.sql` | Snapshot-style schema dump with many drops/recreates | No as live source | Historical snapshot | Medium | Keep as provenance only |
| `20260514150000_add_tenant_onboarding.sql` | Adds onboarding support columns/tables | Yes | No | Low | Keep |
| `20260515110000_restore_users_compat.sql` | Restores users compatibility path | Maybe | Compatibility legacy | Medium | Review for consolidation |
| `20260523121919_align_orders_suppliers_reports_schema.sql` | Aligns operational schema surfaces | Yes | No | Low | Keep |
| `20260523170000_enable_service_requests_rls.sql` | Enables RLS for requests | Yes | No | Low | Keep |
| `20260523190000_order_documents_events.sql` | Adds order docs/events schema | Yes | No | Low | Keep |
| `20260523193000_tenant_landing_content.sql` | Adds tenant landing content | Yes | No | Low | Keep |
| `20260523204000_restore_branches_table.sql` | Restores branches compatibility | No as end-state | Legacy compatibility | High | Mark as transitional/historical |
| `20260525012000_restore_inventory_purchase_products.sql` | Restores legacy inventory/purchase product shape | Maybe | Legacy compatibility | Medium | Review before consolidation |
| `20260525021500_relax_service_order_status_constraint.sql` | Relaxes status constraint | Yes | No | Low | Keep |
| `20260527010000_align_service_requests_tenant_fk.sql` | Aligns request tenant FK | Yes | No | Low | Keep |
| `20260527030000_tenant_industry_config_phase1.sql` | Tenant config phase 1 | Yes | No | Low | Keep |
| `20260527050000_tenant_field_definitions_phase2.sql` | Tenant config phase 2 | Yes | No | Low | Keep |
| `20260527070000_tenant_semaphore_rules.sql` | Tenant semaphore rules | Yes | No | Low | Keep |
| `20260527083000_harden_tenant_isolation_rls.sql` | Tenant isolation hardening | Yes | No | Low | Keep |
| `20260527084500_harden_live_inventory_rls.sql` | Inventory RLS hardening | Maybe | Duplicate with later pass | Medium | Consolidate with 20260528000600 |
| `20260527091000_cutover_branches_to_sucursales.sql` | Introduces sucursales and copies branch data | Maybe | Transitional cutover | High | Consolidate with later cutover |
| `20260527093000_migrate_branch_fks_to_sucursales.sql` | Migrates FKs from branch to sucursal | Maybe | Transitional cutover | High | Consolidate with later FK migration |
| `20260527095000_drop_branch_compat_after_cutover.sql` | Drops branch compatibility after cutover | Maybe | Transitional cutover | High | Consolidate with later drop |
| `20260527100000_migrate_users_branch_to_sucursal.sql` | Migrates users branch to sucursal | Maybe | Transitional cutover | High | Review with compat family |
| `20260528000600_harden_live_inventory_rls.sql` | Duplicate inventory RLS hardening | Yes | Duplicate | Medium | Keep canonical one, mark other legacy |
| `20260528001442_cutover_branches_to_sucursales.sql` | Repeats sucursales cutover | Maybe | Duplicate | High | Consolidate |
| `20260528001652_migrate_branch_fks_to_sucursales.sql` | Repeats FK migration | Maybe | Duplicate | High | Consolidate |
| `20260528001842_drop_branch_compat_after_cutover.sql` | Repeats branch cleanup | Maybe | Duplicate | High | Consolidate |
| `20260530121000_add_assigned_user_to_service_orders.sql` | Adds assigned_user_id to orders | Yes | No | Low | Keep |
| `20260530132000_security_backoffice_tables.sql` | Creates security tables / compat columns | Maybe | Duplicate intent later fixed | High | Consolidate with fix migration |
| `20260530143000_add_public_token_to_service_orders.sql` | Adds public token | Yes | No | Low | Keep |
| `20260530150000_add_pwa_push_subscriptions.sql` | Adds PWA push subscriptions | Yes | No | Low | Keep |
| `20260530180000_add_customer_sucursal_id.sql` | Adds customer sucursal FK | Yes | No | Low | Keep |
| `20260530193000_audit_hardening_multitenant.sql` | Audit/security hardening | Yes | No | Low | Keep |
| `20260531063159_add_users_activo_compatibility.sql` | Adds `activo` compatibility | Maybe | Compatibility duplicate | Medium | Consolidate with admin module expansion |
| `20260531063240_add_users_mfa_enabled_compatibility.sql` | Adds `mfa_enabled` compatibility | Maybe | Compatibility duplicate | Medium | Consolidate with backoffice security |
| `20260531110000_fix_security_backoffice_schema.sql` | Fixes/patches security backoffice schema | Maybe | Duplicate intent | High | Consolidate with 20260530132000 |
| `20260602113500_restore_tenant_contact_columns.sql` | Restores tenant contact fields | Yes | No | Low | Keep pending remote parity |

## Duplicate or Contradictory Sets

| Domain | Files | Risk |
|---|---|---|
| Branches cutover | `20260527091000_cutover_branches_to_sucursales.sql`, `20260528001442_cutover_branches_to_sucursales.sql` | Duplicate cutover logic can drift |
| FK migration | `20260527093000_migrate_branch_fks_to_sucursales.sql`, `20260528001652_migrate_branch_fks_to_sucursales.sql` | Duplicate FK mapping |
| Compatibility drop | `20260527095000_drop_branch_compat_after_cutover.sql`, `20260528001842_drop_branch_compat_after_cutover.sql` | Duplicate cleanup phase |
| Inventory RLS | `20260527084500_harden_live_inventory_rls.sql`, `20260528000600_harden_live_inventory_rls.sql` | Duplicate hardening path |
| Security/backoffice | `20260530132000_security_backoffice_tables.sql`, `20260531110000_fix_security_backoffice_schema.sql` | Two passes solving same schema surface |
| User compatibility | `20260530120000_expand_users_admin_module.sql`, `20260531063159_add_users_activo_compatibility.sql`, `20260531063240_add_users_mfa_enabled_compatibility.sql` | Overlapping compatibility columns |

## Migraciones que crean y luego eliminan objetos

| File | Pattern |
|---|---|
| `20260527095000_drop_branch_compat_after_cutover.sql` | Drops compatibility branch columns and table |
| `20260528001842_drop_branch_compat_after_cutover.sql` | Duplicate drop after cutover |
| `20260514133525_remote_schema.sql` | Snapshot-style file that removes/recreates schema objects in bulk |

## Legacy SrFix in migrations

| File | Observation |
|---|---|
| `20260523204000_restore_branches_table.sql` | Brings back branch-era compatibility |
| `20260527100000_migrate_users_branch_to_sucursal.sql` | Transitional naming and compatibility |
| `20260527091000_cutover_branches_to_sucursales.sql` | Explicit bridge from old branch naming |
| `20260528001442_cutover_branches_to_sucursales.sql` | Duplicate bridge |

## Risk Summary

| Level | Area | Why |
|---|---|---|
| High | Branches -> sucursales | Duplicate cutover, FK migration, and drop family |
| High | Security/backoffice | Two migration families address the same schema surface |
| Medium | Inventory RLS | Duplicate hardening path |
| Medium | User compatibility | Repeated compatibility columns and triggers |
| Medium | Snapshot migrations | Useful for bootstrap, dangerous if treated as current contract |

## Recommendation

| Step | Action |
|---|---|
| 1 | Validate the canonical migration order against the live Supabase schema and `supabase_migrations` state |
| 2 | Choose one canonical family per domain before any deletion |
| 3 | Mark duplicate families as historical/compatibility only |
| 4 | Do not delete or rewrite applied migrations until the consolidation plan is approved |

