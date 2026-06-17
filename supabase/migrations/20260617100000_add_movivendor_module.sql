create extension if not exists "pgcrypto";

create table if not exists public.movivendor_activation_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  tenant_slug text not null,
  business_name text not null,
  owner_name text not null,
  email text not null,
  phone text not null,
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'approved', 'rejected', 'active', 'suspended')),
  review_notes text null,
  reviewed_by uuid null references public.users(id) on delete set null,
  reviewed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists movivendor_activation_requests_tenant_idx
  on public.movivendor_activation_requests (tenant_id, created_at desc);

create index if not exists movivendor_activation_requests_status_idx
  on public.movivendor_activation_requests (status, created_at desc);

alter table public.movivendor_activation_requests enable row level security;

drop policy if exists "movivendor_activation_requests_tenant_read" on public.movivendor_activation_requests;
create policy "movivendor_activation_requests_tenant_read"
  on public.movivendor_activation_requests
  for select
  using ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id);

drop policy if exists "movivendor_activation_requests_tenant_write" on public.movivendor_activation_requests;
create policy "movivendor_activation_requests_tenant_write"
  on public.movivendor_activation_requests
  for insert
  with check ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id);

drop policy if exists "movivendor_activation_requests_admin_update" on public.movivendor_activation_requests;
create policy "movivendor_activation_requests_admin_update"
  on public.movivendor_activation_requests
  for update
  using ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id)
  with check ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id);

create table if not exists public.movivendor_tenant_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  movivendor_user text not null,
  movivendor_password_encrypted text not null,
  movivendor_ident text not null,
  movivendor_terminal text not null,
  token_expires_at timestamptz null,
  status text not null default 'pending' check (status in ('pending', 'active', 'credentials_error', 'suspended')),
  last_validation_error text null,
  last_validated_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists movivendor_tenant_accounts_status_idx
  on public.movivendor_tenant_accounts (status, updated_at desc);

alter table public.movivendor_tenant_accounts enable row level security;

drop policy if exists "movivendor_tenant_accounts_tenant_read" on public.movivendor_tenant_accounts;
create policy "movivendor_tenant_accounts_tenant_read"
  on public.movivendor_tenant_accounts
  for select
  using ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id);

drop policy if exists "movivendor_tenant_accounts_tenant_write" on public.movivendor_tenant_accounts;
create policy "movivendor_tenant_accounts_tenant_write"
  on public.movivendor_tenant_accounts
  for insert
  with check ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id);

drop policy if exists "movivendor_tenant_accounts_tenant_update" on public.movivendor_tenant_accounts;
create policy "movivendor_tenant_accounts_tenant_update"
  on public.movivendor_tenant_accounts
  for update
  using ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id)
  with check ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id);

create table if not exists public.movivendor_transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid null references public.users(id) on delete set null,
  external_id text not null unique,
  product text not null,
  subprod text null,
  destination text not null,
  amount numeric(12,2) not null,
  confirmation text null,
  trace text null,
  pin text null,
  customer_balance numeric(12,2) null,
  status text not null default 'pending' check (status in ('pending', 'checking', 'approved', 'rejected', 'failed', 'voided')),
  response_code text null,
  response_message text null,
  raw_request jsonb not null default '{}'::jsonb,
  raw_response jsonb not null default '{}'::jsonb,
  payment_method text null,
  branch_id uuid null references public.sucursales(id) on delete set null,
  commission numeric(12,2) null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists movivendor_transactions_tenant_idx
  on public.movivendor_transactions (tenant_id, created_at desc);

create index if not exists movivendor_transactions_status_idx
  on public.movivendor_transactions (status, created_at desc);

alter table public.movivendor_transactions enable row level security;

drop policy if exists "movivendor_transactions_tenant_read" on public.movivendor_transactions;
create policy "movivendor_transactions_tenant_read"
  on public.movivendor_transactions
  for select
  using ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id);

drop policy if exists "movivendor_transactions_tenant_write" on public.movivendor_transactions;
create policy "movivendor_transactions_tenant_write"
  on public.movivendor_transactions
  for insert
  with check ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id);

drop policy if exists "movivendor_transactions_tenant_update" on public.movivendor_transactions;
create policy "movivendor_transactions_tenant_update"
  on public.movivendor_transactions
  for update
  using ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id)
  with check ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id);

alter table public.tenants
  add column if not exists movivendor_status text not null default 'inactive' check (movivendor_status in ('inactive', 'pending', 'reviewing', 'approved', 'active', 'suspended', 'credentials_error')),
  add column if not exists movivendor_updated_at timestamptz null;

