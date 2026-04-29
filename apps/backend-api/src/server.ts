import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { env } from './config/env.js';
import { handleApi } from './routes/api.js';
import { serverError } from './core/http.js';

const normalizeOrigin = (origin: string): string => origin.trim().replace(/\/$/, '');

const isAllowedOrigin = (origin: string | null): boolean => {
  if (!origin) return false;
  const normalized = normalizeOrigin(origin);
  const originList = env.corsAllowedOriginList;

  if (originList.includes(normalized)) return true;
  if (originList.includes('https://*.vercel.app') && normalized.endsWith('.vercel.app')) return true;
  if (originList.includes('http://localhost:3000') && normalized.startsWith('http://localhost:')) return true;
  if (originList.includes('https://localhost:3000') && normalized.startsWith('https://localhost:')) return true;
  if (env.appUrl && normalized === normalizeOrigin(env.appUrl)) return true;

  return false;
};

const applyCors = (response: Response, origin: string | null): Response => {
  if (!isAllowedOrigin(origin)) return response;

  const headers = new Headers(response.headers);
  headers.set('access-control-allow-origin', normalizeOrigin(origin as string));
  headers.set('access-control-allow-methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  headers.set('access-control-allow-headers', 'content-type,authorization');
  headers.set('access-control-max-age', '86400');
  headers.set('vary', 'origin');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};

const server = createServer(async (incoming: IncomingMessage, outgoing: ServerResponse) => {
  const body = await new Promise<Uint8Array>((resolve) => {
    const chunks: Uint8Array[] = [];
    incoming.on('data', (chunk: Uint8Array) => chunks.push(Buffer.from(chunk)));
    incoming.on('end', () => resolve(Buffer.concat(chunks)));
  });

  const request = new Request(`http://${incoming.headers.host}${incoming.url ?? '/'}`, {
    method: incoming.method,
    headers: incoming.headers as HeadersInit,
    body: incoming.method === 'GET' || incoming.method === 'HEAD' ? undefined : (body as unknown as BodyInit)
  });

  try {
    const origin = request.headers.get('origin');

    if (request.method === 'OPTIONS') {
      const response = applyCors(new Response(null, { status: 204 }), origin);
      outgoing.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      outgoing.end();
      return;
    }

    const response = applyCors(await handleApi(request), origin);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    const bytes = await response.arrayBuffer();
    outgoing.end(Buffer.from(bytes));
  } catch {
    const response = serverError();
    outgoing.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    outgoing.end(JSON.stringify({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Error interno' } }));
  }
});

server.listen(env.port, () => {
  console.log(`SDMX API listening on ${env.port}`);
});
