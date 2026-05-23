create table if not exists public.service_order_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  bucket_name text not null,
  storage_path text not null,
  public_url text,
  file_name text not null,
  file_type text not null,
  mime_type text,
  file_size bigint,
  source text not null default 'upload',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists service_order_documents_tenant_order_idx
  on public.service_order_documents (tenant_id, service_order_id, created_at desc);

create table if not exists public.service_order_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  event_type text not null,
  previous_status text,
  new_status text,
  note text,
  actor_name text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists service_order_events_tenant_order_idx
  on public.service_order_events (tenant_id, service_order_id, created_at desc);

alter table public.service_order_documents enable row level security;
alter table public.service_order_events enable row level security;

drop policy if exists service_order_documents_select on public.service_order_documents;
create policy service_order_documents_select
on public.service_order_documents
for select
using ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id);

drop policy if exists service_order_documents_write_owner_manager on public.service_order_documents;
create policy service_order_documents_write_owner_manager
on public.service_order_documents
for all
using ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id)
with check ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id);

drop policy if exists service_order_events_select on public.service_order_events;
create policy service_order_events_select
on public.service_order_events
for select
using ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id);

drop policy if exists service_order_events_write_owner_manager on public.service_order_events;
create policy service_order_events_write_owner_manager
on public.service_order_events
for all
using ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id)
with check ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id);

