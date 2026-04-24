import { createServer } from 'node:http';
import { env } from './config/env.js';
import { handleApi } from './routes/api.js';
import { serverError } from './core/http.js';

const withCors = (req: Request, res: Response): Response => {
  const origin = req.headers.get('origin');
  const headers = new Headers(res.headers);

  if (origin && env.corsAllowedOrigins.includes(origin)) {
    headers.set('access-control-allow-origin', origin);
    headers.set('vary', 'origin');
  }
  headers.set('access-control-allow-methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  headers.set('access-control-allow-headers', 'content-type,authorization');

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
  } catch {
    const response = withCors(request, serverError());
    outgoing.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    outgoing.end(JSON.stringify({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Error interno' } }));
  }
});

server.listen(env.port, () => {
  console.log(`SDMX API listening on ${env.port}`);
});
