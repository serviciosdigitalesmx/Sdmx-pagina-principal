begin;

do $$
declare
  v_tenant_id uuid;
begin
  select t.id
    into v_tenant_id
  from public.tenants t
  where lower(t.name) = 'srfix' or lower(t.slug) = 'srfix'
  limit 1;

  if v_tenant_id is null then
    raise exception 'No se encontró el tenant Srfix';
  end if;

  update public.tenants
  set billing_exempt = true
  where id = v_tenant_id;

  update public.shops
  set billing_exempt = true
  where id = v_tenant_id;

  update auth.users u
  set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('tenant_id', v_tenant_id::text)
  where exists (
    select 1
    from public.users p
    where p.auth_user_id = u.id
      and p.tenant_id = v_tenant_id
  );

  update public.users
  set tenant_id = v_tenant_id
  where tenant_id = v_tenant_id;
end $$;

create or replace function public.bootstrap_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_tenant_name text;
  v_tenant_slug text;
  v_branch_id uuid;
  v_full_name text;
  v_email text;
  v_trial_ends_at timestamptz;
  v_billing_exempt boolean;
begin
  v_email := coalesce(new.email, '');
  v_tenant_id := nullif(coalesce(new.raw_app_meta_data ->> 'tenant_id', new.raw_user_meta_data ->> 'tenant_id'), '')::uuid;
  if v_tenant_id is null then
    raise exception 'auth.users.app_metadata.tenant_id es obligatorio';
  end if;

  v_billing_exempt := coalesce((new.raw_user_meta_data ->> 'billing_exempt')::boolean, false);
  v_full_name := nullif(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), '');

  select t.name, t.slug
    into v_tenant_name, v_tenant_slug
  from public.tenants t
  where t.id = v_tenant_id;

  if v_tenant_name is null or btrim(v_tenant_name) = '' then
    raise exception 'El tenant no existe o no tiene nombre';
  end if;

  if v_tenant_slug is null or btrim(v_tenant_slug) = '' then
    raise exception 'El tenant no existe o no tiene slug';
  end if;

  insert into public.shops (id, name, slug, billing_exempt)
  values (v_tenant_id, v_tenant_name, v_tenant_slug, coalesce((select billing_exempt from public.tenants where id = v_tenant_id), false))
  on conflict (id) do update
    set name = excluded.name,
        slug = excluded.slug,
        billing_exempt = excluded.billing_exempt;

  select public.ensure_tenant_default_branch(v_tenant_id, v_tenant_name)
    into v_branch_id;

  insert into public.users (id, auth_user_id, tenant_id, full_name, email, is_active)
  values (
    gen_random_uuid(),
    new.id,
    v_tenant_id,
    coalesce(v_full_name, v_tenant_name),
    v_email,
    true
  )
  on conflict (auth_user_id) do update
    set tenant_id = excluded.tenant_id,
        full_name = excluded.full_name,
        email = excluded.email,
        is_active = true;

  update public.users
  set branch_id = coalesce(branch_id, v_branch_id)
  where auth_user_id = new.id;

  perform public.sync_user_auth_metadata(new.id, v_tenant_id);

  insert into public.subscriptions (tenant_id, plan, status, provider, external_id, current_period_end, raw_payload)
  values (
    v_tenant_id,
    'enterprise',
    case when coalesce((select billing_exempt from public.tenants where id = v_tenant_id), false) then 'active' else 'trialing' end,
    'trial',
    case when coalesce((select billing_exempt from public.tenants where id = v_tenant_id), false) then 'lifetime_' || v_tenant_id::text else 'trial_' || v_tenant_id::text end,
    case when coalesce((select billing_exempt from public.tenants where id = v_tenant_id), false) then null else now() + make_interval(days => coalesce(nullif(current_setting('app.trial_days', true), '')::int, 15)) end,
    jsonb_build_object(
      'billingExempt', coalesce((select billing_exempt from public.tenants where id = v_tenant_id), false),
      'trialStartedAt', now(),
      'trialEndsAt', case when coalesce((select billing_exempt from public.tenants where id = v_tenant_id), false) then null else now() + make_interval(days => coalesce(nullif(current_setting('app.trial_days', true), '')::int, 15)) end
    )
  )
  on conflict (tenant_id, provider) do update
    set plan = excluded.plan,
        status = excluded.status,
        external_id = excluded.external_id,
        current_period_end = excluded.current_period_end,
        raw_payload = excluded.raw_payload,
        updated_at = now();

  return new;
end;
$$;

commit;
