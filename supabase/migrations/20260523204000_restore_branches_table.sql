begin;

create table if not exists public.branches (
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

create unique index if not exists branches_tenant_code_uidx
  on public.branches (tenant_id, code)
  where code is not null;

create index if not exists branches_tenant_idx
  on public.branches (tenant_id);

drop trigger if exists trg_branches_updated_at on public.branches;
create trigger trg_branches_updated_at
before update on public.branches
for each row execute function public.set_updated_at();

alter table public.branches enable row level security;

drop policy if exists branches_select on public.branches;
create policy branches_select
on public.branches
for select
using (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
);

drop policy if exists branches_write_owner_manager on public.branches;
create policy branches_write_owner_manager
on public.branches
for all
using (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
)
with check (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
);

commit;
