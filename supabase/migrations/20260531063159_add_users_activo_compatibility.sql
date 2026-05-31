begin;

alter table if exists public.users
  add column if not exists activo boolean not null default true;

update public.users
set activo = coalesce(activo, is_active, true)
where true;

create or replace function public.sync_users_activo_compatibility()
returns trigger
language plpgsql
as $$
begin
  new.activo := coalesce(new.activo, new.is_active, true);
  new.is_active := coalesce(new.is_active, new.activo, true);
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_sync_users_activo_compatibility on public.users;
create trigger trg_sync_users_activo_compatibility
before insert or update on public.users
for each row execute function public.sync_users_activo_compatibility();

commit;
