import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { env } from './config/env.js';
import { handleApi } from './routes/api.js';
import { serverError } from './core/http.js';

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
    if (request.method === 'OPTIONS') {
      const response = new Response(null, { status: 204 });
      const origin = request.headers.get('origin');
      if (origin && env.corsAllowedOrigins) {
        const allowed = env.corsAllowedOrigins.split(',').map((item) => item.trim()).filter(Boolean);
        if (allowed.includes(origin) || (origin.endsWith('.vercel.app') && allowed.includes('https://*.vercel.app'))) {
          response.headers.set('access-control-allow-origin', origin);
          response.headers.set('vary', 'origin');
        }
      }
      response.headers.set('access-control-allow-methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
      response.headers.set('access-control-allow-headers', 'content-type,authorization');
      outgoing.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      outgoing.end();
      return;
    }

    const response = await handleApi(request);
    const origin = request.headers.get('origin');
    if (origin && env.corsAllowedOrigins) {
      const allowed = env.corsAllowedOrigins.split(',').map((item) => item.trim()).filter(Boolean);
      if (allowed.includes(origin) || (origin.endsWith('.vercel.app') && allowed.includes('https://*.vercel.app'))) {
        response.headers.set('access-control-allow-origin', origin);
        response.headers.set('vary', 'origin');
      }
    }
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
