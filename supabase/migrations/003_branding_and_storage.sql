alter table public.usage_counters
  add column if not exists storage_bytes bigint not null default 0;

alter table public.tenant_settings
  add column if not exists portal_title text;
alter table public.tenant_settings
  add column if not exists portal_subtitle text;
alter table public.tenant_settings
  add column if not exists portal_description text;
alter table public.tenant_settings
  add column if not exists pdf_ingreso_title text;
alter table public.tenant_settings
  add column if not exists pdf_diagnostico_title text;
alter table public.tenant_settings
  add column if not exists pdf_presupuesto_title text;
alter table public.tenant_settings
  add column if not exists pdf_entrega_title text;
alter table public.tenant_settings
  add column if not exists pdf_footer_note text;

update public.tenant_settings
set
  portal_title = coalesce(portal_title, 'Rastreo de Orden'),
  portal_subtitle = coalesce(portal_subtitle, 'Consulta pública por folio.'),
  portal_description = coalesce(portal_description, ''),
  pdf_ingreso_title = coalesce(pdf_ingreso_title, 'Orden de ingreso'),
  pdf_diagnostico_title = coalesce(pdf_diagnostico_title, 'Informe de diagnóstico'),
  pdf_presupuesto_title = coalesce(pdf_presupuesto_title, 'Presupuesto del servicio'),
  pdf_entrega_title = coalesce(pdf_entrega_title, 'Confirmación de entrega'),
  pdf_footer_note = coalesce(pdf_footer_note, 'Gracias por confiar en tu taller.')
where true;

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
