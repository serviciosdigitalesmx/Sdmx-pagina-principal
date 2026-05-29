begin;

-- Migrate the live FK path from branches to sucursales without downtime.
-- The old branch_id columns remain in place for compatibility during cutover.

create or replace function public._sync_sucursal_id_from_branch_id()
returns trigger
language plpgsql
as $$
begin
  if new.sucursal_id is null and new.branch_id is not null then
    new.sucursal_id := new.branch_id;
  elsif new.branch_id is null and new.sucursal_id is not null then
    new.branch_id := new.sucursal_id;
  end if;
  return new;
end;
$$;

-- service_orders
alter table if exists public.service_orders
  add column if not exists sucursal_id uuid;

-- already migrated

create index if not exists service_orders_tenant_sucursal_idx
  on public.service_orders (tenant_id, sucursal_id);

alter table public.service_orders
  drop constraint if exists service_orders_sucursal_id_fkey;

alter table public.service_orders
  add constraint service_orders_sucursal_id_fkey
  foreign key (sucursal_id)
  references public.sucursales(id)
  on delete set null;

drop trigger if exists trg_service_orders_sync_sucursal_branch on public.service_orders;
create trigger trg_service_orders_sync_sucursal_branch
before insert or update on public.service_orders
for each row execute function public._sync_sucursal_id_from_branch_id();

-- purchase_orders
alter table if exists public.purchase_orders
  add column if not exists sucursal_id uuid;

-- already migrated

create index if not exists purchase_orders_tenant_sucursal_idx
  on public.purchase_orders (tenant_id, sucursal_id);

alter table public.purchase_orders
  drop constraint if exists purchase_orders_sucursal_id_fkey;

alter table public.purchase_orders
  add constraint purchase_orders_sucursal_id_fkey
  foreign key (sucursal_id)
  references public.sucursales(id)
  on delete set null;

drop trigger if exists trg_purchase_orders_sync_sucursal_branch on public.purchase_orders;
create trigger trg_purchase_orders_sync_sucursal_branch
before insert or update on public.purchase_orders
for each row execute function public._sync_sucursal_id_from_branch_id();

-- inventory_movements
alter table if exists public.inventory_movements
  add column if not exists sucursal_id uuid;

-- already migrated

create index if not exists inventory_movements_tenant_sucursal_idx
  on public.inventory_movements (tenant_id, sucursal_id, created_at desc);

alter table public.inventory_movements
  drop constraint if exists inventory_movements_sucursal_id_fkey;

alter table public.inventory_movements
  add constraint inventory_movements_sucursal_id_fkey
  foreign key (sucursal_id)
  references public.sucursales(id)
  on delete set null;

drop trigger if exists trg_inventory_movements_sync_sucursal_branch on public.inventory_movements;
create trigger trg_inventory_movements_sync_sucursal_branch
before insert or update on public.inventory_movements
for each row execute function public._sync_sucursal_id_from_branch_id();

-- stock_alerts
alter table if exists public.stock_alerts
  add column if not exists sucursal_id uuid;

-- already migrated

create index if not exists stock_alerts_tenant_sucursal_idx
  on public.stock_alerts (tenant_id, sucursal_id);

alter table public.stock_alerts
  drop constraint if exists stock_alerts_sucursal_id_fkey;

alter table public.stock_alerts
  add constraint stock_alerts_sucursal_id_fkey
  foreign key (sucursal_id)
  references public.sucursales(id)
  on delete set null;

drop trigger if exists trg_stock_alerts_sync_sucursal_branch on public.stock_alerts;
create trigger trg_stock_alerts_sync_sucursal_branch
before insert or update on public.stock_alerts
for each row execute function public._sync_sucursal_id_from_branch_id();

commit;
