begin;

create table if not exists public.service_order_warranties (
  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null references public.tenants(id) on delete cascade,

  original_order_id uuid not null references public.service_orders(id) on delete cascade,
  claim_order_id uuid references public.service_orders(id) on delete set null,

  warranty_until date,
  eligibility_status text not null default 'unknown',
  status text not null default 'open',
  coverage_scope text not null default 'full',

  claim_reason text not null,
  reported_issue text,
  requested_resolution text,
  resolution_notes text,

  created_by uuid references public.users(id) on delete set null,
  approved_by uuid references public.users(id) on delete set null,
  rejected_by uuid references public.users(id) on delete set null,
  resolved_by uuid references public.users(id) on delete set null,
  cancelled_by uuid references public.users(id) on delete set null,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  approved_at timestamptz,
  rejected_at timestamptz,
  resolved_at timestamptz,
  cancelled_at timestamptz,

  constraint service_order_warranties_eligibility_status_check
    check (eligibility_status in ('active', 'expired', 'no_warranty', 'unknown')),
  constraint service_order_warranties_status_check
    check (status in ('open', 'under_review', 'approved', 'rejected', 'resolved', 'cancelled')),
  constraint service_order_warranties_coverage_scope_check
    check (coverage_scope in ('full', 'labor', 'parts', 'diagnosis', 'other')),
  constraint service_order_warranties_claim_reason_check
    check (btrim(claim_reason) <> '')
);

create unique index if not exists service_order_warranties_tenant_claim_order_unique_idx
  on public.service_order_warranties (tenant_id, claim_order_id)
  where claim_order_id is not null;

create index if not exists service_order_warranties_original_order_idx
  on public.service_order_warranties (tenant_id, original_order_id, created_at desc);

create index if not exists service_order_warranties_status_idx
  on public.service_order_warranties (tenant_id, status, created_at desc);

create index if not exists service_order_warranties_claim_order_idx
  on public.service_order_warranties (tenant_id, claim_order_id)
  where claim_order_id is not null;

alter table public.service_order_warranties enable row level security;

revoke all on public.service_order_warranties from anon;
revoke all on public.service_order_warranties from authenticated;

grant select, insert, update, delete on public.service_order_warranties to service_role;

