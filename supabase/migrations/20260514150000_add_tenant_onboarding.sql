create extension if not exists "pgcrypto";

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

alter table public.tenants
  add column if not exists trial_expires_at timestamptz,
  add column if not exists branding jsonb not null default jsonb_build_object(
    'primaryColor', '#0066ff',
    'secondaryColor', '#00cc99',
    'logoUrl', ''
  );

update public.tenants
set trial_expires_at = timezone('utc', now()) + interval '14 days'
where trial_expires_at is null;

alter table public.tenants
  alter column trial_expires_at set default (timezone('utc', now()) + interval '14 days');

alter table public.tenants
  alter column trial_expires_at set not null;

create unique index if not exists users_tenant_auth_uidx
  on public.users (tenant_id, auth_user_id)
  where auth_user_id is not null;

create unique index if not exists users_tenant_email_uidx
  on public.users (tenant_id, lower(email));

alter table public.service_orders
  add column if not exists folio text;

create unique index if not exists service_orders_folio_uidx
  on public.service_orders (tenant_id, folio)
  where folio is not null;

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  folio text not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  device_type text not null,
  device_model text not null,
  issue_description text not null,
  status text not null default 'pendiente',
  quoted_total numeric(12,2) not null default 0,
  deposit_amount numeric(12,2) not null default 0,
  balance_amount numeric(12,2) not null default 0,
  solicitud_origen_ip text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists service_requests_tenant_idx
  on public.service_requests (tenant_id, created_at desc);

create unique index if not exists service_requests_tenant_folio_uidx
  on public.service_requests (tenant_id, folio);

alter table public.users enable row level security;

create or replace function public.create_tenant_transaction(
  p_user_id uuid,
  p_workshop_name text,
  p_slug_base text,
  p_email text,
  p_phone text
)
returns table (
  tenant_id uuid,
  tenant_slug text,
  trial_expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_tenant_id uuid;
  v_org_id uuid;
  v_trial_expires_at timestamptz := timezone('utc', now()) + interval '14 days';
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if p_workshop_name is null or btrim(p_workshop_name) = '' then
    raise exception 'p_workshop_name is required';
  end if;

  if p_slug_base is null or btrim(p_slug_base) = '' then
    raise exception 'p_slug_base is required';
  end if;

  v_slug := lower(regexp_replace(p_slug_base, '[^a-z0-9]+', '-', 'g'));
  v_slug := regexp_replace(v_slug, '(^-|-$)', '', 'g');

  if v_slug = '' then
    v_slug := 'taller';
  end if;

  while exists (select 1 from public.tenants where slug = v_slug) loop
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  end loop;

  v_tenant_id := gen_random_uuid();
  v_org_id := v_tenant_id;

  insert into public.tenants (
    id,
    name,
    slug,
    trial_expires_at,
    branding
  ) values (
    v_tenant_id,
    p_workshop_name,
    v_slug,
    v_trial_expires_at,
    jsonb_build_object(
      'primaryColor', '#0066ff',
      'secondaryColor', '#00cc99',
      'logoUrl', ''
    )
  )
  returning id into v_tenant_id;

  insert into public.organizations (
    id,
    name,
    slug,
    subscription_status
  ) values (
    v_org_id,
    p_workshop_name,
    v_slug,
    'trial'
  )
  on conflict (id) do update
  set name = excluded.name,
      slug = excluded.slug,
      subscription_status = excluded.subscription_status;

  insert into public.users (
    tenant_id,
    auth_user_id,
    full_name,
    email,
    phone,
    role,
    is_active
  ) values (
    v_tenant_id,
    p_user_id,
    p_workshop_name,
    p_email,
    p_phone,
    'owner',
    true
  );

  tenant_id := v_tenant_id;
  tenant_slug := v_slug;
  trial_expires_at := v_trial_expires_at;
  return next;
end;
$$;

revoke all on function public.create_tenant_transaction(uuid, text, text, text, text) from public;
grant execute on function public.create_tenant_transaction(uuid, text, text, text, text) to service_role;

alter table public.tenants enable row level security;

drop policy if exists tenants_select_same_tenant on public.tenants;
create policy tenants_select_same_tenant
on public.tenants
for select
using ((auth.jwt() ->> 'tenant_id')::uuid = id);

drop policy if exists tenants_insert_owner on public.tenants;
create policy tenants_insert_owner
on public.tenants
for insert
with check (auth.jwt() ->> 'role' = 'owner');

drop policy if exists tenants_update_owner on public.tenants;
create policy tenants_update_owner
on public.tenants
for update
using (
  (auth.jwt() ->> 'tenant_id')::uuid = id
  and auth.jwt() ->> 'role' = 'owner'
)
with check (
  (auth.jwt() ->> 'tenant_id')::uuid = id
  and auth.jwt() ->> 'role' = 'owner'
);

drop policy if exists tenants_delete_owner on public.tenants;
create policy tenants_delete_owner
on public.tenants
for delete
using (
  (auth.jwt() ->> 'tenant_id')::uuid = id
  and auth.jwt() ->> 'role' = 'owner'
);
