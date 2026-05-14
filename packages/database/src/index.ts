import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is required');
}

if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}

// Creamos un cliente singleton con el service_role key para tareas administrativas.
// CUIDADO: Este cliente tiene privilegios absolutos.
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export const getTenantClient = (tenantId: string) => {
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        'x-tenant-id': tenantId,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
};

export * from '@supabase/supabase-js';
