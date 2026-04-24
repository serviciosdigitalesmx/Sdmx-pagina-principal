const get = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
};

export const env = {
  port: Number(process.env.PORT ?? 5000),
  supabaseUrl: get('SUPABASE_URL').replace(/\/$/, ''),
  supabaseAnonKey: get('SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: get('SUPABASE_SERVICE_ROLE_KEY'),
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o: string) => o.trim())
    .filter(Boolean)
};
