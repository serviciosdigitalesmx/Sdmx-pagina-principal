begin;

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
begin
  v_email := coalesce(new.email, '');
  v_full_name := nullif(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), '');
  v_tenant_name := nullif(coalesce(new.raw_user_meta_data ->> 'shop_name', new.raw_user_meta_data ->> 'tenant_name', v_full_name, split_part(v_email, '@', 1), 'Default Shop'), '');
  v_tenant_slug := nullif(coalesce(new.raw_user_meta_data ->> 'tenant_slug', new.raw_user_meta_data ->> 'shop_slug', regexp_replace(lower(coalesce(new.raw_user_meta_data ->> 'shop_name', split_part(v_email, '@', 1), 'default')), '[^a-z0-9]+', '-', 'g')), '');

  insert into public.tenants (id, name, slug)
  values (gen_random_uuid(), v_tenant_name, v_tenant_slug)
  on conflict (slug) do update set name = excluded.name
  returning id into v_tenant_id;

  insert into public.shops (id, name, slug, billing_exempt)
  values (v_tenant_id, v_tenant_name, v_tenant_slug, false)
  on conflict (id) do update set name = excluded.name, slug = excluded.slug;

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
    'trialing',
    'trial',
    'trial_' || v_tenant_id::text,
    now() + make_interval(days => coalesce(nullif(current_setting('app.trial_days', true), '')::int, 15)),
    jsonb_build_object(
      'trialStartedAt', now(),
      'trialEndsAt', now() + make_interval(days => coalesce(nullif(current_setting('app.trial_days', true), '')::int, 15))
    )
  )
  on conflict (tenant_id, provider) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.bootstrap_auth_user();

commit;
