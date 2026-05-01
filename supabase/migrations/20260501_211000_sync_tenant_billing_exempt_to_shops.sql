begin;

update public.shops s
set billing_exempt = coalesce(t.billing_exempt, false)
from public.tenants t
where t.id = s.id;

create or replace function public.sync_tenant_billing_exempt_to_shops()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.shops
  set billing_exempt = new.billing_exempt
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists trg_sync_tenant_billing_exempt_to_shops on public.tenants;
create trigger trg_sync_tenant_billing_exempt_to_shops
after insert or update of billing_exempt on public.tenants
for each row execute function public.sync_tenant_billing_exempt_to_shops();

commit;
