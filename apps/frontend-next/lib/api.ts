import { buildApiUrl } from './api-base';

export async function api<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);

  const response = await fetch(buildApiUrl(path), { ...init, headers, cache: 'no-store' });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json?.success === false) throw new Error(json?.error?.message || 'Error de API');
  return (json.data ?? json) as T;
}
