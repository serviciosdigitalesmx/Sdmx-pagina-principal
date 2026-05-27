begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  business_name text not null,
  legal_name text,
  contact_name text,
  phone text,
  whatsapp text,
  email text,
  address text,
  city text,
  state text,
  categories text,
  lead_time_days integer,
  payment_terms text,
  price_score integer not null default 0,
  speed_score integer not null default 0,
  quality_score integer not null default 0,
  reliability_score integer not null default 0,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists suppliers_tenant_idx
  on public.suppliers (tenant_id);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  branch_id uuid,
  sku text not null,
  description text not null,
  stock integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists inventory_tenant_idx
  on public.inventory (tenant_id);

create index if not exists inventory_tenant_branch_idx
  on public.inventory (tenant_id, branch_id);

create unique index if not exists inventory_tenant_sku_uidx
  on public.inventory (tenant_id, sku);

create table if not exists public.finances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sucursal_id uuid,
  balance numeric(12,2) not null default 0,
  income numeric(12,2) not null default 0,
  expense numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists finances_tenant_idx
  on public.finances (tenant_id);

create index if not exists finances_tenant_sucursal_idx
  on public.finances (tenant_id, sucursal_id);

create table if not exists public.service_order_checklists (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  has_charger boolean not null default false,
  screen_condition text,
  powers_on boolean not null default false,
  backup_required boolean not null default false,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists service_order_checklists_order_uidx
  on public.service_order_checklists (service_order_id);

alter table public.service_orders
  add column if not exists estimated_cost numeric(12,2) not null default 0;

alter table public.service_orders
  add column if not exists final_cost numeric(12,2) not null default 0;

alter table public.service_orders
  add column if not exists promised_date date;

alter table public.service_orders
  add column if not exists receipt_url text;

alter table public.service_orders
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists service_orders_tenant_folio_uidx
  on public.service_orders (tenant_id, folio);

create index if not exists service_orders_tenant_status_idx
  on public.service_orders (tenant_id, status);

create index if not exists service_orders_tenant_created_at_idx
  on public.service_orders (tenant_id, created_at desc);

alter table public.service_orders
  drop constraint if exists service_orders_status_check;

alter table public.service_orders
  add constraint service_orders_status_check
  check (
    status = any (
      array[
        'pending'::text,
        'diagnosing'::text,
        'waiting_parts'::text,
        'ready'::text,
        'delivered'::text,
        'cancelled'::text,
        'recibido'::text,
        'diagnostico'::text,
        'reparacion'::text,
        'listo'::text,
        'entregado'::text,
        'archived'::text,
        'archivado'::text
      ]
    )
  );

drop trigger if exists trg_service_orders_updated_at on public.service_orders;
create trigger trg_service_orders_updated_at
before update on public.service_orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_service_order_checklists_updated_at on public.service_order_checklists;
create trigger trg_service_order_checklists_updated_at
before update on public.service_order_checklists
for each row execute function public.set_updated_at();

drop trigger if exists trg_suppliers_updated_at on public.suppliers;
create trigger trg_suppliers_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();

drop trigger if exists trg_inventory_updated_at on public.inventory;
create trigger trg_inventory_updated_at
before update on public.inventory
for each row execute function public.set_updated_at();

drop trigger if exists trg_finances_updated_at on public.finances;
create trigger trg_finances_updated_at
before update on public.finances
for each row execute function public.set_updated_at();

alter table public.suppliers enable row level security;
alter table public.inventory enable row level security;
alter table public.finances enable row level security;
alter table public.service_order_checklists enable row level security;

drop policy if exists suppliers_select on public.suppliers;
create policy suppliers_select
on public.suppliers
for select
using (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
);

drop policy if exists suppliers_write_owner_manager on public.suppliers;
create policy suppliers_write_owner_manager
on public.suppliers
for all
using (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
)
with check (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
);

drop policy if exists inventory_select on public.inventory;
create policy inventory_select
on public.inventory
for select
using (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
);

drop policy if exists inventory_write_owner_manager on public.inventory;
create policy inventory_write_owner_manager
on public.inventory
for all
using (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
)
with check (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
);

drop policy if exists finances_select on public.finances;
create policy finances_select
on public.finances
for select
using (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
);

drop policy if exists finances_write_owner_manager on public.finances;
create policy finances_write_owner_manager
on public.finances
for all
using (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
)
with check (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
);

drop policy if exists service_order_checklists_select on public.service_order_checklists;
create policy service_order_checklists_select
on public.service_order_checklists
for select
using (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
);

drop policy if exists service_order_checklists_write_owner_manager on public.service_order_checklists;
create policy service_order_checklists_write_owner_manager
on public.service_order_checklists
for all
using (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
)
with check (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
);

grant select, insert, update, delete on table public.suppliers to authenticated, service_role;
grant select, insert, update, delete on table public.inventory to authenticated, service_role;
grant select, insert, update, delete on table public.finances to authenticated, service_role;
grant select, insert, update, delete on table public.service_order_checklists to authenticated, service_role;

select pg_notify('pgrst', 'reload schema');

commit;
