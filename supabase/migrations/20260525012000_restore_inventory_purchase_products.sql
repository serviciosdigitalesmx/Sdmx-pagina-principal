create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sku text not null,
  name text not null,
  category text,
  brand text,
  compatible_model text,
  primary_supplier_id uuid references public.suppliers(id) on delete set null,
  cost numeric(12,2) not null default 0,
  sale_price numeric(12,2) not null default 0,
  minimum_stock numeric(12,2) not null default 0,
  unit text,
  location text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists products_tenant_sku_uidx
  on public.products (tenant_id, sku);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  related_service_order_id uuid references public.service_orders(id) on delete set null,
  folio text not null,
  status text not null default 'borrador',
  reference text,
  payment_terms text,
  expected_date date,
  subtotal numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists purchase_orders_tenant_folio_uidx
  on public.purchase_orders (tenant_id, folio);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  sku_snapshot text,
  product_name_snapshot text,
  qty_ordered numeric(12,2) not null default 0,
  qty_received numeric(12,2) not null default 0,
  unit_cost numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  product_id uuid not null references public.products(id) on delete cascade,
  service_order_id uuid references public.service_orders(id) on delete set null,
  purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  movement_type text not null,
  quantity numeric(12,2) not null,
  unit_cost numeric(12,2) not null default 0,
  reference text,
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists inventory_movements_tenant_product_idx
  on public.inventory_movements (tenant_id, product_id, created_at desc);

create table if not exists public.stock_alerts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  product_id uuid not null references public.products(id) on delete cascade,
  severity text not null,
  acknowledged_by uuid references public.users(id) on delete set null,
  acknowledged_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);
