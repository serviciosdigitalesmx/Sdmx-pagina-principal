begin;

-- CRM de-duplication per tenant.
create unique index if not exists customers_tenant_phone_uidx
  on public.customers (tenant_id, phone)
  where phone is not null and phone <> '';

create unique index if not exists customers_tenant_email_uidx
  on public.customers (tenant_id, lower(email))
  where email is not null and email <> '';

-- Support overdue-order and operational-risk queries.
create index if not exists service_orders_tenant_promised_status_idx
  on public.service_orders (tenant_id, promised_date, status);

create table if not exists public.service_order_status_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  previous_status text,
  new_status text not null,
  comment text,
  changed_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists service_order_status_history_tenant_order_idx
  on public.service_order_status_history (tenant_id, service_order_id, created_at desc);

create table if not exists public.customer_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  branch_id uuid,
  customer_id uuid references public.customers(id) on delete set null,
  service_order_id uuid references public.service_orders(id) on delete set null,
  service_request_id uuid references public.service_requests(id) on delete set null,
  payment_type text,
  amount numeric(12,2) not null default 0,
  payment_method text,
  reference text,
  notes text,
  paid_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists customer_payments_tenant_order_idx
  on public.customer_payments (tenant_id, service_order_id, paid_at desc);

create index if not exists purchase_order_items_tenant_po_idx
  on public.purchase_order_items (tenant_id, purchase_order_id, created_at desc);

alter table public.customer_payments
  add column if not exists source text not null default 'manual';

-- Supplier score validation.
update public.suppliers
set
  price_score = case when price_score is null or price_score < 1 then 1 when price_score > 5 then 5 else price_score end,
  speed_score = case when speed_score is null or speed_score < 1 then 1 when speed_score > 5 then 5 else speed_score end,
  quality_score = case when quality_score is null or quality_score < 1 then 1 when quality_score > 5 then 5 else quality_score end,
  reliability_score = case when reliability_score is null or reliability_score < 1 then 1 when reliability_score > 5 then 5 else reliability_score end;

alter table public.suppliers
  alter column price_score set default 1,
  alter column speed_score set default 1,
  alter column quality_score set default 1,
  alter column reliability_score set default 1;

alter table public.suppliers
  drop constraint if exists suppliers_price_score_check;
alter table public.suppliers
  add constraint suppliers_price_score_check check (price_score between 1 and 5);

alter table public.suppliers
  drop constraint if exists suppliers_speed_score_check;
alter table public.suppliers
  add constraint suppliers_speed_score_check check (speed_score between 1 and 5);

alter table public.suppliers
  drop constraint if exists suppliers_quality_score_check;
alter table public.suppliers
  add constraint suppliers_quality_score_check check (quality_score between 1 and 5);

alter table public.suppliers
  drop constraint if exists suppliers_reliability_score_check;
alter table public.suppliers
  add constraint suppliers_reliability_score_check check (reliability_score between 1 and 5);

-- Task domain integrity.
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  branch_id uuid,
  service_order_id uuid references public.service_orders(id) on delete set null,
  service_request_id uuid references public.service_requests(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'pendiente',
  priority text not null default 'media',
  assigned_user_id uuid references public.users(id) on delete set null,
  due_date timestamptz,
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.tasks
  drop constraint if exists tasks_status_check;
alter table public.tasks
  add constraint tasks_status_check check (status in ('pendiente', 'en_proceso', 'bloqueada', 'hecha'));

alter table public.tasks
  drop constraint if exists tasks_priority_check;
alter table public.tasks
  add constraint tasks_priority_check check (priority in ('baja', 'media', 'alta'));

-- Audit trail and automatic payment/history on order status transitions.
create or replace function public._sync_order_status_audit_and_payment()
returns trigger
language plpgsql
as $$
declare
  payment_amount numeric(12,2);
  order_sucursal_id uuid;
begin
  if tg_op = 'UPDATE' and coalesce(old.status, '') is distinct from coalesce(new.status, '') then
    insert into public.service_order_status_history (
      tenant_id,
      service_order_id,
      previous_status,
      new_status,
      comment,
      changed_by,
      created_at
    ) values (
      new.tenant_id,
      new.id,
      old.status,
      new.status,
      null,
      new.updated_by,
      timezone('utc', now())
    );

    if lower(coalesce(new.status, '')) in ('entregado', 'delivered') then
      payment_amount := coalesce(nullif(new.final_cost, 0), nullif(new.estimated_cost, 0), 0);
      order_sucursal_id := coalesce(new.sucursal_id, new.branch_id);

      if not exists (
        select 1
        from public.customer_payments p
        where p.tenant_id = new.tenant_id
          and p.service_order_id = new.id
          and coalesce(p.payment_type, '') = 'Entrega'
      ) then
        insert into public.customer_payments (
          tenant_id,
          branch_id,
          customer_id,
          service_order_id,
          service_request_id,
          payment_type,
          amount,
          payment_method,
          reference,
          notes,
          source,
          paid_at,
          created_by,
          created_at
        ) values (
          new.tenant_id,
          order_sucursal_id,
          new.customer_id,
          new.id,
          new.service_request_id,
          'Entrega',
          payment_amount,
          'Entrega',
          new.folio,
          'Cobro automático al entregar',
          'entrega_equipo',
          timezone('utc', now()),
          new.updated_by,
          timezone('utc', now())
        );
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_service_orders_status_audit_and_payment on public.service_orders;
create trigger trg_service_orders_status_audit_and_payment
after update of status on public.service_orders
for each row execute function public._sync_order_status_audit_and_payment();

-- RLS hardening for audit/session tables.
alter table if exists public.audit_logs enable row level security;
alter table if exists public.security_sessions enable row level security;
alter table if exists public.audit_logs force row level security;
alter table if exists public.security_sessions force row level security;

drop policy if exists audit_logs_select_owner on public.audit_logs;
create policy audit_logs_select_owner
on public.audit_logs
for select
to authenticated
using ((auth.jwt() ->> 'tenant_id')::uuid = tenant_id and coalesce(auth.jwt() ->> 'role', '') = 'owner');

drop policy if exists security_sessions_select_owner_manager on public.security_sessions;
create policy security_sessions_select_owner_manager
on public.security_sessions
for select
to authenticated
using (
  (auth.jwt() ->> 'tenant_id')::uuid = tenant_id
  and coalesce(auth.jwt() ->> 'role', '') in ('owner', 'manager')
);

commit;
