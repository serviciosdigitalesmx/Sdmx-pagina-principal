const get = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
};

const optional = (name: string): string | undefined => {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
};

const mustBeUrl = (name: string, value: string): string => {
  try {
    return new URL(value).toString().replace(/\/$/, '');
  } catch {
    throw new Error(`Invalid URL format for env var: ${name}`);
  }
};

const mustBeToken = (name: string, value: string): string => {
  if (value.trim().length < 20) throw new Error(`Invalid token format for env var: ${name}`);
  return value;
};

const optionalUrl = (name: string): string | undefined => {
  const value = optional(name);
  return value ? mustBeUrl(name, value) : undefined;
};

export const env = {
  port: Number(process.env.PORT ?? 5000),
  supabaseUrl: mustBeUrl('SUPABASE_URL', get('SUPABASE_URL')),
  supabaseAnonKey: mustBeToken('SUPABASE_ANON_KEY', get('SUPABASE_ANON_KEY')),
  supabaseServiceRoleKey: mustBeToken('SUPABASE_SERVICE_ROLE_KEY', get('SUPABASE_SERVICE_ROLE_KEY')),
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o: string) => o.trim())
    .filter(Boolean),
  betterStackToken: optional('BETTERSTACK_SOURCE_TOKEN'),
  betterStackEndpoint: optionalUrl('BETTERSTACK_INGEST_URL') ?? 'https://in.logs.betterstack.com',
  errorWebhookUrl: optionalUrl('ERROR_WEBHOOK_URL')
};
