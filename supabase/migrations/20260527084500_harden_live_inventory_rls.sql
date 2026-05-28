begin;

create or replace function public._live_tenant_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'tenant_id', '')::uuid
$$;

create or replace function public._live_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'role', '')
$$;

alter table if exists public.products enable row level security;
alter table if exists public.purchase_orders enable row level security;
alter table if exists public.purchase_order_items enable row level security;
alter table if exists public.inventory_movements enable row level security;
alter table if exists public.stock_alerts enable row level security;

alter table if exists public.products force row level security;
alter table if exists public.purchase_orders force row level security;
alter table if exists public.purchase_order_items force row level security;
alter table if exists public.inventory_movements force row level security;
alter table if exists public.stock_alerts force row level security;

drop policy if exists products_select on public.products;
create policy products_select
on public.products
for select
to authenticated
using (public._live_tenant_id() = tenant_id);

drop policy if exists products_write_owner_manager on public.products;
create policy products_write_owner_manager
on public.products
for all
to authenticated
using (public._live_tenant_id() = tenant_id and public._live_role() in ('owner', 'manager'))
with check (public._live_tenant_id() = tenant_id and public._live_role() in ('owner', 'manager'));

drop policy if exists purchase_orders_select on public.purchase_orders;
create policy purchase_orders_select
on public.purchase_orders
for select
to authenticated
using (public._live_tenant_id() = tenant_id);

drop policy if exists purchase_orders_write_owner_manager on public.purchase_orders;
create policy purchase_orders_write_owner_manager
on public.purchase_orders
for all
to authenticated
using (public._live_tenant_id() = tenant_id and public._live_role() in ('owner', 'manager'))
with check (public._live_tenant_id() = tenant_id and public._live_role() in ('owner', 'manager'));

drop policy if exists purchase_order_items_select on public.purchase_order_items;
create policy purchase_order_items_select
on public.purchase_order_items
for select
to authenticated
using (public._live_tenant_id() = tenant_id);

drop policy if exists purchase_order_items_write_owner_manager on public.purchase_order_items;
create policy purchase_order_items_write_owner_manager
on public.purchase_order_items
for all
to authenticated
using (public._live_tenant_id() = tenant_id and public._live_role() in ('owner', 'manager'))
with check (public._live_tenant_id() = tenant_id and public._live_role() in ('owner', 'manager'));

drop policy if exists inventory_movements_select on public.inventory_movements;
create policy inventory_movements_select
on public.inventory_movements
for select
to authenticated
using (public._live_tenant_id() = tenant_id);

drop policy if exists inventory_movements_write_owner_manager on public.inventory_movements;
create policy inventory_movements_write_owner_manager
on public.inventory_movements
for all
to authenticated
using (public._live_tenant_id() = tenant_id and public._live_role() in ('owner', 'manager'))
with check (public._live_tenant_id() = tenant_id and public._live_role() in ('owner', 'manager'));

drop policy if exists stock_alerts_select on public.stock_alerts;
create policy stock_alerts_select
on public.stock_alerts
for select
to authenticated
using (public._live_tenant_id() = tenant_id);

drop policy if exists stock_alerts_write_owner_manager on public.stock_alerts;
create policy stock_alerts_write_owner_manager
on public.stock_alerts
for all
to authenticated
using (public._live_tenant_id() = tenant_id and public._live_role() in ('owner', 'manager'))
with check (public._live_tenant_id() = tenant_id and public._live_role() in ('owner', 'manager'));

grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.purchase_orders to authenticated;
grant select, insert, update, delete on public.purchase_order_items to authenticated;
grant select, insert, update, delete on public.inventory_movements to authenticated;
grant select, insert, update, delete on public.stock_alerts to authenticated;

commit;
