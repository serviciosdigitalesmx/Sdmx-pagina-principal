begin;

alter table if exists public.tenants
  add column if not exists require_admin_mfa boolean not null default false;

alter table if exists public.users
  add column if not exists mfa_enabled boolean not null default false,
  add column if not exists mfa_secret text,
  add column if not exists mfa_verified_at timestamptz;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  ip_address inet,
  user_agent text,
  data_before jsonb,
  data_after jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists audit_logs_tenant_created_idx
  on public.audit_logs (tenant_id, created_at desc);

create index if not exists audit_logs_tenant_action_idx
  on public.audit_logs (tenant_id, action);

create index if not exists audit_logs_tenant_user_idx
  on public.audit_logs (tenant_id, user_id, created_at desc);

create table if not exists public.security_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  session_key text not null unique,
  ip_address inet,
  user_agent text,
  last_activity_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists security_sessions_tenant_active_idx
  on public.security_sessions (tenant_id, revoked_at, last_activity_at desc);

create index if not exists security_sessions_tenant_user_idx
  on public.security_sessions (tenant_id, user_id, last_activity_at desc);

alter table if exists public.audit_logs enable row level security;
alter table if exists public.security_sessions enable row level security;
alter table if exists public.audit_logs force row level security;
alter table if exists public.security_sessions force row level security;

drop policy if exists audit_logs_select_owner on public.audit_logs;
create policy audit_logs_select_owner
on public.audit_logs
for select
to authenticated
using ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id and coalesce(auth.jwt() ->> 'role', '') = 'owner');

drop policy if exists security_sessions_select_owner_manager on public.security_sessions;
create policy security_sessions_select_owner_manager
on public.security_sessions
for select
to authenticated
using (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
  and coalesce(auth.jwt() ->> 'role', '') in ('owner', 'manager')
);

commit;
