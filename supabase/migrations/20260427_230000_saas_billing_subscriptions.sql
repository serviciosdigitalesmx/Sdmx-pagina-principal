create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan text not null check (plan in ('basic', 'pro', 'enterprise')),
  status text not null check (status in ('pending', 'active', 'past_due', 'canceled')),
  provider text not null default 'mercadopago',
  external_id text not null,
  current_period_end timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, external_id)
);

alter table public.subscriptions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'subscriptions'
      and policyname = 'tenant_isolation_subscriptions'
  ) then
    create policy tenant_isolation_subscriptions
    on public.subscriptions
    using (tenant_id = public.auth_tenant_id())
    with check (tenant_id = public.auth_tenant_id());
  end if;
end $$;
