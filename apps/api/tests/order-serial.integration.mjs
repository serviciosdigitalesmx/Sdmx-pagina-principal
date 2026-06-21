import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '.env.local') });
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '.env') });

const port = Number(process.env.SERIAL_TESTS_PORT ?? process.env.PORT ?? 4040);
const baseUrl =
  process.env.SERIAL_TESTS_BASE_URL?.trim()
  || process.env.NEXT_PUBLIC_API_URL?.trim()
  || `http://127.0.0.1:${port}`;
const tenantSlug = process.env.SERIAL_TESTS_TENANT_SLUG?.trim() ?? '';
const tenantId = process.env.SERIAL_TESTS_TENANT_ID?.trim() ?? '';
const authToken = process.env.SERIAL_TESTS_AUTH_TOKEN?.trim() ?? '';
const sucursalId = process.env.SERIAL_TESTS_SUCURSAL_ID?.trim() ?? '';
const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';
const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..', '..', '..');
const runLocalApi = !process.env.SERIAL_TESTS_BASE_URL?.trim();
const missingServerEnv = (runLocalApi ? ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] : [])
  .filter((key) => !process.env[key]?.trim());

if (missingServerEnv.length > 0) {
  console.warn(`Skipping local API boot in serial tests because these env vars are missing: ${missingServerEnv.join(', ')}`);
}

let serverProcess;
const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } })
  : null;

async function waitForHealth() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 45000) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {
      // retry until ready
    }
    await delay(1000);
  }

  throw new Error(`Timed out waiting for API health at ${baseUrl}`);
}

function startServer() {
  if (serverProcess) return;

  serverProcess = spawn('pnpm', ['--dir', 'apps/api', 'dev'], {
    env: { ...process.env, PORT: String(port) },
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stdout.on('data', (chunk) => process.stderr.write(chunk));
  serverProcess.stderr.on('data', (chunk) => process.stderr.write(chunk));
}

async function stopServer() {
  if (!serverProcess) return;

  serverProcess.kill('SIGTERM');
  await delay(2000);
  serverProcess = undefined;
}

async function requestJson(pathname, init) {
  const response = await fetch(`${baseUrl}${pathname}`, init);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body };
}

async function readFieldDefinition(entity) {
  const { data, error } = await supabase
    .from('tenant_field_definitions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('entity', entity)
    .eq('field_key', 'serial_number')
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function setSerialRequired(entity) {
  const previousDefinition = await readFieldDefinition(entity);
  const nextDefinition = {
    id: previousDefinition?.id,
    tenant_id: tenantId,
    entity,
    field_key: 'serial_number',
    field_label: previousDefinition?.field_label ?? 'Serie / IMEI',
    field_type: previousDefinition?.field_type ?? 'text',
    required: true,
    options: previousDefinition?.options ?? [],
    field_order: previousDefinition?.field_order ?? 4,
    placeholder: previousDefinition?.placeholder ?? 'IMEI o numero de serie',
    help_text: previousDefinition?.help_text ?? 'Campo requerido por prueba T03',
    visible: true,
    validation: previousDefinition?.validation ?? {},
    metadata: { ...(previousDefinition?.metadata ?? {}), test_case: 't03_serial_required' },
  };

  const { error } = await supabase
    .from('tenant_field_definitions')
    .upsert(nextDefinition, { onConflict: 'tenant_id,entity,field_key' });

  if (error) throw error;
  return previousDefinition;
}

async function restoreFieldDefinition(entity, previousDefinition) {
  if (previousDefinition) {
    const { error } = await supabase
      .from('tenant_field_definitions')
      .upsert(previousDefinition, { onConflict: 'tenant_id,entity,field_key' });
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('tenant_field_definitions')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('entity', entity)
    .eq('field_key', 'serial_number');

  if (error) throw error;
}

test.before(async () => {
  if (missingServerEnv.length > 0) return;
  if (runLocalApi) startServer();
  await waitForHealth();
});

test.after(async () => {
  if (missingServerEnv.length > 0) return;
  if (runLocalApi) await stopServer();
});

test('POST /api/public/quotes rejects missing serial when tenant requires it', async (t) => {
  if (!supabase || !tenantId || !tenantSlug || missingServerEnv.length > 0) {
    t.skip('SERIAL_TESTS_TENANT_ID, SERIAL_TESTS_TENANT_SLUG, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY are required');
    return;
  }

  const previousDefinition = await setSerialRequired('service_requests');

  try {
    const { response, body } = await requestJson('/api/public/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantSlug,
        fullName: `Serial Public Test ${Date.now()}`,
        phone: `55${String(Date.now()).slice(-8)}`,
        email: '',
        deviceBrand: 'Marca T03',
        deviceModel: 'Modelo T03',
        deviceType: 'Smartphone',
        issue: 'Validar rechazo por serial requerido',
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(body?.error, 'Required device field is missing');
    assert.ok(body?.details?.fields?.includes('serial_number'));
  } finally {
    await restoreFieldDefinition('service_requests', previousDefinition);
  }
});

test('POST /orders rejects missing serial when tenant requires it', async (t) => {
  if (!supabase || !tenantId || !tenantSlug || !authToken || missingServerEnv.length > 0) {
    t.skip('SERIAL_TESTS_TENANT_ID, SERIAL_TESTS_TENANT_SLUG, SERIAL_TESTS_AUTH_TOKEN, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY are required');
    return;
  }

  const previousDefinition = await setSerialRequired('service_orders');

  try {
    const { response, body } = await requestJson(`/api/${encodeURIComponent(tenantSlug)}/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        ...(sucursalId ? { 'x-fixi-sucursal-id': sucursalId, 'x-sucursal-id': sucursalId } : {}),
      },
      body: JSON.stringify({
        clientName: `Serial Order Test ${Date.now()}`,
        clientPhone: `55${String(Date.now()).slice(-8)}`,
        clientEmail: '',
        deviceType: 'Smartphone',
        deviceModel: 'Equipo T03',
        issue: 'Validar rechazo por serial requerido',
        estimatedCost: 0,
        includeIva: false,
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(body?.error, 'Required device field is missing');
    assert.ok(body?.details?.fields?.includes('serial_number'));
  } finally {
    await restoreFieldDefinition('service_orders', previousDefinition);
  }
});
