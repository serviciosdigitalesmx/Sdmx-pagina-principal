import { createServer } from 'node:http';
import { env } from './config/env.js';
import { handleApi } from './routes/api.js';
import { serverError } from './core/http.js';
import { logger } from './core/logger.js';

type RateState = { count: number; resetAt: number };
const rateStore = new Map<string, RateState>();

const now = () => Date.now();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_DEFAULT = 120;
const RATE_MAX_LOGIN = 12;

const checkRateLimit = (ip: string, path: string): boolean => {
  const key = `${ip}:${path}`;
  const max = path === '/api/auth/login' ? RATE_MAX_LOGIN : RATE_MAX_DEFAULT;
  const state = rateStore.get(key);

  if (!state || state.resetAt <= now()) {
    rateStore.set(key, { count: 1, resetAt: now() + RATE_WINDOW_MS });
    return true;
  }

  state.count += 1;
  rateStore.set(key, state);
  return state.count <= max;
};

const withSecurityHeaders = (headers: Headers): void => {
  headers.set('x-content-type-options', 'nosniff');
  headers.set('x-frame-options', 'DENY');
  headers.set('referrer-policy', 'no-referrer');
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('x-xss-protection', '0');
};

const withCors = (req: Request, res: Response): Response => {
  const origin = req.headers.get('origin');
  const headers = new Headers(res.headers);

  if (origin && env.corsAllowedOrigins.includes(origin)) {
    headers.set('access-control-allow-origin', origin);
    headers.set('vary', 'origin');
  }

  headers.set('access-control-allow-methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  headers.set('access-control-allow-headers', 'content-type,authorization');
  withSecurityHeaders(headers);

  return new Response(res.body, { status: res.status, headers });
};

const server = createServer(async (incoming: any, outgoing: any) => {
  const body = await new Promise<Uint8Array>((resolve) => {
    const chunks: Uint8Array[] = [];
    incoming.on('data', (chunk: Uint8Array) => chunks.push(Buffer.from(chunk)));
    incoming.on('end', () => resolve(Buffer.concat(chunks)));
  });

  const request = new Request(`http://${incoming.headers.host}${incoming.url}`, {
    method: incoming.method,
    headers: incoming.headers as Record<string, string>,
    body: incoming.method === 'GET' || incoming.method === 'HEAD' ? undefined : (body as unknown as BodyInit)
  });

  const ip = String(incoming.headers['x-forwarded-for'] ?? incoming.socket?.remoteAddress ?? 'unknown').split(',')[0].trim();
  const pathname = new URL(request.url).pathname;

  if (!checkRateLimit(ip, pathname)) {
    const limited = withCors(request, new Response(JSON.stringify({ success: false, error: { code: 'RATE_LIMITED', message: 'Demasiadas solicitudes, intenta nuevamente más tarde.' } }), { status: 429, headers: { 'content-type': 'application/json; charset=utf-8' } }));
    outgoing.writeHead(limited.status, Object.fromEntries(limited.headers.entries()));
    outgoing.end(await limited.text());
    return;
  }

  try {
    if (request.method === 'OPTIONS') {
      const res = withCors(request, new Response(null, { status: 204 }));
      outgoing.writeHead(res.status, Object.fromEntries(res.headers.entries()));
      outgoing.end();
      return;
    }

    const response = withCors(request, await handleApi(request));
    outgoing.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    const bytes = await response.arrayBuffer();
    outgoing.end(Buffer.from(bytes));

    logger.info({ method: request.method, path: pathname, status: response.status, ip }, 'request_completed');
  } catch (error) {
    logger.error({ err: error, method: request.method, path: pathname, ip }, 'request_crashed');
    const response = withCors(request, serverError());
    outgoing.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    outgoing.end(JSON.stringify({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Error interno' } }));
  }
});

server.listen(env.port, () => {
  logger.info({ port: env.port }, 'sdmx_api_listening');
});
