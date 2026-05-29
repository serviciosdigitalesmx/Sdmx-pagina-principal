begin;

-- Hardening migration for the current canonical schema.
-- This closes the gap left by older branch_* migrations and applies RLS
-- to the tables that the product actually uses now.

create or replace function public._tenant_jwt_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'tenant_id', '')::uuid
$$;

create or replace function public._jwt_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'role', '')
$$;

create or replace function public._is_tenant_member(target_tenant uuid)
returns boolean
language sql
stable
as $$
  select public._tenant_jwt_id() = target_tenant
$$;

create or replace function public._is_owner_or_manager()
returns boolean
language sql
stable
as $$
  select public._jwt_role() in ('owner', 'manager')
$$;

create or replace function public._is_owner_manager_or_technician()
returns boolean
language sql
stable
as $$
  select public._jwt_role() in ('owner', 'manager', 'technician')
$$;

alter table if exists public.tenants enable row level security;
alter table if exists public.users enable row level security;
alter table if exists public.customers enable row level security;
alter table if exists public.service_requests enable row level security;
alter table if exists public.service_orders enable row level security;
alter table if exists public.service_order_documents enable row level security;
alter table if exists public.service_order_events enable row level security;
alter table if exists public.sucursales enable row level security;
alter table if exists public.sucursal_inventory enable row level security;
alter table if exists public.products enable row level security;
alter table if exists public.suppliers enable row level security;
alter table if exists public.expenses enable row level security;
alter table if exists public.tasks enable row level security;
alter table if exists public.purchase_orders enable row level security;
alter table if exists public.purchase_order_items enable row level security;
alter table if exists public.inventory_movements enable row level security;
alter table if exists public.stock_alerts enable row level security;
alter table if exists public.customer_payments enable row level security;
alter table if exists public.file_assets enable row level security;
alter table if exists public.finances enable row level security;

alter table if exists public.tenants force row level security;
alter table if exists public.users force row level security;
alter table if exists public.customers force row level security;
alter table if exists public.service_requests force row level security;
alter table if exists public.service_orders force row level security;
alter table if exists public.service_order_documents force row level security;
alter table if exists public.service_order_events force row level security;
alter table if exists public.sucursales force row level security;
alter table if exists public.sucursal_inventory force row level security;
alter table if exists public.products force row level security;
alter table if exists public.suppliers force row level security;
alter table if exists public.expenses force row level security;
alter table if exists public.tasks force row level security;
alter table if exists public.purchase_orders force row level security;
alter table if exists public.purchase_order_items force row level security;
alter table if exists public.inventory_movements force row level security;
alter table if exists public.stock_alerts force row level security;
alter table if exists public.customer_payments force row level security;
alter table if exists public.file_assets force row level security;
alter table if exists public.finances force row level security;

