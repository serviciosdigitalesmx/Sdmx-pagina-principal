begin;

alter table if exists public.users
  add column if not exists mfa_enabled boolean not null default false;

update public.users
set mfa_enabled = coalesce(mfa_enabled, false)
where true;

commit;
