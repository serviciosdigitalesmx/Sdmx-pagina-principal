create table if not exists public.suppliers (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists suppliers_tenant_name_unique_idx
  on public.suppliers (tenant_id, lower(name));

create index if not exists suppliers_tenant_id_idx
  on public.suppliers (tenant_id);

create index if not exists suppliers_name_idx
  on public.suppliers (tenant_id, lower(name));

alter table public.suppliers enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'suppliers' and policyname = 'tenant_isolation_suppliers_select'
  ) then
    create policy tenant_isolation_suppliers_select
      on public.suppliers
      for select
      using (tenant_id = public.auth_tenant_id());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'suppliers' and policyname = 'tenant_isolation_suppliers_insert'
  ) then
    create policy tenant_isolation_suppliers_insert
      on public.suppliers
      for insert
      with check (tenant_id = public.auth_tenant_id());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'suppliers' and policyname = 'tenant_isolation_suppliers_update'
  ) then
    create policy tenant_isolation_suppliers_update
      on public.suppliers
      for update
      using (tenant_id = public.auth_tenant_id())
      with check (tenant_id = public.auth_tenant_id());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'suppliers' and policyname = 'tenant_isolation_suppliers_delete'
  ) then
    create policy tenant_isolation_suppliers_delete
      on public.suppliers
      for delete
      using (tenant_id = public.auth_tenant_id());
  end if;
end $$;
