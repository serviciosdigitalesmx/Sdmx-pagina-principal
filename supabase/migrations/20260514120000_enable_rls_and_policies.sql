-- Enable RLS on sensitive tables
alter table if exists public.orders enable row level security;
alter table if exists public.customers enable row level security;
alter table if exists public.finances enable row level security;
alter table if exists public.inventory enable row level security;
alter table if exists public.expenses enable row level security;

-- ORDERS
drop policy if exists orders_select on public.orders;
create policy orders_select
on public.orders
for select
using (
  auth.jwt() ->> 'tenant_id' = tenant_id
);

drop policy if exists orders_write_owner_manager on public.orders;
create policy orders_write_owner_manager
on public.orders
for insert
with check (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
);

drop policy if exists orders_update_owner_manager on public.orders;
create policy orders_update_owner_manager
on public.orders
for update
using (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
)
with check (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
);

drop policy if exists orders_delete_owner_manager on public.orders;
create policy orders_delete_owner_manager
on public.orders
for delete
using (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
);

-- Technicians may update only status through API guard; RLS allows same-tenant updates and backend enforces the field scope.
drop policy if exists orders_update_technician on public.orders;
create policy orders_update_technician
on public.orders
for update
using (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' = 'technician'
)
with check (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' = 'technician'
);

-- CUSTOMERS
drop policy if exists customers_select on public.customers;
create policy customers_select
on public.customers
for select
using (
  auth.jwt() ->> 'tenant_id' = tenant_id
);

drop policy if exists customers_write_owner_manager on public.customers;
create policy customers_write_owner_manager
on public.customers
for insert
with check (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
);

drop policy if exists customers_update_owner_manager on public.customers;
create policy customers_update_owner_manager
on public.customers
for update
using (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
)
with check (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
);

drop policy if exists customers_delete_owner_manager on public.customers;
create policy customers_delete_owner_manager
on public.customers
for delete
using (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
);

-- FINANCES
drop policy if exists finances_owner on public.finances;
create policy finances_owner
on public.finances
for all
using (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' = 'owner'
)
with check (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' = 'owner'
);

drop policy if exists finances_manager_read on public.finances;
create policy finances_manager_read
on public.finances
for select
using (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' = 'manager'
  and sucursal_id = auth.jwt() ->> 'sucursal_id'
);

-- INVENTORY
drop policy if exists inventory_select on public.inventory;
create policy inventory_select
on public.inventory
for select
using (
  auth.jwt() ->> 'tenant_id' = tenant_id
);

drop policy if exists inventory_write_owner_manager on public.inventory;
create policy inventory_write_owner_manager
on public.inventory
for insert
with check (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
);

drop policy if exists inventory_update_owner_manager on public.inventory;
create policy inventory_update_owner_manager
on public.inventory
for update
using (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
)
with check (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
);

drop policy if exists inventory_delete_owner_manager on public.inventory;
create policy inventory_delete_owner_manager
on public.inventory
for delete
using (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' in ('owner', 'manager')
);

-- EXPENSES
drop policy if exists expenses_owner on public.expenses;
create policy expenses_owner
on public.expenses
for all
using (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' = 'owner'
)
with check (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' = 'owner'
);

drop policy if exists expenses_manager_read_own_sucursal on public.expenses;
create policy expenses_manager_read_own_sucursal
on public.expenses
for select
using (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' = 'manager'
  and sucursal_id = auth.jwt() ->> 'sucursal_id'
);

drop policy if exists expenses_manager_write_own_sucursal on public.expenses;
create policy expenses_manager_write_own_sucursal
on public.expenses
for insert
with check (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' = 'manager'
  and sucursal_id = auth.jwt() ->> 'sucursal_id'
);

drop policy if exists expenses_manager_update_own_sucursal on public.expenses;
create policy expenses_manager_update_own_sucursal
on public.expenses
for update
using (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' = 'manager'
  and sucursal_id = auth.jwt() ->> 'sucursal_id'
)
with check (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' = 'manager'
  and sucursal_id = auth.jwt() ->> 'sucursal_id'
);

drop policy if exists expenses_manager_delete_own_sucursal on public.expenses;
create policy expenses_manager_delete_own_sucursal
on public.expenses
for delete
using (
  auth.jwt() ->> 'tenant_id' = tenant_id
  and auth.jwt() ->> 'role' = 'manager'
  and sucursal_id = auth.jwt() ->> 'sucursal_id'
);
