begin;

alter table if exists public.audit_logs
  add column if not exists request_id text;

create table if not exists public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sucursal_id uuid not null references public.sucursales(id) on delete restrict,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  reserved_quantity numeric(12,2) not null,
  consumed_quantity numeric(12,2) not null default 0,
  released_quantity numeric(12,2) not null default 0,
  status text not null default 'active',
  idempotency_key text not null,
  reservation_reason text,
  reserved_by uuid references public.users(id) on delete set null,
  consumed_by uuid references public.users(id) on delete set null,
  released_by uuid references public.users(id) on delete set null,
  reserved_at timestamptz not null default timezone('utc', now()),
  consumed_at timestamptz,
  released_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint inventory_reservations_reserved_quantity_check check (reserved_quantity > 0),
  constraint inventory_reservations_consumed_quantity_check check (consumed_quantity >= 0),
  constraint inventory_reservations_released_quantity_check check (released_quantity >= 0),
  constraint inventory_reservations_quantity_balance_check check (consumed_quantity + released_quantity <= reserved_quantity),
  constraint inventory_reservations_status_check check (status in ('active', 'partial', 'consumed', 'released', 'cancelled', 'expired'))
);

create unique index if not exists inventory_reservations_tenant_idempotency_idx
  on public.inventory_reservations (tenant_id, idempotency_key);

create unique index if not exists inventory_reservations_active_order_product_idx
  on public.inventory_reservations (tenant_id, service_order_id, product_id)
  where status in ('active', 'partial');

create index if not exists inventory_reservations_stock_lookup_idx
  on public.inventory_reservations (tenant_id, sucursal_id, product_id, status);

create index if not exists inventory_reservations_order_idx
  on public.inventory_reservations (tenant_id, service_order_id, status, created_at desc);

alter table public.inventory_reservations enable row level security;

revoke all on public.inventory_reservations from anon;
revoke all on public.inventory_reservations from authenticated;

grant select, insert, update, delete on public.inventory_reservations to service_role;

