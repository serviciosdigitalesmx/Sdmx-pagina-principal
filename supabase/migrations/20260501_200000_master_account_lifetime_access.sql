begin;

do $$
begin
  update public.tenants t
  set billing_exempt = true
  where exists (
    select 1
    from public.subscriptions s
    where s.tenant_id = t.id
      and (
        s.external_id = 'lifetime_master'
        or coalesce((s.raw_payload ->> 'billingExempt')::boolean, false) = true
      )
  );
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
  v_billing_exempt := coalesce((select billing_exempt from public.tenants where id = v_tenant_id), false);
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
  values (v_tenant_id, v_tenant_name, v_tenant_slug, v_billing_exempt)
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
    case when v_billing_exempt then 'active' else 'trialing' end,
    'trial',
    case when v_billing_exempt then 'lifetime_' || v_tenant_id::text else 'trial_' || v_tenant_id::text end,
    case when v_billing_exempt then null else now() + make_interval(days => coalesce(nullif(current_setting('app.trial_days', true), '')::int, 15)) end,
    jsonb_build_object(
      'billingExempt', v_billing_exempt,
      'trialStartedAt', now(),
      'trialEndsAt', case when v_billing_exempt then null else now() + make_interval(days => coalesce(nullif(current_setting('app.trial_days', true), '')::int, 15)) end
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
