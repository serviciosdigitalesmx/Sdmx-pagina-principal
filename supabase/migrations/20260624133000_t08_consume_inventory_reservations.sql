begin;

create unique index if not exists inventory_movements_tenant_consumption_idempotency_idx
  on public.inventory_movements (tenant_id, reference)
  where movement_type = 'service_order_consumed';

create or replace function public.consume_inventory_reservation(
  p_tenant_id uuid,
  p_reservation_id uuid,
  p_quantity numeric,
  p_idempotency_key text,
  p_consumed_by uuid,
  p_request_id text,
  p_consume_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.inventory_reservations%rowtype;
  v_inventory public.sucursal_inventory%rowtype;
  v_inventory_after public.sucursal_inventory%rowtype;
  v_product public.products%rowtype;
  v_existing_movement public.inventory_movements%rowtype;
  v_reservation_remaining numeric(12,2);
  v_stock_before numeric(12,2);
  v_stock_after numeric(12,2);
  v_consumed_after numeric(12,2);
  v_status text;
begin
  if p_tenant_id is null then raise exception 'p_tenant_id is required'; end if;
  if p_reservation_id is null then raise exception 'p_reservation_id is required'; end if;
  if coalesce(p_quantity, 0) <= 0 then raise exception 'p_quantity must be greater than zero'; end if;
  if nullif(trim(coalesce(p_idempotency_key, '')), '') is null then raise exception 'p_idempotency_key is required'; end if;
  if nullif(trim(coalesce(p_request_id, '')), '') is null then raise exception 'p_request_id is required'; end if;

  select *
    into v_existing_movement
    from public.inventory_movements
   where tenant_id = p_tenant_id
     and reference = p_idempotency_key
     and movement_type = 'service_order_consumed'
   limit 1;

  if found then
    select *
      into v_reservation
      from public.inventory_reservations
     where tenant_id = p_tenant_id
       and id = p_reservation_id
     limit 1;

    return jsonb_build_object(
      'reservation_id', v_reservation.id,
      'inventory_movement_id', v_existing_movement.id,
      'service_order_id', v_reservation.service_order_id,
      'product_id', v_reservation.product_id,
      'sucursal_id', v_reservation.sucursal_id,
      'consumed_quantity', p_quantity,
      'remaining_quantity', greatest(coalesce(v_reservation.reserved_quantity, 0) - coalesce(v_reservation.consumed_quantity, 0) - coalesce(v_reservation.released_quantity, 0), 0),
      'stock_before', null,
      'stock_after', null,
      'status', v_reservation.status,
      'idempotent_replay', true
    );
  end if;

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
    raise exception 'Reservation is not consumable';
  end if;

  v_reservation_remaining := coalesce(v_reservation.reserved_quantity, 0) - coalesce(v_reservation.consumed_quantity, 0) - coalesce(v_reservation.released_quantity, 0);
  if p_quantity > v_reservation_remaining then
    raise exception 'Consumption exceeds remaining reservation';
  end if;

  select *
    into v_inventory
    from public.sucursal_inventory
   where tenant_id = p_tenant_id
     and sucursal_id = v_reservation.sucursal_id
     and product_id = v_reservation.product_id
   for update;

  if not found then
    raise exception 'Inventory row not found';
  end if;

  v_stock_before := coalesce(v_inventory.stock_current, 0);
  if v_stock_before < p_quantity then
    raise exception 'Insufficient stock';
  end if;

  update public.sucursal_inventory
     set stock_current = stock_current - p_quantity,
         updated_at = timezone('utc', now())
   where id = v_inventory.id
   returning * into v_inventory_after;

  if v_inventory_after.stock_current < 0 then
    raise exception 'Stock cannot be negative';
  end if;

  update public.inventory_reservations
     set consumed_quantity = consumed_quantity + p_quantity,
         consumed_by = p_consumed_by,
         consumed_at = timezone('utc', now()),
         status = case
           when consumed_quantity + p_quantity + released_quantity >= reserved_quantity then 'consumed'
           else 'partial'
         end,
         updated_at = timezone('utc', now())
   where id = v_reservation.id
   returning * into v_reservation;

  select *
    into v_product
    from public.products
   where tenant_id = p_tenant_id
     and id = v_reservation.product_id
   limit 1;

  insert into public.inventory_movements (
    tenant_id,
    sucursal_id,
    product_id,
    service_order_id,
    movement_type,
    quantity,
    unit_cost,
    reference,
    notes,
    created_by
  ) values (
    p_tenant_id,
    v_reservation.sucursal_id,
    v_reservation.product_id,
    v_reservation.service_order_id,
    'service_order_consumed',
    p_quantity,
    coalesce(v_product.cost, 0),
    p_idempotency_key,
    p_consume_reason,
    p_consumed_by
  )
  returning id into v_existing_movement.id;

  v_consumed_after := coalesce(v_reservation.consumed_quantity, 0);
  v_stock_after := coalesce(v_inventory_after.stock_current, 0);
  v_status := v_reservation.status;

  insert into public.audit_logs (
    tenant_id,
    user_id,
    action,
    request_id,
    data_after
  ) values (
    p_tenant_id,
    p_consumed_by,
    'inventory.reservation.consumed',
    p_request_id,
    jsonb_build_object(
      'reservation_id', v_reservation.id,
      'service_order_id', v_reservation.service_order_id,
      'product_id', v_reservation.product_id,
      'sucursal_id', v_reservation.sucursal_id,
      'quantity', p_quantity,
      'idempotency_key', p_idempotency_key,
      'stock_before', v_stock_before,
      'stock_after', v_stock_after
    )
  );

  return jsonb_build_object(
    'reservation_id', v_reservation.id,
    'inventory_movement_id', v_existing_movement.id,
    'service_order_id', v_reservation.service_order_id,
    'product_id', v_reservation.product_id,
    'sucursal_id', v_reservation.sucursal_id,
    'consumed_quantity', p_quantity,
    'remaining_quantity', greatest(v_reservation_remaining - p_quantity, 0),
    'stock_before', v_stock_before,
    'stock_after', v_stock_after,
    'status', v_status,
    'idempotent_replay', false
  );
end;
$$;

revoke all on function public.consume_inventory_reservation(uuid, uuid, numeric, text, uuid, text, text) from public;
grant execute on function public.consume_inventory_reservation(uuid, uuid, numeric, text, uuid, text, text) to service_role;

commit;
