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
  v_tenant_name text;
  v_tenant_slug text;
  v_tenant_id uuid;
  v_branch_id uuid;
  v_full_name text;
  v_email text;
  v_trial_ends_at timestamptz;
  v_billing_exempt boolean;
begin
  v_email := coalesce(new.email, '');
  v_billing_exempt := coalesce((new.raw_user_meta_data ->> 'billing_exempt')::boolean, false);
  v_full_name := nullif(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), '');
  v_tenant_name := nullif(coalesce(new.raw_user_meta_data ->> 'shop_name', new.raw_user_meta_data ->> 'tenant_name', v_full_name, split_part(v_email, '@', 1), 'Default Shop'), '');
  v_tenant_slug := nullif(coalesce(new.raw_user_meta_data ->> 'tenant_slug', new.raw_user_meta_data ->> 'shop_slug', regexp_replace(lower(coalesce(new.raw_user_meta_data ->> 'shop_name', split_part(v_email, '@', 1), 'default')), '[^a-z0-9]+', '-', 'g')), '');

  insert into public.tenants (id, name, slug, billing_exempt)
  values (gen_random_uuid(), v_tenant_name, v_tenant_slug, v_billing_exempt)
  on conflict (slug) do update set name = excluded.name, billing_exempt = excluded.billing_exempt
  returning id into v_tenant_id;

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