create or replace function public.create_service_order_warranty_claim(
  p_tenant_id uuid,
  p_original_order_id uuid,
  p_claim_order_id uuid default null,
  p_claim_reason text default null,
  p_reported_issue text default null,
  p_requested_resolution text default null,
  p_coverage_scope text default 'full',
  p_created_by uuid default null,
  p_request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_original_order public.service_orders%rowtype;
  v_claim_order public.service_orders%rowtype;
  v_claim public.service_order_warranties%rowtype;
  v_warranty_until date;
  v_eligibility_status text;
begin
  if p_tenant_id is null then raise exception 'p_tenant_id is required'; end if;
  if p_original_order_id is null then raise exception 'p_original_order_id is required'; end if;
  if nullif(btrim(coalesce(p_claim_reason, '')), '') is null then raise exception 'p_claim_reason is required'; end if;
  if nullif(btrim(coalesce(p_request_id, '')), '') is null then raise exception 'p_request_id is required'; end if;
  if coalesce(p_coverage_scope, 'full') not in ('full', 'labor', 'parts', 'diagnosis', 'other') then
    raise exception 'Invalid coverage scope';
  end if;

  select *
    into v_original_order
    from public.service_orders
   where tenant_id = p_tenant_id
     and id = p_original_order_id
   limit 1;

  if not found then
    raise exception 'Original order not found';
  end if;

  if p_claim_order_id is not null then
    if p_claim_order_id = p_original_order_id then
      raise exception 'Claim order cannot be the original order';
    end if;

    select *
      into v_claim_order
      from public.service_orders
     where tenant_id = p_tenant_id
       and id = p_claim_order_id
     limit 1;

    if not found then
      raise exception 'Claim order not found';
    end if;
  end if;

  v_warranty_until := v_original_order.warranty_until::date;
  v_eligibility_status := case
    when v_warranty_until is null then 'no_warranty'
    when v_warranty_until >= current_date then 'active'
    else 'expired'
  end;

  insert into public.service_order_warranties (
    tenant_id,
    original_order_id,
    claim_order_id,
    warranty_until,
    eligibility_status,
    status,
    coverage_scope,
    claim_reason,
    reported_issue,
    requested_resolution,
    created_by
  ) values (
    p_tenant_id,
    p_original_order_id,
    p_claim_order_id,
    v_warranty_until,
    v_eligibility_status,
    'open',
    coalesce(p_coverage_scope, 'full'),
    btrim(p_claim_reason),
    nullif(btrim(coalesce(p_reported_issue, '')), ''),
    nullif(btrim(coalesce(p_requested_resolution, '')), ''),
    p_created_by
  )
  returning * into v_claim;

  insert into public.service_order_events (
    tenant_id,
    service_order_id,
    event_type,
    previous_status,
    new_status,
    note,
    actor_name,
    created_by
  ) values (
    p_tenant_id,
    p_original_order_id,
    'warranty_claim_created',
    null,
    v_claim.status,
    v_claim.claim_reason,
    null,
    p_created_by
  );

  if p_claim_order_id is not null then
    insert into public.service_order_events (
      tenant_id,
      service_order_id,
      event_type,
      previous_status,
      new_status,
      note,
      actor_name,
      created_by
    ) values (
      p_tenant_id,
      p_claim_order_id,
      'warranty_claim_linked',
      null,
      v_claim.status,
      'Reclamo vinculado a garantía de orden origen',
      null,
      p_created_by
    );
  end if;

  insert into public.audit_logs (
    tenant_id,
    user_id,
    action,
    request_id,
    data_after
  ) values (
    p_tenant_id,
    p_created_by,
    'warranty.claim.created',
    p_request_id,
    jsonb_build_object(
      'claim_id', v_claim.id,
      'original_order_id', v_claim.original_order_id,
      'claim_order_id', v_claim.claim_order_id,
      'status', v_claim.status,
      'eligibility_status', v_claim.eligibility_status,
      'warranty_until', v_claim.warranty_until
    )
  );

  return jsonb_build_object(
    'claim_id', v_claim.id,
    'original_order_id', v_claim.original_order_id,
    'claim_order_id', v_claim.claim_order_id,
    'status', v_claim.status,
    'eligibility_status', v_claim.eligibility_status,
    'warranty_until', v_claim.warranty_until
  );
end;
$$;

create or replace function public.update_service_order_warranty_claim_status(
  p_tenant_id uuid,
  p_claim_id uuid,
  p_status text,
  p_resolution_notes text default null,
  p_actor_id uuid default null,
  p_request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim_before public.service_order_warranties%rowtype;
  v_claim_after public.service_order_warranties%rowtype;
begin
  if p_tenant_id is null then raise exception 'p_tenant_id is required'; end if;
  if p_claim_id is null then raise exception 'p_claim_id is required'; end if;
  if p_status not in ('under_review', 'approved', 'rejected', 'resolved', 'cancelled') then
    raise exception 'Invalid warranty claim status';
  end if;
  if nullif(btrim(coalesce(p_request_id, '')), '') is null then raise exception 'p_request_id is required'; end if;

  select *
    into v_claim_before
    from public.service_order_warranties
   where tenant_id = p_tenant_id
     and id = p_claim_id
   for update;

  if not found then
    raise exception 'Warranty claim not found';
  end if;

  if v_claim_before.status in ('resolved', 'cancelled') and v_claim_before.status <> p_status then
    raise exception 'Warranty claim is already final';
  end if;

  update public.service_order_warranties
     set status = p_status,
         resolution_notes = coalesce(nullif(btrim(coalesce(p_resolution_notes, '')), ''), resolution_notes),
         updated_at = timezone('utc', now()),
         approved_by = case when p_status = 'approved' then p_actor_id else approved_by end,
         approved_at = case when p_status = 'approved' then timezone('utc', now()) else approved_at end,
         rejected_by = case when p_status = 'rejected' then p_actor_id else rejected_by end,
         rejected_at = case when p_status = 'rejected' then timezone('utc', now()) else rejected_at end,
         resolved_by = case when p_status = 'resolved' then p_actor_id else resolved_by end,
         resolved_at = case when p_status = 'resolved' then timezone('utc', now()) else resolved_at end,
         cancelled_by = case when p_status = 'cancelled' then p_actor_id else cancelled_by end,
         cancelled_at = case when p_status = 'cancelled' then timezone('utc', now()) else cancelled_at end
   where id = v_claim_before.id
   returning * into v_claim_after;

  insert into public.service_order_events (
    tenant_id,
    service_order_id,
    event_type,
    previous_status,
    new_status,
    note,
    actor_name,
    created_by
  ) values (
    p_tenant_id,
    v_claim_after.original_order_id,
    'warranty_claim_status_updated',
    v_claim_before.status,
    v_claim_after.status,
    v_claim_after.resolution_notes,
    null,
    p_actor_id
  );

  if v_claim_after.claim_order_id is not null then
    insert into public.service_order_events (
      tenant_id,
      service_order_id,
      event_type,
      previous_status,
      new_status,
      note,
      actor_name,
      created_by
    ) values (
      p_tenant_id,
      v_claim_after.claim_order_id,
      'warranty_claim_status_updated',
      v_claim_before.status,
      v_claim_after.status,
      v_claim_after.resolution_notes,
      null,
      p_actor_id
    );
  end if;

  insert into public.audit_logs (
    tenant_id,
    user_id,
    action,
    request_id,
    data_before,
    data_after
  ) values (
    p_tenant_id,
    p_actor_id,
    'warranty.claim.status_updated',
    p_request_id,
    to_jsonb(v_claim_before),
    to_jsonb(v_claim_after)
  );

  return jsonb_build_object(
    'claim_id', v_claim_after.id,
    'status', v_claim_after.status,
    'original_order_id', v_claim_after.original_order_id,
    'claim_order_id', v_claim_after.claim_order_id,
    'updated_at', v_claim_after.updated_at
  );
end;
$$;

revoke all on function public.create_service_order_warranty_claim(uuid, uuid, uuid, text, text, text, text, uuid, text) from public;
revoke all on function public.update_service_order_warranty_claim_status(uuid, uuid, text, text, uuid, text) from public;

grant execute on function public.create_service_order_warranty_claim(uuid, uuid, uuid, text, text, text, text, uuid, text) to service_role;
grant execute on function public.update_service_order_warranty_claim_status(uuid, uuid, text, text, uuid, text) to service_role;

commit;
