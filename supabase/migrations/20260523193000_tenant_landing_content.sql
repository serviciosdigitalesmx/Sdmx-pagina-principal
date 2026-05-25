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

alter table public.tenants
  drop constraint if exists tenants_landing_content_is_object;

alter table public.tenants
  add constraint tenants_landing_content_is_object
  check (jsonb_typeof(landing_content) = 'object');
