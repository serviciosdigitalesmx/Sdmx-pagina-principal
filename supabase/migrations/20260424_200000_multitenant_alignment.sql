-- Delta de alineación para backend Node + contratos compartidos
create extension if not exists pgcrypto;

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  billing_exempt boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  code text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  tenant_id uuid not null references tenants(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  full_name text not null,
  email text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table users add column if not exists tenant_id uuid references tenants(id) on delete cascade;
alter table users add column if not exists branch_id uuid references branches(id) on delete set null;
alter table users add column if not exists auth_user_id uuid unique;

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  code text not null,
  name text not null,
  unique (tenant_id, code)
);

create table if not exists permissions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null
);

create table if not exists user_roles (
  user_id uuid not null references users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  primary key (user_id, role_id)
);

create table if not exists role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists security_config (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  password_rotation_days int not null default 90,
  mfa_required boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists tenant_counters (
  tenant_id uuid not null references tenants(id) on delete cascade,
  domain text not null,
  seq bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, domain)
);

create table if not exists shops (
  id uuid primary key references tenants(id) on delete cascade,
  name text not null,
  slug text unique not null,
  billing_exempt boolean not null default false,
  legal_name text,
  support_email text,
  phone text,
  address text,
  logo_url text,
  primary_color text,
  secondary_color text,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  plan_code text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists customer_contacts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  name text not null,
  role text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists service_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  folio text not null,
  status text not null,
  device_type text,
  device_brand text,
  device_model text,
  reported_issue text,
  promised_date date,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (tenant_id, folio)
);

