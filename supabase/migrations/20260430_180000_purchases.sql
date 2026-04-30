create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  status text not null check (status in ('draft', 'confirmed', 'cancelled')),
  total_amount_cents integer not null default 0,
  currency text not null default 'MXN',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid not null references public.inventory_products(id) on delete restrict,
  quantity numeric(12,2) not null check (quantity > 0),
  unit_cost_cents integer not null check (unit_cost_cents >= 0),
  total_cost_cents integer not null check (total_cost_cents >= 0),
  created_at timestamptz not null default now()
);

create index if not exists purchase_orders_tenant_id_idx
  on public.purchase_orders (tenant_id);

create index if not exists purchase_orders_tenant_supplier_idx
  on public.purchase_orders (tenant_id, supplier_id);

create index if not exists purchase_orders_created_at_idx
  on public.purchase_orders (created_at desc);

create index if not exists purchase_items_tenant_id_idx
  on public.purchase_items (tenant_id);

create index if not exists purchase_items_purchase_order_idx
  on public.purchase_items (purchase_order_id);

create index if not exists purchase_items_product_id_idx
  on public.purchase_items (product_id);

alter table public.purchase_orders enable row level security;
alter table public.purchase_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'purchase_orders' and policyname = 'tenant_isolation_purchase_orders_select'
  ) then
    create policy tenant_isolation_purchase_orders_select
      on public.purchase_orders
      for select
      using (tenant_id = public.auth_tenant_id());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'purchase_orders' and policyname = 'tenant_isolation_purchase_orders_insert'
  ) then
    create policy tenant_isolation_purchase_orders_insert
      on public.purchase_orders
      for insert
      with check (tenant_id = public.auth_tenant_id());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'purchase_orders' and policyname = 'tenant_isolation_purchase_orders_update'
  ) then
    create policy tenant_isolation_purchase_orders_update
      on public.purchase_orders
      for update
      using (tenant_id = public.auth_tenant_id())
      with check (tenant_id = public.auth_tenant_id());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'purchase_orders' and policyname = 'tenant_isolation_purchase_orders_delete'
  ) then
    create policy tenant_isolation_purchase_orders_delete
      on public.purchase_orders
      for delete
      using (tenant_id = public.auth_tenant_id());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'purchase_items' and policyname = 'tenant_isolation_purchase_items_select'
  ) then
    create policy tenant_isolation_purchase_items_select
      on public.purchase_items
      for select
      using (tenant_id = public.auth_tenant_id());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'purchase_items' and policyname = 'tenant_isolation_purchase_items_insert'
  ) then
    create policy tenant_isolation_purchase_items_insert
      on public.purchase_items
      for insert
      with check (tenant_id = public.auth_tenant_id());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'purchase_items' and policyname = 'tenant_isolation_purchase_items_update'
  ) then
    create policy tenant_isolation_purchase_items_update
      on public.purchase_items
      for update
      using (tenant_id = public.auth_tenant_id())
      with check (tenant_id = public.auth_tenant_id());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'purchase_items' and policyname = 'tenant_isolation_purchase_items_delete'
  ) then
    create policy tenant_isolation_purchase_items_delete
      on public.purchase_items
      for delete
      using (tenant_id = public.auth_tenant_id());
  end if;
end $$;

