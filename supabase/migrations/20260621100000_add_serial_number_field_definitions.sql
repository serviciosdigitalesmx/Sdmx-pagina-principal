alter table public.service_requests
  add column if not exists serial_number text;

create index if not exists service_requests_tenant_serial_idx
  on public.service_requests (tenant_id, serial_number)
  where serial_number is not null;

create index if not exists service_orders_tenant_serial_idx
  on public.service_orders (tenant_id, serial_number)
  where serial_number is not null;

insert into public.tenant_field_definitions (
  tenant_id,
  entity,
  field_key,
  field_label,
  field_type,
  required,
  options,
  field_order,
  placeholder,
  help_text,
  visible,
  validation,
  metadata
)
select
  tenant.id,
  field_definition.entity,
  'serial_number',
  'Serie / IMEI',
  'text',
  false,
  '[]'::jsonb,
  field_definition.field_order,
  'IMEI o numero de serie',
  field_definition.help_text,
  true,
  '{}'::jsonb,
  '{"section":"device_identity"}'::jsonb
from public.tenants tenant
cross join (
  values
    ('service_orders', 5, 'Identificador del equipo capturado en recepcion.'),
    ('service_requests', 4, 'Identificador del equipo capturado desde solicitud publica.')
) as field_definition(entity, field_order, help_text)
on conflict (tenant_id, entity, field_key) do nothing;
