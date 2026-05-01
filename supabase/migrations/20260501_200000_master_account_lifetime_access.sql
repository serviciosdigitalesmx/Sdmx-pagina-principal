begin;

do $$
declare
  v_master_email text := lower('srfix@taller.com');
  v_auth_user_id uuid;
  v_tenant_id uuid;
  v_shop_name text;
  v_shop_slug text;
  v_now timestamptz := now();
begin
  select au.id into v_auth_user_id
  from auth.users au
  where lower(coalesce(au.email, '')) = v_master_email
  order by au.created_at asc
  limit 1;

  if v_auth_user_id is null then
    return;
  end if;

  select u.tenant_id into v_tenant_id
  from public.users u
  where u.auth_user_id = v_auth_user_id
  limit 1;

  if v_tenant_id is null then
    return;
  end if;

  select
    coalesce(u.full_name, split_part(lower(coalesce(au.email, '')), '@', 1), 'Fixi Master'),
    coalesce(t.slug, regexp_replace(lower(coalesce(au.email, '')), '[^a-z0-9]+', '-', 'g'))
  into v_shop_name, v_shop_slug
  from auth.users au
  left join public.users u on u.auth_user_id = au.id
  left join public.tenants t on t.id = u.tenant_id
  where au.id = v_auth_user_id;

  update public.tenants
  set billing_exempt = true,
      name = coalesce(v_shop_name, name)
  where id = coalesce(
    (select tenant_id from public.users where auth_user_id = v_tenant_id limit 1),
    (select id from public.tenants where slug = v_shop_slug limit 1)
  );

  update public.shops
  set billing_exempt = true,
      name = coalesce(v_shop_name, name),
      slug = coalesce(v_shop_slug, slug)
  where id = coalesce(
    (select tenant_id from public.users where auth_user_id = v_tenant_id limit 1),
    (select id from public.tenants where slug = v_shop_slug limit 1)
  );

  insert into public.subscriptions (tenant_id, plan, status, provider, external_id, current_period_end, raw_payload)
  values (
    coalesce(
      (select tenant_id from public.users where auth_user_id = v_tenant_id limit 1),
      (select id from public.tenants where slug = v_shop_slug limit 1),
      v_tenant_id
    ),
    'enterprise',
    'active',
    'trial',
    'lifetime_master',
    null,
    jsonb_build_object(
      'masterAccount', true,
      'lifetimeAccess', true,
      'grantedAt', v_now,
      'grantedEmail', v_master_email
    )
  )
  on conflict (tenant_id, provider)
  do update set
    plan = excluded.plan,
    status = excluded.status,
    external_id = excluded.external_id,
    current_period_end = excluded.current_period_end,
    raw_payload = excluded.raw_payload,
    updated_at = now();

  update public.users
  set is_active = true
  where auth_user_id = v_auth_user_id;
end $$;

create or replace function public.bootstrap_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_name text;
  v_tenant_slug text;
  v_tenant_id uuid;
  v_branch_id uuid;
  v_full_name text;
  v_email text;
  v_trial_ends_at timestamptz;
  v_is_master boolean;
begin
  v_email := coalesce(new.email, '');
  v_is_master := lower(v_email) = 'srfix@taller.com';
  v_full_name := nullif(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), '');
  v_tenant_name := nullif(coalesce(new.raw_user_meta_data ->> 'shop_name', new.raw_user_meta_data ->> 'tenant_name', v_full_name, split_part(v_email, '@', 1), 'Default Shop'), '');
  v_tenant_slug := nullif(coalesce(new.raw_user_meta_data ->> 'tenant_slug', new.raw_user_meta_data ->> 'shop_slug', regexp_replace(lower(coalesce(new.raw_user_meta_data ->> 'shop_name', split_part(v_email, '@', 1), 'default')), '[^a-z0-9]+', '-', 'g')), '');

  insert into public.tenants (id, name, slug, billing_exempt)
  values (gen_random_uuid(), v_tenant_name, v_tenant_slug, v_is_master)
  on conflict (slug) do update set name = excluded.name, billing_exempt = excluded.billing_exempt
  returning id into v_tenant_id;

  insert into public.shops (id, name, slug, billing_exempt)
  values (v_tenant_id, v_tenant_name, v_tenant_slug, v_is_master)
  on conflict (id) do update set name = excluded.name, slug = excluded.slug, billing_exempt = excluded.billing_exempt;

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
    case when v_is_master then 'active' else 'trialing' end,
    case when v_is_master then 'trial' else 'trial' end,
    case when v_is_master then 'lifetime_master' else 'trial_' || v_tenant_id::text end,
    case when v_is_master then null else now() + make_interval(days => coalesce(nullif(current_setting('app.trial_days', true), '')::int, 15)) end,
    jsonb_build_object(
      'masterAccount', v_is_master,
      'trialStartedAt', now(),
      'trialEndsAt', case when v_is_master then null else now() + make_interval(days => coalesce(nullif(current_setting('app.trial_days', true), '')::int, 15)) end
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
