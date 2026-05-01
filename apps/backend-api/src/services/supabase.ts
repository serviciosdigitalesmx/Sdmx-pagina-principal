import { env } from '../config/env.js';

type HttpMethod = 'GET' | 'POST' | 'PATCH';
type AuthContext = { jwt?: string; serviceRole?: boolean };

const send = async <T>(path: string, method: HttpMethod, auth: AuthContext, body?: unknown, preferRepresentation = false): Promise<T> => {
  const headers: Record<string, string> = {
    apikey: auth.serviceRole ? env.supabaseServiceRoleKey : env.supabaseAnonKey,
    'content-type': 'application/json'
  };

  if (auth.jwt) {
    headers.authorization = `Bearer ${auth.jwt}`;
  } else if (auth.serviceRole) {
    headers.authorization = `Bearer ${env.supabaseServiceRoleKey}`;
  }
  
  if (preferRepresentation) headers.Prefer = 'return=representation';

  const res = await fetch(`${env.supabaseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `Supabase error ${res.status}`);
  if (!text) return null as T;
  return JSON.parse(text) as T;
};

export const supabase = {
  authLogin: (email: string, password: string) => send<{ access_token: string; refresh_token: string; expires_in?: number; user: { id: string; email: string } }>('/auth/v1/token?grant_type=password', 'POST', { serviceRole: false }, { email, password }),
  authUser: (jwt: string) => send<{ id: string; email: string }>('/auth/v1/user', 'GET', { jwt }),
  authAdminCreate: (email: string, password: string) => send<{ id: string }>('/auth/v1/admin/users', 'POST', { serviceRole: true }, { email, password, email_confirm: true }),
  authAdminUpdate: (userId: string, payload: unknown) =>
    send<{ id: string }>(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, 'PATCH', { serviceRole: true }, payload),
  query: <T>(tableQuery: string, jwt: string) => send<T>(`/rest/v1/${tableQuery}`, 'GET', { jwt }),
  queryAsService: <T>(tableQuery: string) => send<T>(`/rest/v1/${tableQuery}`, 'GET', { serviceRole: true }),
  insert: <T>(table: string, jwt: string, payload: unknown) => send<T>(`/rest/v1/${table}?select=*`, 'POST', { jwt }, payload, true),
  insertAsService: <T>(table: string, payload: unknown) => send<T>(`/rest/v1/${table}?select=*`, 'POST', { serviceRole: true }, payload, true),
  upsertAsService: <T>(table: string, payload: unknown, onConflict?: string) => {
    const url = onConflict ? `/rest/v1/${table}?on_conflict=${onConflict}&select=*` : `/rest/v1/${table}?select=*`;
    return fetch(`${env.supabaseUrl}${url}`, {
      method: 'POST',
      headers: {
        apikey: env.supabaseServiceRoleKey,
        'content-type': 'application/json',
        authorization: `Bearer ${env.supabaseServiceRoleKey}`,
        Prefer: 'return=representation,resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    }).then(async (res) => {
      const text = await res.text();
      if (!res.ok) throw new Error(text || `Supabase error ${res.status}`);
      return JSON.parse(text) as T;
    });
  },
  patch: <T>(tableQuery: string, jwt: string, payload: unknown) => send<T>(`/rest/v1/${tableQuery}`, 'PATCH', { jwt }, payload, true),
  rpc: <T>(fn: string, jwt: string, payload: unknown) => send<T>(`/rest/v1/rpc/${fn}`, 'POST', { jwt }, payload),
  storageSignedUpload: async (bucket: string, path: string, jwt: string, expiresInSeconds: number): Promise<{ signedUrl: string; url?: string }> => {
    const response = await send<{ signedUrl?: string; url?: string }>(`/storage/v1/object/upload/sign/${bucket}/${path}`, 'POST', { jwt }, { expiresIn: expiresInSeconds });
    const signedUrl = response.signedUrl || response.url;
    if (!signedUrl) throw new Error('Supabase no devolvió signedUrl');
    return { signedUrl, url: response.url };
  }
};
