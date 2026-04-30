create table if not exists inventory_products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  sku text not null,
  name text not null,
  category text,
  unit_cost_mxn numeric(12,2),
  sale_price_mxn numeric(12,2),
  current_stock numeric(12,2) not null default 0,
  min_stock numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, sku)
);

create table if not exists inventory_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  product_id uuid not null references inventory_products(id) on delete cascade,
  movement_type text not null check (movement_type in ('in', 'out', 'adjustment', 'transfer')),
  quantity numeric(12,2) not null check (quantity > 0),
  unit_cost_mxn numeric(12,2),
  reference_type text,
  reference_id text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_products_tenant_active
  on inventory_products (tenant_id, is_active, updated_at desc);

create index if not exists idx_inventory_products_tenant_sku
  on inventory_products (tenant_id, sku);

create index if not exists idx_inventory_movements_tenant_product_created
  on inventory_movements (tenant_id, product_id, created_at desc);

create index if not exists idx_inventory_movements_tenant_reference
  on inventory_movements (tenant_id, reference_type, reference_id);

alter table inventory_products enable row level security;
alter table inventory_movements enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'inventory_products' and policyname = 'tenant_isolation_inventory_products'
  ) then
    create policy tenant_isolation_inventory_products
    on inventory_products
    using (tenant_id = auth_tenant_id())
    with check (tenant_id = auth_tenant_id());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'inventory_movements' and policyname = 'tenant_isolation_inventory_movements'
  ) then
    create policy tenant_isolation_inventory_movements
    on inventory_movements
    using (tenant_id = auth_tenant_id())
    with check (tenant_id = auth_tenant_id());
  end if;
end $$;