do $$
begin
  if to_regclass('public.tenants') is not null then
    execute 'drop policy if exists tenants_select_same_tenant on public.tenants';
    execute $policy$
      create policy tenants_select_same_tenant
      on public.tenants
      for select
      to authenticated
      using (public._tenant_jwt_id() = id)
    $policy$;

    execute 'drop policy if exists tenants_insert_owner on public.tenants';
    execute $policy$
      create policy tenants_insert_owner
      on public.tenants
      for insert
      to authenticated
      with check (public._jwt_role() = 'owner')
    $policy$;

    execute 'drop policy if exists tenants_update_owner on public.tenants';
    execute $policy$
      create policy tenants_update_owner
      on public.tenants
      for update
      to authenticated
      using (public._tenant_jwt_id() = id and public._jwt_role() = 'owner')
      with check (public._tenant_jwt_id() = id and public._jwt_role() = 'owner')
    $policy$;

    execute 'drop policy if exists tenants_delete_owner on public.tenants';
    execute $policy$
      create policy tenants_delete_owner
      on public.tenants
      for delete
      to authenticated
      using (public._tenant_jwt_id() = id and public._jwt_role() = 'owner')
    $policy$;
  end if;

  if to_regclass('public.users') is not null then
    execute 'drop policy if exists users_select_tenant on public.users';
    execute $policy$
      create policy users_select_tenant
      on public.users
      for select
      to authenticated
      using (public._is_tenant_member(tenant_id))
    $policy$;

    execute 'drop policy if exists users_write_owner_manager on public.users';
    execute $policy$
      create policy users_write_owner_manager
      on public.users
      for all
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
      with check (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
  end if;

  if to_regclass('public.customers') is not null then
    execute 'drop policy if exists customers_select on public.customers';
    execute $policy$
      create policy customers_select
      on public.customers
      for select
      to authenticated
      using (public._is_tenant_member(tenant_id))
    $policy$;
    execute 'drop policy if exists customers_write_owner_manager on public.customers';
    execute $policy$
      create policy customers_write_owner_manager
      on public.customers
      for insert
      to authenticated
      with check (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
    execute 'drop policy if exists customers_update_owner_manager on public.customers';
    execute $policy$
      create policy customers_update_owner_manager
      on public.customers
      for update
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
      with check (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
    execute 'drop policy if exists customers_delete_owner_manager on public.customers';
    execute $policy$
      create policy customers_delete_owner_manager
      on public.customers
      for delete
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
  end if;

  if to_regclass('public.service_requests') is not null then
    execute 'drop policy if exists service_requests_select on public.service_requests';
    execute $policy$
      create policy service_requests_select
      on public.service_requests
      for select
      to authenticated
      using (public._is_tenant_member(tenant_id))
    $policy$;
    execute 'drop policy if exists service_requests_write_owner_manager on public.service_requests';
    execute $policy$
      create policy service_requests_write_owner_manager
      on public.service_requests
      for insert
      to authenticated
      with check (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
    execute 'drop policy if exists service_requests_update_owner_manager on public.service_requests';
    execute $policy$
      create policy service_requests_update_owner_manager
      on public.service_requests
      for update
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
      with check (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
    execute 'drop policy if exists service_requests_delete_tenant on public.service_requests';
    execute $policy$
      create policy service_requests_delete_tenant
      on public.service_requests
      for delete
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
  end if;

  if to_regclass('public.service_orders') is not null then
    execute 'drop policy if exists service_orders_select on public.service_orders';
    execute $policy$
      create policy service_orders_select
      on public.service_orders
      for select
      to authenticated
      using (public._is_tenant_member(tenant_id))
    $policy$;
    execute 'drop policy if exists service_orders_write_owner_manager on public.service_orders';
    execute $policy$
      create policy service_orders_write_owner_manager
      on public.service_orders
      for insert
      to authenticated
      with check (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
    execute 'drop policy if exists service_orders_update_owner_manager on public.service_orders';
    execute $policy$
      create policy service_orders_update_owner_manager
      on public.service_orders
      for update
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
      with check (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
    execute 'drop policy if exists service_orders_delete_owner_manager on public.service_orders';
    execute $policy$
      create policy service_orders_delete_owner_manager
      on public.service_orders
      for delete
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
    execute 'drop policy if exists service_orders_update_technician on public.service_orders';
    execute $policy$
      create policy service_orders_update_technician
      on public.service_orders
      for update
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._jwt_role() = 'technician')
      with check (public._is_tenant_member(tenant_id) and public._jwt_role() = 'technician')
    $policy$;
  end if;

  if to_regclass('public.service_order_documents') is not null then
    execute 'drop policy if exists service_order_documents_select on public.service_order_documents';
    execute $policy$
      create policy service_order_documents_select
      on public.service_order_documents
      for select
      to authenticated
      using (public._is_tenant_member(tenant_id))
    $policy$;
    execute 'drop policy if exists service_order_documents_write_owner_manager on public.service_order_documents';
    execute $policy$
      create policy service_order_documents_write_owner_manager
      on public.service_order_documents
      for all
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
      with check (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
  end if;

  if to_regclass('public.service_order_events') is not null then
    execute 'drop policy if exists service_order_events_select on public.service_order_events';
    execute $policy$
      create policy service_order_events_select
      on public.service_order_events
      for select
      to authenticated
      using (public._is_tenant_member(tenant_id))
    $policy$;
    execute 'drop policy if exists service_order_events_write_owner_manager on public.service_order_events';
    execute $policy$
      create policy service_order_events_write_owner_manager
      on public.service_order_events
      for all
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
      with check (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
  end if;

  if to_regclass('public.sucursales') is not null then
    execute 'drop policy if exists sucursales_select on public.sucursales';
    execute $policy$
      create policy sucursales_select
      on public.sucursales
      for select
      to authenticated
      using (public._is_tenant_member(tenant_id))
    $policy$;
    execute 'drop policy if exists sucursales_write_owner_manager on public.sucursales';
    execute $policy$
      create policy sucursales_write_owner_manager
      on public.sucursales
      for all
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
      with check (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
  end if;

  if to_regclass('public.sucursal_inventory') is not null then
    execute 'drop policy if exists sucursal_inventory_select on public.sucursal_inventory';
    execute $policy$
      create policy sucursal_inventory_select
      on public.sucursal_inventory
      for select
      to authenticated
      using (public._is_tenant_member(tenant_id))
    $policy$;
    execute 'drop policy if exists sucursal_inventory_write_owner_manager on public.sucursal_inventory';
    execute $policy$
      create policy sucursal_inventory_write_owner_manager
      on public.sucursal_inventory
      for all
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
      with check (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
  end if;

  if to_regclass('public.products') is not null then
    execute 'drop policy if exists products_select on public.products';
    execute $policy$
      create policy products_select
      on public.products
      for select
      to authenticated
      using (public._is_tenant_member(tenant_id))
    $policy$;
    execute 'drop policy if exists products_write_owner_manager on public.products';
    execute $policy$
      create policy products_write_owner_manager
      on public.products
      for all
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
      with check (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
  end if;

  if to_regclass('public.suppliers') is not null then
    execute 'drop policy if exists suppliers_select on public.suppliers';
    execute $policy$
      create policy suppliers_select
      on public.suppliers
      for select
      to authenticated
      using (public._is_tenant_member(tenant_id))
    $policy$;
    execute 'drop policy if exists suppliers_write_owner_manager on public.suppliers';
    execute $policy$
      create policy suppliers_write_owner_manager
      on public.suppliers
      for all
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
      with check (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
  end if;

  if to_regclass('public.expenses') is not null then
    execute 'drop policy if exists expenses_owner on public.expenses';
    execute $policy$
      create policy expenses_owner
      on public.expenses
      for all
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._jwt_role() = 'owner')
      with check (public._is_tenant_member(tenant_id) and public._jwt_role() = 'owner')
    $policy$;
    execute 'drop policy if exists expenses_manager_read_own_sucursal on public.expenses';
    execute $policy$
      create policy expenses_manager_read_own_sucursal
      on public.expenses
      for select
      to authenticated
      using (
        public._is_tenant_member(tenant_id)
        and public._jwt_role() = 'manager'
        and ((public._tenant_jwt_id() = tenant_id) is true)
      )
    $policy$;
    execute 'drop policy if exists expenses_manager_write_own_sucursal on public.expenses';
    execute $policy$
      create policy expenses_manager_write_own_sucursal
      on public.expenses
      for insert
      to authenticated
      with check (
        public._is_tenant_member(tenant_id)
        and public._jwt_role() = 'manager'
      )
    $policy$;
    execute 'drop policy if exists expenses_manager_update_own_sucursal on public.expenses';
    execute $policy$
      create policy expenses_manager_update_own_sucursal
      on public.expenses
      for update
      to authenticated
      using (
        public._is_tenant_member(tenant_id)
        and public._jwt_role() = 'manager'
      )
      with check (
        public._is_tenant_member(tenant_id)
        and public._jwt_role() = 'manager'
      )
    $policy$;
    execute 'drop policy if exists expenses_manager_delete_own_sucursal on public.expenses';
    execute $policy$
      create policy expenses_manager_delete_own_sucursal
      on public.expenses
      for delete
      to authenticated
      using (
        public._is_tenant_member(tenant_id)
        and public._jwt_role() = 'manager'
      )
    $policy$;
  end if;

  if to_regclass('public.tasks') is not null then
    execute 'drop policy if exists tasks_select on public.tasks';
    execute $policy$
      create policy tasks_select
      on public.tasks
      for select
      to authenticated
      using (public._is_tenant_member(tenant_id))
    $policy$;
    execute 'drop policy if exists tasks_write_owner_manager on public.tasks';
    execute $policy$
      create policy tasks_write_owner_manager
      on public.tasks
      for all
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
      with check (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
  end if;

  if to_regclass('public.purchase_orders') is not null then
    execute 'drop policy if exists purchase_orders_select on public.purchase_orders';
    execute $policy$
      create policy purchase_orders_select
      on public.purchase_orders
      for select
      to authenticated
      using (public._is_tenant_member(tenant_id))
    $policy$;
    execute 'drop policy if exists purchase_orders_write_owner_manager on public.purchase_orders';
    execute $policy$
      create policy purchase_orders_write_owner_manager
      on public.purchase_orders
      for all
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
      with check (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
  end if;

  if to_regclass('public.purchase_order_items') is not null then
    execute 'drop policy if exists purchase_order_items_select on public.purchase_order_items';
    execute $policy$
      create policy purchase_order_items_select
      on public.purchase_order_items
      for select
      to authenticated
      using (public._is_tenant_member(tenant_id))
    $policy$;
    execute 'drop policy if exists purchase_order_items_write_owner_manager on public.purchase_order_items';
    execute $policy$
      create policy purchase_order_items_write_owner_manager
      on public.purchase_order_items
      for all
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
      with check (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
  end if;

  if to_regclass('public.inventory_movements') is not null then
    execute 'drop policy if exists inventory_movements_select on public.inventory_movements';
    execute $policy$
      create policy inventory_movements_select
      on public.inventory_movements
      for select
      to authenticated
      using (public._is_tenant_member(tenant_id))
    $policy$;
    execute 'drop policy if exists inventory_movements_write_owner_manager on public.inventory_movements';
    execute $policy$
      create policy inventory_movements_write_owner_manager
      on public.inventory_movements
      for all
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
      with check (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
  end if;

  if to_regclass('public.stock_alerts') is not null then
    execute 'drop policy if exists stock_alerts_select on public.stock_alerts';
    execute $policy$
      create policy stock_alerts_select
      on public.stock_alerts
      for select
      to authenticated
      using (public._is_tenant_member(tenant_id))
    $policy$;
    execute 'drop policy if exists stock_alerts_write_owner_manager on public.stock_alerts';
    execute $policy$
      create policy stock_alerts_write_owner_manager
      on public.stock_alerts
      for all
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
      with check (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
  end if;

  if to_regclass('public.customer_payments') is not null then
    execute 'drop policy if exists customer_payments_select on public.customer_payments';
    execute $policy$
      create policy customer_payments_select
      on public.customer_payments
      for select
      to authenticated
      using (public._is_tenant_member(tenant_id))
    $policy$;
    execute 'drop policy if exists customer_payments_write_owner_manager on public.customer_payments';
    execute $policy$
      create policy customer_payments_write_owner_manager
      on public.customer_payments
      for all
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
      with check (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
  end if;

  if to_regclass('public.file_assets') is not null then
    execute 'drop policy if exists file_assets_select on public.file_assets';
    execute $policy$
      create policy file_assets_select
      on public.file_assets
      for select
      to authenticated
      using (public._is_tenant_member(tenant_id))
    $policy$;
    execute 'drop policy if exists file_assets_write_owner_manager on public.file_assets';
    execute $policy$
      create policy file_assets_write_owner_manager
      on public.file_assets
      for all
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
      with check (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
  end if;

  if to_regclass('public.finances') is not null then
    execute 'drop policy if exists finances_select on public.finances';
    execute $policy$
      create policy finances_select
      on public.finances
      for select
      to authenticated
      using (public._is_tenant_member(tenant_id))
    $policy$;
    execute 'drop policy if exists finances_write_owner_manager on public.finances';
    execute $policy$
      create policy finances_write_owner_manager
      on public.finances
      for all
      to authenticated
      using (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
      with check (public._is_tenant_member(tenant_id) and public._is_owner_or_manager())
    $policy$;
  end if;
end $$;

grant select, insert, update, delete on public.tenants to authenticated;
grant select, insert, update, delete on public.users to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.service_requests to authenticated;
grant select, insert, update, delete on public.service_orders to authenticated;
grant select, insert, update, delete on public.service_order_documents to authenticated;
grant select, insert, update, delete on public.service_order_events to authenticated;
grant select, insert, update, delete on public.sucursales to authenticated;
grant select, insert, update, delete on public.sucursal_inventory to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.suppliers to authenticated;
do $$
begin
  if to_regclass('public.expenses') is not null then
    grant select, insert, update, delete on public.expenses to authenticated;
  end if;
end $$;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.purchase_orders to authenticated;
grant select, insert, update, delete on public.purchase_order_items to authenticated;
grant select, insert, update, delete on public.inventory_movements to authenticated;
grant select, insert, update, delete on public.stock_alerts to authenticated;
grant select, insert, update, delete on public.customer_payments to authenticated;
grant select, insert, update, delete on public.file_assets to authenticated;
grant select, insert, update, delete on public.finances to authenticated;

commit;
