create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  branch_id uuid,
  auth_user_id uuid,
  full_name text not null,
  email text not null,
  phone text,
  role text not null,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists users_tenant_email_uidx
  on public.users (tenant_id, lower(email));

create unique index if not exists users_tenant_auth_uidx
  on public.users (tenant_id, auth_user_id)
  where auth_user_id is not null;

alter table public.users enable row level security;
