begin;

alter table public.users
  add column if not exists sucursal_id uuid references public.sucursales(id) on delete set null,
  add column if not exists branch_id uuid,
  add column if not exists name text,
  add column if not exists activo boolean not null default true,
  add column if not exists ultimo_acceso timestamptz;

update public.users
set name = coalesce(name, full_name),
    activo = coalesce(activo, is_active, true),
    ultimo_acceso = coalesce(ultimo_acceso, last_login_at)
where true;

alter table public.users
  alter column name set not null;

create index if not exists users_tenant_role_active_idx
  on public.users (tenant_id, role, activo);

create index if not exists users_tenant_last_access_idx
  on public.users (tenant_id, ultimo_acceso desc nulls last);

create or replace function public.sync_users_admin_compat()
returns trigger
language plpgsql
as $$
begin
  new.name := coalesce(nullif(btrim(new.name), ''), nullif(btrim(new.full_name), ''));
  new.full_name := coalesce(nullif(btrim(new.full_name), ''), nullif(btrim(new.name), ''));
  new.activo := coalesce(new.activo, new.is_active, true);
  new.is_active := coalesce(new.is_active, new.activo, true);
  new.ultimo_acceso := coalesce(new.ultimo_acceso, new.last_login_at);
  new.last_login_at := coalesce(new.last_login_at, new.ultimo_acceso);

  if new.sucursal_id is null and new.branch_id is not null then
    new.sucursal_id := new.branch_id;
  elsif new.branch_id is null and new.sucursal_id is not null then
    new.branch_id := new.sucursal_id;
  end if;

  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_sync_users_admin_compat on public.users;
create trigger trg_sync_users_admin_compat
before insert or update on public.users
for each row execute function public.sync_users_admin_compat();

commit;