create or replace function public.reserve_inventory_for_order(
  p_tenant_id uuid,
  p_service_order_id uuid,
  p_product_id uuid,
  p_quantity numeric,
  p_idempotency_key text,
  p_reserved_by uuid,
  p_request_id text,
  p_reservation_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.service_orders%rowtype;
  v_inventory public.sucursal_inventory%rowtype;
  v_existing public.inventory_reservations%rowtype;
  v_reservation public.inventory_reservations%rowtype;
  v_reserved_total numeric(12,2);
  v_available_before numeric(12,2);
  v_available_after numeric(12,2);
begin
  if p_tenant_id is null then raise exception 'p_tenant_id is required'; end if;
  if p_service_order_id is null then raise exception 'p_service_order_id is required'; end if;
  if p_product_id is null then raise exception 'p_product_id is required'; end if;
  if coalesce(p_quantity, 0) <= 0 then raise exception 'p_quantity must be greater than zero'; end if;
  if nullif(trim(coalesce(p_idempotency_key, '')), '') is null then raise exception 'p_idempotency_key is required'; end if;
  if nullif(trim(coalesce(p_request_id, '')), '') is null then raise exception 'p_request_id is required'; end if;

  select *
    into v_order
    from public.service_orders
   where tenant_id = p_tenant_id
     and id = p_service_order_id
   for update;

  if not found then
    raise exception 'Service order not found';
  end if;

  select *
    into v_inventory
    from public.sucursal_inventory
   where tenant_id = p_tenant_id
     and sucursal_id = v_order.sucursal_id
     and product_id = p_product_id
   for update;

  if not found then
    raise exception 'Inventory row not found';
  end if;

  select *
    into v_existing
    from public.inventory_reservations
   where tenant_id = p_tenant_id
     and idempotency_key = p_idempotency_key
   limit 1;

  if found then
    return jsonb_build_object(
      'reservation_id', v_existing.id,
      'available_before', null,
      'available_after', null,
      'reserved_quantity', v_existing.reserved_quantity,
      'status', v_existing.status
    );
  end if;

  select coalesce(sum(reserved_quantity - consumed_quantity - released_quantity), 0)
    into v_reserved_total
    from public.inventory_reservations
   where tenant_id = p_tenant_id
     and sucursal_id = v_order.sucursal_id
     and product_id = p_product_id
     and status in ('active', 'partial');

  v_available_before := coalesce(v_inventory.stock_current, 0) - coalesce(v_reserved_total, 0);
  if v_available_before < p_quantity then
    raise exception 'Insufficient available stock';
  end if;

  insert into public.inventory_reservations (
    tenant_id, sucursal_id, service_order_id, product_id,
    reserved_quantity, consumed_quantity, released_quantity,
    status, idempotency_key, reservation_reason, reserved_by
  ) values (
    p_tenant_id, v_order.sucursal_id, p_service_order_id, p_product_id,
    p_quantity, 0, 0,
    'active', p_idempotency_key, p_reservation_reason, p_reserved_by
  )
  on conflict (tenant_id, idempotency_key) do nothing
  returning * into v_reservation;

  if not found then
    select *
      into v_existing
      from public.inventory_reservations
     where tenant_id = p_tenant_id
       and idempotency_key = p_idempotency_key
     limit 1;

    return jsonb_build_object(
      'reservation_id', v_existing.id,
      'available_before', null,
      'available_after', null,
      'reserved_quantity', v_existing.reserved_quantity,
      'status', v_existing.status
    );
  end if;

  v_available_after := v_available_before - p_quantity;

  insert into public.audit_logs (
    tenant_id, user_id, action, request_id, data_after
  ) values (
    p_tenant_id, p_reserved_by, 'inventory.reservation.created', p_request_id,
    jsonb_build_object(
      'service_order_id', p_service_order_id,
      'product_id', p_product_id,
      'quantity', p_quantity,
      'sucursal_id', v_order.sucursal_id,
      'idempotency_key', p_idempotency_key
    )
  );

  return jsonb_build_object(
    'reservation_id', v_reservation.id,
    'available_before', v_available_before,
    'available_after', v_available_after,
    'reserved_quantity', v_reservation.reserved_quantity,
    'status', v_reservation.status
  );
end;
$$;

create or replace function public.release_inventory_reservation(
  p_tenant_id uuid,
  p_reservation_id uuid,
  p_release_quantity numeric,
  p_released_by uuid,
  p_request_id text,
  p_release_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.inventory_reservations%rowtype;
  v_remaining numeric(12,2);
begin
  if p_tenant_id is null then raise exception 'p_tenant_id is required'; end if;
  if p_reservation_id is null then raise exception 'p_reservation_id is required'; end if;
  if coalesce(p_release_quantity, 0) <= 0 then raise exception 'p_release_quantity must be greater than zero'; end if;
  if nullif(trim(coalesce(p_request_id, '')), '') is null then raise exception 'p_request_id is required'; end if;

  select *
    into v_reservation
    from public.inventory_reservations
   where tenant_id = p_tenant_id
     and id = p_reservation_id
   for update;

  if not found then
    raise exception 'Reservation not found';
  end if;

  if v_reservation.status not in ('active', 'partial') then
    raise exception 'Reservation is not releasable';
  end if;

  v_remaining := coalesce(v_reservation.reserved_quantity, 0) - coalesce(v_reservation.consumed_quantity, 0) - coalesce(v_reservation.released_quantity, 0);
  if p_release_quantity > v_remaining then
    raise exception 'Release quantity exceeds remaining reservation';
  end if;

  update public.inventory_reservations
     set released_quantity = released_quantity + p_release_quantity,
         released_at = timezone('utc', now()),
         released_by = p_released_by,
         status = case
           when released_quantity + p_release_quantity >= reserved_quantity then 'released'
           when consumed_quantity > 0 or released_quantity + p_release_quantity > 0 then 'partial'
           else status
         end,
         updated_at = timezone('utc', now())
   where id = v_reservation.id
   returning * into v_reservation;

  insert into public.audit_logs (
    tenant_id, user_id, action, request_id, data_after
  ) values (
    p_tenant_id, p_released_by, 'inventory.reservation.released', p_request_id,
    jsonb_build_object(
      'reservation_id', p_reservation_id,
      'release_quantity', p_release_quantity,
      'reason', p_release_reason
    )
  );

  return jsonb_build_object(
    'reservation_id', v_reservation.id,
    'released_quantity', p_release_quantity,
    'remaining_quantity', greatest(v_remaining - p_release_quantity, 0),
    'status', v_reservation.status
  );
end;
$$;

revoke all on function public.reserve_inventory_for_order(uuid, uuid, uuid, numeric, text, uuid, text, text) from public;
revoke all on function public.release_inventory_reservation(uuid, uuid, numeric, uuid, text, text) from public;
grant execute on function public.reserve_inventory_for_order(uuid, uuid, uuid, numeric, text, uuid, text, text) to service_role;
grant execute on function public.release_inventory_reservation(uuid, uuid, numeric, uuid, text, text) to service_role;

commit;
