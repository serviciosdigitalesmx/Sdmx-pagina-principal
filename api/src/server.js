import http from 'node:http';

const port = Number(process.env.API_PORT ?? 3001);
const openaiApiKey = process.env.OPENAI_API_KEY ?? '';
const openaiModel = process.env.OPENAI_MODEL ?? 'gpt-5.4-mini';
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? '';

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function applyCors(res, origin) {
  if (!origin) return;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

async function handleChat(req, res) {
  if (!openaiApiKey) {
    sendJson(res, 500, {
      error: 'OPENAI_API_KEY is not configured'
    });
    return;
  }

  const body = await readBody(req);
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!message) {
    sendJson(res, 400, {
      error: 'message is required'
    });
    return;
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: openaiModel,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text:
                'Eres el asistente de ayuda de un SaaS multi-tenant. Responde en español, con tono directo y útil. Si el usuario pide soporte técnico, guía con pasos concretos y pide solo la información mínima necesaria. No inventes datos. Si falta información, dilo.'
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: message
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    sendJson(res, response.status, {
      error: 'OpenAI request failed',
      details: errorText
    });
    return;
  }

  const data = await response.json();
  const reply =
    data.output_text ??
    data.output?.flatMap((item) => item.content ?? []).find((chunk) => chunk?.text)?.text ??
    '';

  sendJson(res, 200, {
    reply: typeof reply === 'string' ? reply : ''
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  applyCors(res, frontendOrigin || req.headers.origin || '');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/chat') {
      await handleChat(req, res);
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    sendJson(res, 500, {
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

server.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
