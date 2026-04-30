create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists expense_categories_tenant_name_unique_idx
  on public.expense_categories (tenant_id, lower(name));

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_id uuid not null references public.expense_categories(id) on delete restrict,
  expense_date date not null default current_date,
  description text not null,
  amount_cents integer not null check (amount_cents >= 0),
  payment_method text not null default 'cash',
  reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expense_categories_tenant_id_idx
  on public.expense_categories (tenant_id);

create index if not exists expense_categories_name_idx
  on public.expense_categories (tenant_id, lower(name));

create index if not exists expenses_tenant_id_idx
  on public.expenses (tenant_id);

create index if not exists expenses_category_id_idx
  on public.expenses (category_id);

create index if not exists expenses_expense_date_idx
  on public.expenses (tenant_id, expense_date desc);

alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'expense_categories' and policyname = 'tenant_isolation_expense_categories_select'
  ) then
    create policy tenant_isolation_expense_categories_select
      on public.expense_categories
      for select
      using (tenant_id = public.auth_tenant_id());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'expense_categories' and policyname = 'tenant_isolation_expense_categories_insert'
  ) then
    create policy tenant_isolation_expense_categories_insert
      on public.expense_categories
      for insert
      with check (tenant_id = public.auth_tenant_id());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'expense_categories' and policyname = 'tenant_isolation_expense_categories_update'
  ) then
    create policy tenant_isolation_expense_categories_update
      on public.expense_categories
      for update
      using (tenant_id = public.auth_tenant_id())
      with check (tenant_id = public.auth_tenant_id());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'expense_categories' and policyname = 'tenant_isolation_expense_categories_delete'
  ) then
    create policy tenant_isolation_expense_categories_delete
      on public.expense_categories
      for delete
      using (tenant_id = public.auth_tenant_id());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'expenses' and policyname = 'tenant_isolation_expenses_select'
  ) then
    create policy tenant_isolation_expenses_select
      on public.expenses
      for select
      using (tenant_id = public.auth_tenant_id());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'expenses' and policyname = 'tenant_isolation_expenses_insert'
  ) then
    create policy tenant_isolation_expenses_insert
      on public.expenses
      for insert
      with check (tenant_id = public.auth_tenant_id());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'expenses' and policyname = 'tenant_isolation_expenses_update'
  ) then
    create policy tenant_isolation_expenses_update
      on public.expenses
      for update
      using (tenant_id = public.auth_tenant_id())
      with check (tenant_id = public.auth_tenant_id());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'expenses' and policyname = 'tenant_isolation_expenses_delete'
  ) then
    create policy tenant_isolation_expenses_delete
      on public.expenses
      for delete
      using (tenant_id = public.auth_tenant_id());
  end if;
end $$;
