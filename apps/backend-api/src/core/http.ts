import type { ApiResponse } from '../types/contracts.js';

export const json = <T>(status: number, body: ApiResponse<T>): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

export const ok = <T>(data: T): Response => json(200, { success: true, data });
export const badRequest = (code: string, message: string): Response => json(400, { success: false, error: { code, message } });
export const unauthorized = (message = 'No autorizado'): Response => json(401, { success: false, error: { code: 'UNAUTHORIZED', message } });
export const forbidden = (message = 'Prohibido'): Response => json(403, { success: false, error: { code: 'FORBIDDEN', message } });
export const notFound = (message = 'No encontrado'): Response => json(404, { success: false, error: { code: 'NOT_FOUND', message } });
export const serverError = (message = 'Error interno'): Response => json(500, { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message } });

export const parseJson = async <T>(request: Request): Promise<T> => {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error('JSON inválido');
  }
};

export const bearer = (request: Request): string | null => {
  const auth = request.headers.get('authorization');
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) return null;
  return auth.slice(7).trim();
};

export const cookieValue = (request: Request, name: string): string | null => {
  const header = request.headers.get('cookie');
  if (!header) return null;
  const parts = header.split(';').map((part) => part.trim());
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = decodeURIComponent(part.slice(0, eq).trim());
    if (key === name) return decodeURIComponent(part.slice(eq + 1));
  }
  return null;
};

export const setCookieHeader = (name: string, value: string, options: {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
  maxAge?: number;
  path?: string;
  domain?: string;
} = {}): string => {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path ?? '/'}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.httpOnly !== false) parts.push('HttpOnly');
  if (options.secure !== false) parts.push('Secure');
  parts.push(`SameSite=${options.sameSite ?? 'None'}`);
  return parts.join('; ');
};