create table if not exists service_order_timeline (
  id uuid primary key default gen_random_uuid(),
  service_order_id uuid not null references service_orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists quotations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  service_order_id uuid not null references service_orders(id) on delete cascade,
  subtotal_mxn numeric(12,2) not null,
  vat_mxn numeric(12,2) not null,
  total_mxn numeric(12,2) not null,
  advance_mxn numeric(12,2) not null default 0,
  balance_mxn numeric(12,2) not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists file_assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  service_order_id uuid references service_orders(id) on delete cascade,
  path text not null,
  mime_type text,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists status_transition_policy (
  id uuid primary key default gen_random_uuid(),
  entity text not null,
  from_status text not null,
  to_status text not null,
  tenant_id uuid references tenants(id) on delete cascade
);

create unique index if not exists ux_status_transition_policy_scope
  on status_transition_policy ((coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid)), entity, from_status, to_status);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  actor_user_id uuid,
  action text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create or replace function next_tenant_folio(p_tenant_id uuid, p_domain text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_seq bigint;
  v_prefix text;
begin
  insert into tenant_counters (tenant_id, domain, seq)
  values (p_tenant_id, p_domain, 1)
  on conflict (tenant_id, domain)
  do update set seq = tenant_counters.seq + 1, updated_at = now()
  returning seq into v_seq;

  v_prefix := upper(case when p_domain = 'service_order' then 'OS' else 'DOC' end);
  return jsonb_build_object('folio', v_prefix || '-' || lpad(v_seq::text, 6, '0'));
end;
$$;

create or replace function auth_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(u.tenant_id, b.tenant_id)
  from users u
  left join branches b on b.id = u.branch_id
  where u.auth_user_id = auth.uid()
  limit 1
$$;

alter table tenants enable row level security;
alter table branches enable row level security;
alter table users enable row level security;
alter table customers enable row level security;
alter table customer_contacts enable row level security;
alter table service_orders enable row level security;
alter table service_order_timeline enable row level security;
alter table quotations enable row level security;
alter table file_assets enable row level security;
alter table audit_events enable row level security;
alter table shops enable row level security;
alter table subscriptions enable row level security;
alter table roles enable row level security;
alter table permissions enable row level security;
alter table user_roles enable row level security;
alter table role_permissions enable row level security;
alter table security_config enable row level security;
alter table status_transition_policy enable row level security;
alter table tenant_counters enable row level security;

-- RLS por tenant derivado de auth.uid() -> users.auth_user_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'tenant_isolation_users') THEN
    CREATE POLICY tenant_isolation_users ON users USING (
      coalesce(tenant_id, (
        SELECT b.tenant_id
        FROM branches b
        WHERE b.id = users.branch_id
        LIMIT 1
      )) = auth_tenant_id()
    ) WITH CHECK (
      coalesce(tenant_id, (
        SELECT b.tenant_id
        FROM branches b
        WHERE b.id = users.branch_id
        LIMIT 1
      )) = auth_tenant_id()
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shops' AND policyname = 'tenant_isolation_shops') THEN
    CREATE POLICY tenant_isolation_shops ON shops USING (id = auth_tenant_id()) WITH CHECK (id = auth_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'tenant_isolation_subscriptions') THEN
    CREATE POLICY tenant_isolation_subscriptions ON subscriptions USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'roles' AND policyname = 'tenant_isolation_roles') THEN
    CREATE POLICY tenant_isolation_roles ON roles USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'permissions' AND policyname = 'tenant_permissions_read') THEN
    CREATE POLICY tenant_permissions_read ON permissions FOR SELECT USING (
      EXISTS (
        SELECT 1
        FROM role_permissions rp
        JOIN user_roles ur ON ur.role_id = rp.role_id
        JOIN users u ON u.id = ur.user_id
        LEFT JOIN branches b ON b.id = u.branch_id
        WHERE rp.permission_id = permissions.id
          AND coalesce(u.tenant_id, b.tenant_id) = auth_tenant_id()
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'tenant_isolation_user_roles') THEN
    CREATE POLICY tenant_isolation_user_roles ON user_roles USING (
      EXISTS (
        SELECT 1
        FROM users u
        LEFT JOIN branches b ON b.id = u.branch_id
        WHERE u.id = user_roles.user_id
          AND coalesce(u.tenant_id, b.tenant_id) = auth_tenant_id()
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1
        FROM users u
        LEFT JOIN branches b ON b.id = u.branch_id
        WHERE u.id = user_roles.user_id
          AND coalesce(u.tenant_id, b.tenant_id) = auth_tenant_id()
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'role_permissions' AND policyname = 'tenant_isolation_role_permissions') THEN
    CREATE POLICY tenant_isolation_role_permissions ON role_permissions USING (
      EXISTS (
        SELECT 1
        FROM roles r
        WHERE r.id = role_permissions.role_id
          AND r.tenant_id = auth_tenant_id()
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1
        FROM roles r
        WHERE r.id = role_permissions.role_id
          AND r.tenant_id = auth_tenant_id()
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenant_counters' AND policyname = 'tenant_isolation_tenant_counters') THEN
    CREATE POLICY tenant_isolation_tenant_counters ON tenant_counters USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'tenant_isolation_customers') THEN
    CREATE POLICY tenant_isolation_customers ON customers USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customer_contacts' AND policyname = 'tenant_isolation_customer_contacts') THEN
    CREATE POLICY tenant_isolation_customer_contacts ON customer_contacts USING (
      EXISTS (
        SELECT 1 FROM customers c
        WHERE c.id = customer_contacts.customer_id
          AND c.tenant_id = auth_tenant_id()
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM customers c
        WHERE c.id = customer_contacts.customer_id
          AND c.tenant_id = auth_tenant_id()
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'service_orders' AND policyname = 'tenant_isolation_service_orders') THEN
    CREATE POLICY tenant_isolation_service_orders ON service_orders USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'service_order_timeline' AND policyname = 'tenant_isolation_service_order_timeline') THEN
    CREATE POLICY tenant_isolation_service_order_timeline ON service_order_timeline USING (
      EXISTS (
        SELECT 1 FROM service_orders so
        WHERE so.id = service_order_timeline.service_order_id
          AND so.tenant_id = auth_tenant_id()
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM service_orders so
        WHERE so.id = service_order_timeline.service_order_id
          AND so.tenant_id = auth_tenant_id()
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quotations' AND policyname = 'tenant_isolation_quotes') THEN
    CREATE POLICY tenant_isolation_quotes ON quotations USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'status_transition_policy' AND policyname = 'tenant_isolation_status_transition_policy') THEN
    CREATE POLICY tenant_isolation_status_transition_policy ON status_transition_policy USING (
      tenant_id = auth_tenant_id() OR tenant_id IS NULL
    ) WITH CHECK (
      tenant_id = auth_tenant_id() OR tenant_id IS NULL
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_events' AND policyname = 'tenant_isolation_audit') THEN
    CREATE POLICY tenant_isolation_audit ON audit_events USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'file_assets' AND policyname = 'tenant_isolation_file_assets') THEN
    CREATE POLICY tenant_isolation_file_assets ON file_assets USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'branches' AND policyname = 'tenant_isolation_branches') THEN
    CREATE POLICY tenant_isolation_branches ON branches USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'security_config' AND policyname = 'tenant_isolation_security_config') THEN
    CREATE POLICY tenant_isolation_security_config ON security_config USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());
  END IF;
END $$;
