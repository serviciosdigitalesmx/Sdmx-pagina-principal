const runtimeConfig = (): string => {
  if (typeof window === 'undefined') return '';

  const fromWindow = (window as Window & { __SDMX_CONFIG__?: { apiUrl?: string } }).__SDMX_CONFIG__?.apiUrl;
  if (fromWindow) return fromWindow;

  // Último recurso controlado: mismo origen.
  return window.location.origin;
};

export const API_URL = process.env.NEXT_PUBLIC_API_URL || runtimeConfig();

export async function api<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json?.success === false) throw new Error(json?.error?.message || 'Error de API');
  return (json.data ?? json) as T;
}
