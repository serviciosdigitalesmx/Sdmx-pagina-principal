begin;

create or replace function public.has_active_access(p_tenant_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_billing_exempt boolean := false;
  v_status text;
  v_current_period_end timestamptz;
begin
  if p_tenant_id is null then
    return false;
  end if;

  begin
    select coalesce(t.billing_exempt, false)
      into v_billing_exempt
    from public.tenants t
    where t.id = p_tenant_id;

    if v_billing_exempt then
      return true;
    end if;

    select s.status, s.current_period_end
      into v_status, v_current_period_end
    from public.subscriptions s
    where s.tenant_id = p_tenant_id
    order by s.current_period_end desc nulls last, s.created_at desc
    limit 1;

    return (
      v_status in ('active', 'trialing')
      and v_current_period_end is not null
      and now() <= v_current_period_end
    );
  exception when others then
    return false;
  end;
end;
$$;

comment on function public.has_active_access(uuid) is 'Single source of truth for tenant access: tenant.billing_exempt or a non-expired active/trial subscription; fail closed on any error.';

create index if not exists idx_subscriptions_tenant_status
  on public.subscriptions (tenant_id, status);

create index if not exists idx_subscriptions_period
  on public.subscriptions (current_period_end);

drop trigger if exists trg_sync_tenant_billing_exempt_to_shops on public.tenants;
drop function if exists public.sync_tenant_billing_exempt_to_shops();

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'service_orders' and policyname = 'tenant_access_service_orders'
  ) then
    execute 'drop policy if exists tenant_isolation_service_orders on public.service_orders';
    create policy tenant_access_service_orders
      on public.service_orders
      for all
      using (tenant_id = public.auth_tenant_id() and public.has_active_access(tenant_id))
      with check (tenant_id = public.auth_tenant_id() and public.has_active_access(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'customers' and policyname = 'tenant_access_customers'
  ) then
    execute 'drop policy if exists tenant_isolation_customers on public.customers';
    create policy tenant_access_customers
      on public.customers
      for all
      using (tenant_id = public.auth_tenant_id() and public.has_active_access(tenant_id))
      with check (tenant_id = public.auth_tenant_id() and public.has_active_access(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'inventory_movements' and policyname = 'tenant_access_inventory_movements'
  ) then
    execute 'drop policy if exists tenant_isolation_inventory_movements on public.inventory_movements';
    create policy tenant_access_inventory_movements
      on public.inventory_movements
      for all
      using (tenant_id = public.auth_tenant_id() and public.has_active_access(tenant_id))
      with check (tenant_id = public.auth_tenant_id() and public.has_active_access(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'inventory_products' and policyname = 'tenant_access_inventory_products'
  ) then
    execute 'drop policy if exists tenant_isolation_inventory_products on public.inventory_products';
    create policy tenant_access_inventory_products
      on public.inventory_products
      for all
      using (tenant_id = public.auth_tenant_id() and public.has_active_access(tenant_id))
      with check (tenant_id = public.auth_tenant_id() and public.has_active_access(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'suppliers' and policyname = 'tenant_access_suppliers'
  ) then
    execute 'drop policy if exists tenant_isolation_suppliers_select on public.suppliers';
    execute 'drop policy if exists tenant_isolation_suppliers_insert on public.suppliers';
    execute 'drop policy if exists tenant_isolation_suppliers_update on public.suppliers';
    execute 'drop policy if exists tenant_isolation_suppliers_delete on public.suppliers';
    create policy tenant_access_suppliers
      on public.suppliers
      for all
      using (tenant_id = public.auth_tenant_id() and public.has_active_access(tenant_id))
      with check (tenant_id = public.auth_tenant_id() and public.has_active_access(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'expenses' and policyname = 'tenant_access_expenses'
  ) then
    execute 'drop policy if exists tenant_isolation_expenses_select on public.expenses';
    execute 'drop policy if exists tenant_isolation_expenses_insert on public.expenses';
    execute 'drop policy if exists tenant_isolation_expenses_update on public.expenses';
    execute 'drop policy if exists tenant_isolation_expenses_delete on public.expenses';
    create policy tenant_access_expenses
      on public.expenses
      for all
      using (tenant_id = public.auth_tenant_id() and public.has_active_access(tenant_id))
      with check (tenant_id = public.auth_tenant_id() and public.has_active_access(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'file_assets' and policyname = 'tenant_access_file_assets'
  ) then
    execute 'drop policy if exists tenant_isolation_file_assets on public.file_assets';
    create policy tenant_access_file_assets
      on public.file_assets
      for all
      using (tenant_id = public.auth_tenant_id() and public.has_active_access(tenant_id))
      with check (tenant_id = public.auth_tenant_id() and public.has_active_access(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'purchase_orders' and policyname = 'tenant_access_purchase_orders'
  ) then
    execute 'drop policy if exists tenant_isolation_purchase_orders_select on public.purchase_orders';
    execute 'drop policy if exists tenant_isolation_purchase_orders_insert on public.purchase_orders';
    execute 'drop policy if exists tenant_isolation_purchase_orders_update on public.purchase_orders';
    execute 'drop policy if exists tenant_isolation_purchase_orders_delete on public.purchase_orders';
    create policy tenant_access_purchase_orders
      on public.purchase_orders
      for all
      using (tenant_id = public.auth_tenant_id() and public.has_active_access(tenant_id))
      with check (tenant_id = public.auth_tenant_id() and public.has_active_access(tenant_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'purchase_items' and policyname = 'tenant_access_purchase_items'
  ) then
    execute 'drop policy if exists tenant_isolation_purchase_items_select on public.purchase_items';
    execute 'drop policy if exists tenant_isolation_purchase_items_insert on public.purchase_items';
    execute 'drop policy if exists tenant_isolation_purchase_items_update on public.purchase_items';
    execute 'drop policy if exists tenant_isolation_purchase_items_delete on public.purchase_items';
    create policy tenant_access_purchase_items
      on public.purchase_items
      for all
      using (tenant_id = public.auth_tenant_id() and public.has_active_access(tenant_id))
      with check (tenant_id = public.auth_tenant_id() and public.has_active_access(tenant_id));
  end if;
end $$;

commit;
