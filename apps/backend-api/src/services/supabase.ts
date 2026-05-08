import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas');
}

const client = createClient(supabaseUrl, supabaseServiceKey);

// Define a typed adapter interface so services can call generically.
export type SupabaseAdapter = {
  client: any;
  storage: any;
  query<T = any>(path: string, token?: string): Promise<T>;
  queryAsService<T = any>(path: string): Promise<T>;
  insert<T = any>(table: string, token: string | undefined, payload: any): Promise<T>;
  insertAsService<T = any>(table: string, payload: any): Promise<T>;
  upsertAsService<T = any>(table: string, payload: any, onConflict?: string | string[]): Promise<T>;
  patch<T = any>(path: string, token: string | undefined, payload: any): Promise<T>;
  rpc<T = any>(name: string, token: string | undefined, payload?: any): Promise<T>;
  authAdminCreate(email: string, password: string): Promise<any>;
  authAdminUpdate(userId: string, data: any): Promise<any>;
  authLogin(email: string, password: string): Promise<any>;
  authRefresh(refreshToken: string): Promise<any>;
  authUser(token: string): Promise<any>;
  createSignedUrl(bucket: string, path: string, expiresIn: number): Promise<any>;
  from(table: string): any;
};

export const supabase: SupabaseAdapter = {
  client,
  storage: client.storage,

  async query<T = any>(path: string, token?: string) {
    const url = `${supabaseUrl}/rest/v1/${path}`;
    const res = await fetch(url, {
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${token ?? supabaseServiceKey}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as T;
  },

  async queryAsService<T = any>(path: string) {
    return this.query<T>(path, supabaseServiceKey);
  },

  async insert<T = any>(table: string, token: string | undefined, payload: any) {
    const url = `${supabaseUrl}/rest/v1/${table}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${token ?? supabaseServiceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(Array.isArray(payload) ? payload : [payload]),
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as T;
  },

  async insertAsService<T = any>(table: string, payload: any) {
    return this.insert<T>(table, supabaseServiceKey, payload);
  },

  async upsertAsService<T = any>(table: string, payload: any, _onConflict?: string | string[]) {
    try {
      // @ts-ignore - use client.from(table).upsert when available
      const { data, error } = await client.from(table).upsert(payload).select('*');
      if (error) throw error;
      return data as T;
    } catch (e) {
      const url = `${supabaseUrl}/rest/v1/${table}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates, return=representation',
        },
        body: JSON.stringify(Array.isArray(payload) ? payload : [payload]),
      });
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as T;
    }
  },

  async patch<T = any>(path: string, token: string | undefined, payload: any) {
    const url = `${supabaseUrl}/rest/v1/${path}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${token ?? supabaseServiceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as T;
  },

  async rpc<T = any>(name: string, token: string | undefined, payload?: any) {
    // @ts-ignore
    const result = await client.rpc(name, payload);
    if (result?.error) throw result.error;
    return result?.data as T;
  },

  from(table: string) {
    // proxy to client.from for query builder usage
    // @ts-ignore
    return client.from(table);
  },

  async authAdminCreate(email: string, password: string) {
    // @ts-ignore
    if (client.auth && (client.auth as any).admin && (client.auth as any).admin.createUser) {
      // @ts-ignore
      return (client.auth as any).admin.createUser({ email, password });
    }
    throw new Error('authAdminCreate not available in this client');
  },

  async authAdminUpdate(userId: string, data: any) {
    // @ts-ignore
    if (client.auth && (client.auth as any).admin && (client.auth as any).admin.updateUserById) {
      // @ts-ignore
      return (client.auth as any).admin.updateUserById(userId, data);
    }
    throw new Error('authAdminUpdate not available in this client');
  },

  async authLogin(email: string, password: string) {
    // @ts-ignore
    return client.auth.signInWithPassword({ email, password });
  },

  async authRefresh(refreshToken: string) {
    // @ts-ignore
    return client.auth.refreshSession({ refresh_token: refreshToken });
  },

  async authUser(token: string) {
    const url = `${supabaseUrl}/auth/v1/user`;
    const res = await fetch(url, {
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as any;
  },

  async createSignedUrl(bucket: string, path: string, expiresIn: number) {
    // @ts-ignore
    return client.storage.from(bucket).createSignedUrl(path, expiresIn);
  },
};

export default supabase;
