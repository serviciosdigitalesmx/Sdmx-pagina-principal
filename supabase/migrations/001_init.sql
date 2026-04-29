create extension if not exists "pgcrypto";

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_at timestamptz not null default now()
);

alter table public.tenants add column if not exists slug text;
create unique index if not exists tenants_slug_unique on public.tenants (slug) where slug is not null;

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  stripe_price_id text unique,
  price_mxn integer,
  max_orders integer,
  limits jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status text not null check (status in ('trialing', 'active', 'past_due', 'canceled')),
  provider text not null check (provider in ('stripe', 'mercadopago', 'internal')),
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_one_active_or_trialing_per_tenant
  on public.subscriptions (tenant_id)
  where status in ('trialing', 'active');

create table if not exists public.webhook_events (
  id text primary key,
  processed_at timestamptz not null default now()
);

create table if not exists public.usage_counters (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  orders_count integer not null default 0,
  storage_bytes bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.technicians (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  device_type text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.checklist_templates(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  contact_name text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  category text not null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  stock integer not null default 0,
  min_stock_alert integer not null default 0,
  purchase_price numeric(12,2) not null default 0,
  sale_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  folio_oc text not null,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  order_date date not null default current_date,
  status text not null default 'pendiente' check (status in ('pendiente', 'parcial', 'recibido', 'cancelado')),
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  received_quantity integer not null default 0 check (received_quantity >= 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type text not null check (movement_type in ('add', 'remove', 'purchase_in', 'manual_adjustment')),
  quantity integer not null check (quantity > 0),
  reference_type text,
  reference_id text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  expense_date date not null default current_date,
  category text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('owner', 'member', 'admin')),
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create unique index if not exists user_roles_user_id_unique on public.user_roles (user_id);

create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  folio text not null unique,
  customer_id uuid not null references public.customers(id) on delete restrict,
  device_type text,
  device_brand text,
  device_model text,
  accessories text,
  vehicle_plate text not null,
  description text not null,
  checklist_template_id uuid references public.checklist_templates(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'waiting_parts', 'done', 'canceled')),
  reported_failure text,
  diagnosis text,
  internal_notes text,
  public_notes text,
  estimated_cost numeric(12,2),
  final_cost numeric(12,2),
  technician_id uuid,
  promised_date date,
  completion_date timestamptz,
  delivery_date timestamptz,
  payment_registered boolean not null default false,
  photos_urls text[] not null default '{}'::text[],
  created_at timestamptz not null default now()
  ,
  updated_at timestamptz not null default now()
);

create table if not exists public.order_checklist_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.service_orders(id) on delete cascade,
  label text not null,
  checked boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sequence_numbers (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  last_repair_number integer not null default 0
);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.service_orders(id) on delete cascade,
  event_type text not null,
  title text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.order_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.service_orders(id) on delete cascade,
  document_type text not null check (document_type in ('ingreso', 'diagnostico', 'presupuesto', 'entrega')),
  storage_path text not null,
  public_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, order_id, document_type)
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  actor_user_id uuid,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  website_title text,
  website_subtitle text,
  description text,
  portal_title text,
  portal_subtitle text,
  portal_description text,
  services jsonb not null default '[]'::jsonb,
  contact_phone text,
  whatsapp_phone text,
  logo_url text,
  primary_color text,
  secondary_color text,
  website_cta text,
  pdf_ingreso_title text,
  pdf_diagnostico_title text,
  pdf_presupuesto_title text,
  pdf_entrega_title text,
  pdf_footer_note text,
  address text,
  email text,
  updated_at timestamptz not null default now()
);

create index if not exists service_orders_tenant_created_idx on public.service_orders (tenant_id, created_at desc);
create index if not exists service_orders_folio_idx on public.service_orders (folio);
create index if not exists order_events_order_created_idx on public.order_events (order_id, created_at desc);
create index if not exists inventory_movements_tenant_created_idx on public.inventory_movements (tenant_id, created_at desc);
create index if not exists order_documents_order_type_idx on public.order_documents (order_id, document_type);
create index if not exists tenant_settings_updated_idx on public.tenant_settings (updated_at desc);
create index if not exists audit_events_tenant_created_idx on public.audit_events (tenant_id, created_at desc);
create index if not exists customers_tenant_created_idx on public.customers (tenant_id, created_at desc);
create index if not exists technicians_tenant_created_idx on public.technicians (tenant_id, created_at desc);
create index if not exists checklist_templates_tenant_created_idx on public.checklist_templates (tenant_id, created_at desc);
create index if not exists checklist_template_items_template_idx on public.checklist_template_items (template_id, sort_order);
create index if not exists order_checklist_items_order_idx on public.order_checklist_items (order_id, sort_order);
create index if not exists suppliers_tenant_created_idx on public.suppliers (tenant_id, created_at desc);
create index if not exists products_tenant_created_idx on public.products (tenant_id, created_at desc);
create index if not exists purchase_orders_tenant_created_idx on public.purchase_orders (tenant_id, created_at desc);
create index if not exists purchase_order_items_po_idx on public.purchase_order_items (purchase_order_id);
create index if not exists expenses_tenant_date_idx on public.expenses (tenant_id, expense_date desc);
create index if not exists subscriptions_tenant_status_idx on public.subscriptions (tenant_id, status);
create index if not exists webhook_events_processed_at_idx on public.webhook_events (processed_at desc);
create index if not exists usage_counters_updated_at_idx on public.usage_counters (updated_at desc);

