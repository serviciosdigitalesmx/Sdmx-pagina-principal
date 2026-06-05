#!/usr/bin/env node
import https from 'node:https';

const liveChecks = [
  { endpoint: 'GET /api/health', url: 'https://api.serviciosdigitales.online/api/health', expected: [200], kind: 'public' },
  { endpoint: 'GET /api', url: 'https://api.serviciosdigitales.online/api', expected: [200], kind: 'public' },
  { endpoint: 'GET /api/auth/me', url: 'https://api.serviciosdigitales.online/api/auth/me', expected: [200, 401], kind: 'protected' },
  { endpoint: 'GET /login', url: 'https://serviciosdigitalesmx.online/login', expected: [200], kind: 'frontend' },
  { endpoint: 'GET /auth/bridge', url: 'https://app.serviciosdigitalesmx.online/auth/bridge', expected: [200], kind: 'frontend' },
  { endpoint: 'GET /dashboard', url: 'https://app.serviciosdigitalesmx.online/dashboard', expected: [200], kind: 'frontend' },
  { endpoint: 'GET /onboarding', url: 'https://serviciosdigitalesmx.online/onboarding', expected: [200], kind: 'frontend' },
  { endpoint: 'GET /billing', url: 'https://serviciosdigitalesmx.online/billing', expected: [200], kind: 'frontend' },
  { endpoint: 'GET /t/:tenantSlug/portal', url: 'https://serviciosdigitalesmx.online/t/srfix/portal', expected: [200], kind: 'frontend' },
  { endpoint: 'GET /api/public/tenant/:tenantSlug/landing', url: 'https://api.serviciosdigitales.online/api/public/tenant/srfix/landing', expected: [200], kind: 'public' },
  { endpoint: 'GET /api/public/tenant/:tenantSlug/orders/:folio', url: 'https://api.serviciosdigitales.online/api/public/tenant/srfix/orders/SRF-00106', expected: [200, 404], kind: 'public' },
];

const declared = new Set([
  'GET /api/health',
  'GET /api',
  'GET /api/auth/me',
  'GET /api/public/tenant/:tenantSlug/landing',
  'GET /api/public/tenant/:tenantSlug/orders/:folio',
  'GET /api/auth/register',
  'GET /api/auth/google',
  'GET /api/auth/google/complete',
  'POST /api/auth/exchange',
  'GET /login',
  'GET /auth/bridge',
  'GET /dashboard',
  'GET /onboarding',
  'GET /billing',
]);

const documented = new Set([
  'GET /api/health',
  'GET /api',
  'GET /api/auth/me',
  'GET /api/public/tenant/:tenantSlug/landing',
  'GET /api/public/tenant/:tenantSlug/orders/:folio',
  'GET /login',
  'GET /auth/bridge',
  'GET /dashboard',
  'GET /onboarding',
  'GET /billing',
]);

function request(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'GET' }, (res) => {
      res.resume();
      resolve({ status: res.statusCode ?? 0 });
    });
    req.on('error', (error) => resolve({ status: 0, error: error.message }));
    req.end();
  });
}

for (const item of liveChecks) {
  const result = await request(item.url);
  const ok = item.expected.includes(result.status);
  const row = {
    endpoint: item.endpoint,
    kind: item.kind,
    declared: declared.has(item.endpoint),
    documented: documented.has(item.endpoint),
    live: result.status > 0,
    status: result.status,
    expected: item.expected,
    drift: ok ? null : (result.status >= 500 ? 'server_error' : 'unexpected_status'),
  };
  console.log(JSON.stringify(row));
}
