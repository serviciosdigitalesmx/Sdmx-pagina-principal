create extension if not exists "pgcrypto";

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

  insert into public.tenants (
    name,
    slug,
    status,
    plan,
    contact_name,
    contact_email,
    contact_phone,
    trial_expires_at,
    branding
  ) values (
    p_workshop_name,
    v_slug,
    'active',
    'starter',
    p_workshop_name,
    p_email,
    p_phone,
    v_trial_expires_at,
    jsonb_build_object(
      'primaryColor', '#0066ff',
      'secondaryColor', '#00cc99',
      'logoUrl', ''
    )
  )
  returning id into v_tenant_id;

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
