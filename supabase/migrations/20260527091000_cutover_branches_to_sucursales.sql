begin;

-- Shadow cutover migration.
-- Keeps the live schema intact while introducing the canonical tables
-- used by the current backend: public.sucursales and public.sucursal_inventory.

create or replace function public._sucursal_tenant_jwt_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'tenant_id', '')::uuid
$$;

create or replace function public._sucursal_jwt_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'role', '')
$$;

create table if not exists public.sucursales (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  code text,
  address text,
  city text,
  state text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists sucursales_tenant_code_uidx
  on public.sucursales (tenant_id, code)
  where code is not null;

create index if not exists sucursales_tenant_idx
  on public.sucursales (tenant_id);

drop trigger if exists trg_sucursales_updated_at on public.sucursales;
create trigger trg_sucursales_updated_at
before update on public.sucursales
for each row execute function public.set_updated_at();

alter table public.sucursales enable row level security;
alter table public.sucursales force row level security;

drop policy if exists sucursales_select on public.sucursales;
create policy sucursales_select
on public.sucursales
for select
to authenticated
using (public._sucursal_tenant_jwt_id() = tenant_id);

drop policy if exists sucursales_write_owner_manager on public.sucursales;
create policy sucursales_write_owner_manager
on public.sucursales
for all
to authenticated
using (public._sucursal_tenant_jwt_id() = tenant_id and public._sucursal_jwt_role() in ('owner', 'manager'))
with check (public._sucursal_tenant_jwt_id() = tenant_id and public._sucursal_jwt_role() in ('owner', 'manager'));

insert into public.sucursales (
  id,
  tenant_id,
  name,
  code,
  address,
  city,
  state,
  phone,
  is_active,
  created_at,
  updated_at
)
select
  b.id,
  b.tenant_id,
  b.name,
  b.code,
  b.address,
  b.city,
  b.state,
  b.phone,
  b.is_active,
  b.created_at,
  b.updated_at
from public.branches b
on conflict (id) do update
set tenant_id = excluded.tenant_id,
    name = excluded.name,
    code = excluded.code,
    address = excluded.address,
    city = excluded.city,
    state = excluded.state,
    phone = excluded.phone,
    is_active = excluded.is_active,
    updated_at = excluded.updated_at;

create table if not exists public.sucursal_inventory (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sucursal_id uuid references public.sucursales(id) on delete set null,
  product_id uuid not null references public.products(id) on delete cascade,
  stock_current numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists sucursal_inventory_tenant_idx
  on public.sucursal_inventory (tenant_id);

create index if not exists sucursal_inventory_tenant_sucursal_idx
  on public.sucursal_inventory (tenant_id, sucursal_id);

create index if not exists sucursal_inventory_tenant_product_idx
  on public.sucursal_inventory (tenant_id, product_id);

create unique index if not exists sucursal_inventory_uidx
  on public.sucursal_inventory (tenant_id, sucursal_id, product_id);

drop trigger if exists trg_sucursal_inventory_updated_at on public.sucursal_inventory;
create trigger trg_sucursal_inventory_updated_at
before update on public.sucursal_inventory
for each row execute function public.set_updated_at();

alter table public.sucursal_inventory enable row level security;
alter table public.sucursal_inventory force row level security;

drop policy if exists sucursal_inventory_select on public.sucursal_inventory;
create policy sucursal_inventory_select
on public.sucursal_inventory
for select
to authenticated
using (public._sucursal_tenant_jwt_id() = tenant_id);

drop policy if exists sucursal_inventory_write_owner_manager on public.sucursal_inventory;
create policy sucursal_inventory_write_owner_manager
on public.sucursal_inventory
for all
to authenticated
using (public._sucursal_tenant_jwt_id() = tenant_id and public._sucursal_jwt_role() in ('owner', 'manager'))
with check (public._sucursal_tenant_jwt_id() = tenant_id and public._sucursal_jwt_role() in ('owner', 'manager'));

insert into public.sucursal_inventory (
  id,
  tenant_id,
  sucursal_id,
  product_id,
  stock_current,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  i.tenant_id,
  i.branch_id,
  p.id,
  i.stock::numeric(12,2),
  i.created_at,
  i.updated_at
from public.inventory i
join public.products p
  on p.tenant_id = i.tenant_id
 and p.sku = i.sku
on conflict (tenant_id, sucursal_id, product_id) do update
set stock_current = excluded.stock_current,
    updated_at = excluded.updated_at;

grant select, insert, update, delete on public.sucursales to authenticated;
grant select, insert, update, delete on public.sucursal_inventory to authenticated;

commit;
