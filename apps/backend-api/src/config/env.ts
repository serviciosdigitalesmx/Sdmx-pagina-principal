import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });
dotenv.config({ path: 'apps/backend-api/.env' });
dotenv.config({ path: 'apps/backend-api/.env.local' });

const get = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
};

const optional = (name: string, fallback = ''): string => {
  return process.env[name] ?? fallback;
};

export const env = {
  port: Number(process.env.PORT ?? 5001),
  supabaseUrl: get('SUPABASE_URL').replace(/\/$/, ''),
  supabaseAnonKey: get('SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: get('SUPABASE_SERVICE_ROLE_KEY'),
  trialDays: Number(get('TRIAL_DAYS')),
  masterTenantSlug: optional('MASTER_TENANT_SLUG'),
  masterAccountEmail: optional('MASTER_ACCOUNT_EMAIL').toLowerCase(),
  corsAllowedOrigins: optional('CORS_ALLOWED_ORIGINS'),
  corsAllowedOriginList: optional('CORS_ALLOWED_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  mpAccessToken: optional('MP_ACCESS_TOKEN'),
  mpWebhookSecret: optional('MP_WEBHOOK_SECRET'),
  appUrl: optional('APP_URL', optional('NEXT_PUBLIC_APP_URL')).replace(/\/$/, ''),
  webhookBaseUrl: optional('WEBHOOK_BASE_URL', optional('BACKEND_PUBLIC_URL')).replace(/\/$/, '')
};
