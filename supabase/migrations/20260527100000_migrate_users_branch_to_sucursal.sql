begin;

-- Add sucursal_id to public.users if it does not exist
alter table if exists public.users
  add column if not exists sucursal_id uuid references public.sucursales(id) on delete set null;

-- Sync data from branch_id to sucursal_id for local/dev databases
update public.users
set sucursal_id = branch_id
where sucursal_id is null
  and branch_id is not null;

-- Drop the old branch_id column from users if it exists
alter table if exists public.users
  drop column if exists branch_id;

commit;
