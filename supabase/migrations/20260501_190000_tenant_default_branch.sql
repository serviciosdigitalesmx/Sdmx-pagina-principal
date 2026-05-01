begin;

create or replace function public.ensure_tenant_default_branch(p_tenant_id uuid, p_tenant_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_branch_id uuid;
  v_branch_code text;
  v_branch_name text;
begin
  select id
    into v_branch_id
  from public.branches
  where tenant_id = p_tenant_id
  order by created_at asc
  limit 1;

  if v_branch_id is not null then
    return v_branch_id;
  end if;

  v_branch_code := 'MAIN';
  v_branch_name := coalesce(nullif(trim(p_tenant_name), ''), 'Sucursal principal');

  insert into public.branches (tenant_id, code, name)
  values (p_tenant_id, v_branch_code, v_branch_name)
  on conflict (tenant_id, code) do update
    set name = excluded.name
  returning id into v_branch_id;

  return v_branch_id;
end;
$$;

update public.users u
set branch_id = b.branch_id
from (
  select t.id as tenant_id, public.ensure_tenant_default_branch(t.id, t.name) as branch_id
  from public.tenants t
) b
where u.tenant_id = b.tenant_id
  and u.branch_id is null;

do $$
declare
  t record;
begin
  for t in select id, name from public.tenants loop
    perform public.ensure_tenant_default_branch(t.id, t.name);
  end loop;
end $$;

commit;