create or replace function public.create_purchase_order(
  p_tenant_id uuid,
  p_supplier_id uuid,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase_order_id uuid := gen_random_uuid();
  v_item jsonb;
  v_total bigint := 0;
  v_supplier_tenant uuid;
  v_product_tenant uuid;
  v_quantity numeric(12,2);
  v_unit_cost integer;
  v_total_cost integer;
  v_product_id uuid;
begin
  if auth_tenant_id() is null then
    raise exception 'No autorizado';
  end if;
  if p_tenant_id is null or p_tenant_id <> auth_tenant_id() then
    raise exception 'Tenant inválido';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La compra debe incluir al menos un item';
  end if;

  select tenant_id into v_supplier_tenant
  from public.suppliers
  where id = p_supplier_id;
  if v_supplier_tenant is null then
    raise exception 'Proveedor no encontrado';
  end if;
  if v_supplier_tenant <> p_tenant_id then
    raise exception 'Proveedor fuera del tenant';
  end if;

  insert into public.purchase_orders (id, tenant_id, supplier_id, status, total_amount_cents, currency, notes, created_at, updated_at)
  values (v_purchase_order_id, p_tenant_id, p_supplier_id, 'draft', 0, 'MXN', nullif(trim(coalesce(p_notes, '')), ''), now(), now());

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'productId')::uuid;
    v_quantity := coalesce((v_item->>'quantity')::numeric, 0);
    v_unit_cost := coalesce((v_item->>'unitCostCents')::integer, 0);
    v_total_cost := round(v_quantity * v_unit_cost)::integer;

    if v_product_id is null then
      raise exception 'productId es obligatorio';
    end if;
    if v_quantity <= 0 then
      raise exception 'quantity debe ser mayor a 0';
    end if;
    if v_unit_cost < 0 then
      raise exception 'unitCostCents debe ser mayor o igual a 0';
    end if;

    select tenant_id into v_product_tenant
    from public.inventory_products
    where id = v_product_id;
    if v_product_tenant is null then
      raise exception 'Producto no encontrado';
    end if;
    if v_product_tenant <> p_tenant_id then
      raise exception 'Producto fuera del tenant';
    end if;

    insert into public.purchase_items (tenant_id, purchase_order_id, product_id, quantity, unit_cost_cents, total_cost_cents, created_at)
    values (p_tenant_id, v_purchase_order_id, v_product_id, v_quantity, v_unit_cost, v_total_cost, now());

    v_total := v_total + v_total_cost;
  end loop;

  update public.purchase_orders
    set total_amount_cents = v_total,
        updated_at = now()
  where id = v_purchase_order_id;

  return v_purchase_order_id;
end;
$$;

create or replace function public.confirm_purchase_order(
  p_tenant_id uuid,
  p_purchase_order_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_item record;
  v_next_stock numeric(12,2);
begin
  if auth_tenant_id() is null then
    raise exception 'No autorizado';
  end if;
  if p_tenant_id is null or p_tenant_id <> auth_tenant_id() then
    raise exception 'Tenant inválido';
  end if;

  select * into v_order
  from public.purchase_orders
  where id = p_purchase_order_id
    and tenant_id = p_tenant_id
  for update;

  if not found then
    raise exception 'Compra no encontrada';
  end if;
  if v_order.status <> 'draft' then
    raise exception 'Solo se puede confirmar una compra en estado draft';
  end if;

  for v_item in
    select * from public.purchase_items
    where purchase_order_id = p_purchase_order_id
      and tenant_id = p_tenant_id
  loop
    update public.inventory_products
      set current_stock = current_stock + v_item.quantity,
          updated_at = now()
    where id = v_item.product_id
      and tenant_id = p_tenant_id
    returning current_stock into v_next_stock;

    if not found then
      raise exception 'Producto no encontrado para confirmar compra';
    end if;

    insert into public.inventory_movements (
      id,
      tenant_id,
      branch_id,
      product_id,
      movement_type,
      quantity,
      unit_cost_mxn,
      reference_type,
      reference_id,
      note,
      created_at
    )
    values (
      gen_random_uuid(),
      p_tenant_id,
      null,
      v_item.product_id,
      'in',
      v_item.quantity,
      (v_item.unit_cost_cents::numeric / 100.0),
      'purchase_order',
      p_purchase_order_id::text,
      'Compra confirmada',
      now()
    );
  end loop;

  update public.purchase_orders
    set status = 'confirmed',
        updated_at = now()
  where id = p_purchase_order_id;

  return p_purchase_order_id;
end;
$$;
