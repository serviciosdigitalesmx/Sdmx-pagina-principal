alter table public.tenants
  add column if not exists landing_content jsonb not null default jsonb_build_object(
    'heroTitle', '',
    'heroSubtitle', '',
    'heroDescription', '',
    'primaryCtaLabel', 'Cotizar ahora',
    'primaryCtaHref', '/cotizar',
    'secondaryCtaLabel', 'Ver estatus',
    'secondaryCtaHref', '/tracking',
    'contactLabel', 'WhatsApp / contacto',
    'contactHref', '',
    'seoTitle', '',
    'seoDescription', '',
    'services', '[]'::jsonb,
    'socialLinks', '[]'::jsonb,
    'showMap', false,
    'mapEmbedUrl', '',
    'showVideo', false,
    'videoUrl', ''
  );

alter table public.tenants
  add column if not exists operational_settings jsonb not null default jsonb_build_object(
    'orderStatuses', jsonb_build_array(
      jsonb_build_object('key', 'recibido', 'label', 'Recibido', 'tone', 'gray'),
      jsonb_build_object('key', 'diagnostico', 'label', 'Diagnóstico', 'tone', 'amber'),
      jsonb_build_object('key', 'reparacion', 'label', 'Reparación', 'tone', 'orange'),
      jsonb_build_object('key', 'listo', 'label', 'Lista', 'tone', 'emerald'),
      jsonb_build_object('key', 'entregado', 'label', 'Entregada', 'tone', 'zinc')
    ),
    'taskStatuses', jsonb_build_array(
      jsonb_build_object('key', 'pendiente', 'label', 'Pendiente', 'tone', 'gray'),
      jsonb_build_object('key', 'en_proceso', 'label', 'En proceso', 'tone', 'amber'),
      jsonb_build_object('key', 'bloqueada', 'label', 'Bloqueada', 'tone', 'red'),
      jsonb_build_object('key', 'hecha', 'label', 'Hecha', 'tone', 'emerald')
    ),
    'warrantyDays', 90
  );

update public.tenants
set landing_content = jsonb_build_object(
  'heroTitle', coalesce(name, ''),
  'heroSubtitle', 'Landing pública por tenant',
  'heroDescription', 'Cotización, estado y contacto directo con marca propia.',
  'primaryCtaLabel', 'Cotizar ahora',
  'primaryCtaHref', '/cotizar',
  'secondaryCtaLabel', 'Ver estatus',
  'secondaryCtaHref', '/tracking',
  'contactLabel', 'WhatsApp / contacto',
  'contactHref', '',
  'seoTitle', coalesce(name, ''),
  'seoDescription', 'Landing pública del taller con experiencia white-label.',
  'services', '[]'::jsonb,
  'socialLinks', '[]'::jsonb,
  'showMap', false,
  'mapEmbedUrl', '',
  'showVideo', false,
  'videoUrl', ''
)
where landing_content = jsonb_build_object(
  'heroTitle', '',
  'heroSubtitle', '',
  'heroDescription', '',
  'primaryCtaLabel', 'Cotizar ahora',
  'primaryCtaHref', '/onboarding',
  'secondaryCtaLabel', 'Ver estatus',
  'secondaryCtaHref', '/login',
  'contactLabel', 'WhatsApp / contacto',
  'contactHref', '',
  'seoTitle', '',
  'seoDescription', '',
  'services', '[]'::jsonb,
  'socialLinks', '[]'::jsonb,
  'showMap', false,
  'mapEmbedUrl', '',
  'showVideo', false,
  'videoUrl', ''
);

update public.tenants
set operational_settings = jsonb_build_object(
  'orderStatuses', jsonb_build_array(
    jsonb_build_object('key', 'recibido', 'label', 'Recibido', 'tone', 'gray'),
    jsonb_build_object('key', 'diagnostico', 'label', 'Diagnóstico', 'tone', 'amber'),
    jsonb_build_object('key', 'reparacion', 'label', 'Reparación', 'tone', 'orange'),
    jsonb_build_object('key', 'listo', 'label', 'Lista', 'tone', 'emerald'),
    jsonb_build_object('key', 'entregado', 'label', 'Entregada', 'tone', 'zinc')
  ),
  'taskStatuses', jsonb_build_array(
    jsonb_build_object('key', 'pendiente', 'label', 'Pendiente', 'tone', 'gray'),
    jsonb_build_object('key', 'en_proceso', 'label', 'En proceso', 'tone', 'amber'),
    jsonb_build_object('key', 'bloqueada', 'label', 'Bloqueada', 'tone', 'red'),
    jsonb_build_object('key', 'hecha', 'label', 'Hecha', 'tone', 'emerald')
  ),
  'warrantyDays', 90
)
where operational_settings = jsonb_build_object(
  'orderStatuses', jsonb_build_array(
    jsonb_build_object('key', 'recibido', 'label', 'Recibido', 'tone', 'gray'),
    jsonb_build_object('key', 'diagnostico', 'label', 'Diagnóstico', 'tone', 'amber'),
    jsonb_build_object('key', 'reparacion', 'label', 'Reparación', 'tone', 'orange'),
    jsonb_build_object('key', 'listo', 'label', 'Lista', 'tone', 'emerald'),
    jsonb_build_object('key', 'entregado', 'label', 'Entregada', 'tone', 'zinc')
  ),
  'taskStatuses', jsonb_build_array(
    jsonb_build_object('key', 'pendiente', 'label', 'Pendiente', 'tone', 'gray'),
    jsonb_build_object('key', 'en_proceso', 'label', 'En proceso', 'tone', 'amber'),
    jsonb_build_object('key', 'bloqueada', 'label', 'Bloqueada', 'tone', 'red'),
    jsonb_build_object('key', 'hecha', 'label', 'Hecha', 'tone', 'emerald')
  ),
  'warrantyDays', 90
);

alter table public.tenants
  drop constraint if exists tenants_landing_content_is_object;

alter table public.tenants
  add constraint tenants_landing_content_is_object
  check (jsonb_typeof(landing_content) = 'object');

alter table public.tenants
  drop constraint if exists tenants_operational_settings_is_object;

alter table public.tenants
  add constraint tenants_operational_settings_is_object
  check (jsonb_typeof(operational_settings) = 'object');