alter table public.tenants enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.customers enable row level security;
alter table public.technicians enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.checklist_template_items enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.expenses enable row level security;
alter table public.user_roles enable row level security;
alter table public.usage_counters enable row level security;
alter table public.service_orders enable row level security;
alter table public.order_checklist_items enable row level security;
alter table public.order_events enable row level security;
alter table public.order_documents enable row level security;
alter table public.audit_events enable row level security;
alter table public.tenant_settings enable row level security;

create policy tenants_select_self on public.tenants
  for select using (id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy plans_select_authenticated on public.plans
  for select using (auth.role() = 'authenticated');

create policy subscriptions_tenant_isolation on public.subscriptions
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy customers_tenant_isolation on public.customers
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy technicians_tenant_isolation on public.technicians
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy checklist_templates_tenant_isolation on public.checklist_templates
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy checklist_template_items_template_isolation on public.checklist_template_items
  for all using (exists (
    select 1 from public.checklist_templates t
    where t.id = template_id and t.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  ))
  with check (exists (
    select 1 from public.checklist_templates t
    where t.id = template_id and t.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  ));

create policy suppliers_tenant_isolation on public.suppliers
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy products_tenant_isolation on public.products
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy purchase_orders_tenant_isolation on public.purchase_orders
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy purchase_order_items_tenant_isolation on public.purchase_order_items
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy inventory_movements_tenant_isolation on public.inventory_movements
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy expenses_tenant_isolation on public.expenses
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy user_roles_tenant_isolation on public.user_roles
  for select using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy usage_counters_tenant_isolation on public.usage_counters
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy service_orders_tenant_isolation on public.service_orders
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy order_checklist_items_tenant_isolation on public.order_checklist_items
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy order_events_tenant_isolation on public.order_events
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy order_documents_tenant_isolation on public.order_documents
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy audit_events_tenant_isolation on public.audit_events
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy tenant_settings_tenant_isolation on public.tenant_settings
  for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create or replace function public.initialize_tenant(
  p_tenant_name text default 'Taller',
  p_tenant_slug text default null,
  p_logo_url text default null,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_tenant_id uuid;
  v_plan_id uuid;
  v_template_id uuid;
  v_slug text;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  select ur.tenant_id
    into v_tenant_id
  from public.user_roles ur
  where ur.user_id = v_user_id
  limit 1;

  if v_tenant_id is not null then
    return v_tenant_id;
  end if;

  v_slug := coalesce(
    nullif(trim(p_tenant_slug), ''),
    regexp_replace(lower(coalesce(nullif(trim(p_tenant_name), ''), 'taller')), '[^a-z0-9]+', '-', 'g') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)
  );

  insert into public.tenants (name, slug)
  values (coalesce(nullif(trim(p_tenant_name), ''), 'Taller'), v_slug)
  returning id into v_tenant_id;

  insert into public.user_roles (user_id, tenant_id, role)
  values (v_user_id, v_tenant_id, 'owner');

  select p.id into v_plan_id
  from public.plans p
  where p.code = 'basic'
  limit 1;

  if v_plan_id is null then
    raise exception 'basic plan missing';
  end if;

  insert into public.subscriptions (tenant_id, plan_id, status, provider)
  values (v_tenant_id, v_plan_id, 'trialing', 'internal');

  insert into public.usage_counters (tenant_id, orders_count)
  values (v_tenant_id, 0);

  insert into public.tenant_settings (
    tenant_id,
    website_title,
    website_subtitle,
    description,
    services,
    contact_phone,
    whatsapp_phone,
    logo_url,
    primary_color,
    secondary_color,
    website_cta,
    address,
    email
  )
  values (
    v_tenant_id,
    coalesce(nullif(trim(p_tenant_name), ''), 'Taller'),
    'Recepción, diagnóstico, reparación y seguimiento.',
    coalesce(p_description, 'Servicio profesional con seguimiento en línea.'),
    'Portal de seguimiento',
    'Consulta el avance de tu orden',
    'Estado, fotos y documentos de tu servicio',
    '["Diagnóstico","Reparación","Seguimiento","Garantía"]'::jsonb,
    null,
    null,
    p_logo_url,
    '#1F7EDC',
    '#FF6A2A',
    'Cotizar ahora',
    'Orden de ingreso',
    'Informe de diagnóstico',
    'Presupuesto del servicio',
    'Confirmación de entrega',
    'Gracias por confiar en tu taller.',
    null,
    null
  );

  insert into public.checklist_templates (tenant_id, name, is_default)
  values (v_tenant_id, 'Ingreso estándar', true)
  returning id into v_template_id;

  insert into public.checklist_template_items (template_id, label, sort_order)
  values
    (v_template_id, 'Cargador', 1),
    (v_template_id, 'Batería', 2),
    (v_template_id, 'Tapa trasera', 3),
    (v_template_id, 'SIM / memoria', 4);

  return v_tenant_id;
end;
$$;

create or replace function public.increment_usage_counter(p_tenant_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.usage_counters
  set orders_count = orders_count + 1,
      updated_at = now()
  where tenant_id = p_tenant_id;
$$;

create or replace function public.increment_storage_counter(p_tenant_id uuid, p_bytes bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update public.usage_counters
  set storage_bytes = storage_bytes + greatest(0, p_bytes),
      updated_at = now()
  where tenant_id = p_tenant_id;
$$;

create or replace function public.increment_repair_sequence(p_tenant_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_num integer;
begin
  insert into public.sequence_numbers (tenant_id, last_repair_number)
  values (p_tenant_id, 1)
  on conflict (tenant_id) do update
  set last_repair_number = public.sequence_numbers.last_repair_number + 1
  returning last_repair_number into next_num;

  return next_num;
end;
$$;
