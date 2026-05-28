begin;

-- Final cutover only.
-- Run this only after production traffic has fully moved to sucursal_id
-- and no client, job, or integration depends on branch_id or public.branches.

-- Reconcile any remaining rows before removing legacy columns.
update public.service_orders
set sucursal_id = coalesce(sucursal_id, branch_id)
where sucursal_id is null and branch_id is not null;

update public.purchase_orders
set sucursal_id = coalesce(sucursal_id, branch_id)
where sucursal_id is null and branch_id is not null;

update public.inventory_movements
set sucursal_id = coalesce(sucursal_id, branch_id)
where sucursal_id is null and branch_id is not null;

update public.stock_alerts
set sucursal_id = coalesce(sucursal_id, branch_id)
where sucursal_id is null and branch_id is not null;

-- Remove sync triggers from the compatibility bridge.
drop trigger if exists trg_service_orders_sync_sucursal_branch on public.service_orders;
drop trigger if exists trg_purchase_orders_sync_sucursal_branch on public.purchase_orders;
drop trigger if exists trg_inventory_movements_sync_sucursal_branch on public.inventory_movements;
drop trigger if exists trg_stock_alerts_sync_sucursal_branch on public.stock_alerts;

-- Remove legacy FKs to branches.
alter table public.service_orders
  drop constraint if exists service_orders_branch_id_fkey;

alter table public.purchase_orders
  drop constraint if exists purchase_orders_branch_id_fkey;

alter table public.inventory_movements
  drop constraint if exists inventory_movements_branch_id_fkey;

alter table public.stock_alerts
  drop constraint if exists stock_alerts_branch_id_fkey;

-- Remove legacy compatibility columns.
alter table public.service_orders
  drop column if exists branch_id;

alter table public.purchase_orders
  drop column if exists branch_id;

alter table public.inventory_movements
  drop column if exists branch_id;

alter table public.stock_alerts
  drop column if exists branch_id;

-- Retire the legacy branches table only after the above columns are gone.
drop table if exists public.branches cascade;

commit;
