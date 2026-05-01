begin;

alter table if exists public.audit_events
  add column if not exists event_type text;

update public.audit_events
set event_type = coalesce(event_type, action, 'generic')
where event_type is null;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_audit_events_event_type'
  ) then
    create function public.set_audit_events_event_type()
    returns trigger
    language plpgsql
    as $fn$
    begin
      new.event_type := coalesce(new.event_type, new.action, 'generic');
      return new;
    end;
    $fn$;

    create trigger set_audit_events_event_type
    before insert on public.audit_events
    for each row execute function public.set_audit_events_event_type();
  end if;
end $$;

commit;
