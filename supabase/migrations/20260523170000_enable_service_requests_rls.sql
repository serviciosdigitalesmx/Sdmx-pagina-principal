begin;

alter table public.service_requests enable row level security;

-- Keep the table aligned with the tenant JWT contract used across the API.
drop policy if exists service_requests_select on public.service_requests;
create policy service_requests_select
on public.service_requests
for select
to authenticated
using (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
);

drop policy if exists service_requests_insert_tenant on public.service_requests;
create policy service_requests_insert_tenant
on public.service_requests
for insert
to authenticated
with check (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
);

drop policy if exists service_requests_update_tenant on public.service_requests;
create policy service_requests_update_tenant
on public.service_requests
for update
to authenticated
using (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
)
with check (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
);

drop policy if exists service_requests_delete_tenant on public.service_requests;
create policy service_requests_delete_tenant
on public.service_requests
for delete
to authenticated
using (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
);

grant select, insert, update, delete on table public.service_requests to authenticated, service_role;

commit;
