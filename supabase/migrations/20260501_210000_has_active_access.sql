begin;

create or replace function public.has_active_access(p_tenant_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_billing_exempt boolean := false;
  v_status text;
  v_current_period_end timestamptz;
begin
  select coalesce(t.billing_exempt, false)
    into v_billing_exempt
  from public.tenants t
  where t.id = p_tenant_id;

  if v_billing_exempt then
    return true;
  end if;

  select s.status, s.current_period_end
    into v_status, v_current_period_end
  from public.subscriptions s
  where s.tenant_id = p_tenant_id
  order by s.created_at desc
  limit 1;

  if v_status = 'active' and v_current_period_end is not null and now() <= v_current_period_end then
    return true;
  end if;

  if v_status = 'trialing' and v_current_period_end is not null and now() <= v_current_period_end then
    return true;
  end if;

  return false;
end;
$$;

comment on function public.has_active_access(uuid) is 'Single source of truth for tenant access: billing_exempt or a non-expired active/trial subscription.';

commit;
