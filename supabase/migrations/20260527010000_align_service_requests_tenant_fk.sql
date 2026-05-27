begin;

alter table public.service_requests
  drop constraint if exists service_requests_tenant_id_fkey;

alter table public.service_requests
  add constraint service_requests_tenant_id_fkey
  foreign key (tenant_id)
  references public.tenants(id)
  on delete cascade;

alter table public.service_requests
  alter column tenant_id set not null;

alter table public.service_requests enable row level security;

drop policy if exists service_requests_select on public.service_requests;
create policy service_requests_select
on public.service_requests
for select
to authenticated
using ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id);

drop policy if exists service_requests_insert_tenant on public.service_requests;
create policy service_requests_insert_tenant
on public.service_requests
for insert
to authenticated
with check ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id);

drop policy if exists service_requests_update_tenant on public.service_requests;
create policy service_requests_update_tenant
on public.service_requests
for update
to authenticated
using ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id)
with check ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id);

drop policy if exists service_requests_delete_tenant on public.service_requests;
create policy service_requests_delete_tenant
on public.service_requests
for delete
to authenticated
using ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id);

grant select, insert, update, delete on table public.service_requests to authenticated, service_role;

commit;
