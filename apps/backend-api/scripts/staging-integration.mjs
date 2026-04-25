#!/usr/bin/env node

const required = ['STAGING_API_URL', 'STAGING_SUPABASE_URL', 'STAGING_SUPABASE_SERVICE_ROLE_KEY', 'STAGING_SUPABASE_ANON_KEY', 'STAGING_TEST_EMAIL', 'STAGING_TEST_PASSWORD'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing env var: ${key}`);
  }
}

const {
  STAGING_API_URL,
  STAGING_SUPABASE_URL,
  STAGING_SUPABASE_SERVICE_ROLE_KEY,
  STAGING_TEST_EMAIL,
  STAGING_TEST_PASSWORD,
  STAGING_TEST_TENANT_ID,
  STAGING_SUPABASE_ANON_KEY
} = process.env;

const supabaseFetch = async (path, init = {}) => {
  const response = await fetch(`${STAGING_SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: STAGING_SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${STAGING_SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
      ...(init.headers ?? {})
    }
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${text}`);
  return json;
};

const apiFetch = async (path, init = {}, token) => {
  const response = await fetch(`${STAGING_API_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: token ? `Bearer ${token}` : '',
      ...(init.headers ?? {})
    }
  });

  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    throw new Error(`API ${response.status}: ${JSON.stringify(payload)}`);
  }
  return payload.data ?? payload;
};

const run = async () => {
  const login = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: STAGING_TEST_EMAIL, password: STAGING_TEST_PASSWORD })
  });

  const token = login.accessToken;
  if (!token) throw new Error('No accessToken returned from login');

  const tenantId = STAGING_TEST_TENANT_ID ?? String(login.user?.tenant_id ?? '');
  if (!tenantId) throw new Error('Unable to resolve tenant id for staging tests');

  const stamp = Date.now();
  const customerEmail = `staging.${stamp}@example.com`;

  const customer = await apiFetch('/api/customers', {
    method: 'POST',
    body: JSON.stringify({ tenantId, fullName: `Staging Customer ${stamp}`, email: customerEmail })
  }, token);

  const order = await apiFetch('/api/service-orders', {
    method: 'POST',
    body: JSON.stringify({
      tenantId,
      customerId: customer.id,
      deviceType: 'laptop',
      deviceBrand: 'Lenovo',
      deviceModel: 'T14',
      reportedIssue: 'integration-test'
    })
  }, token);

  const orderId = String(order.id);
  if (!orderId) throw new Error('No service order id returned');

  const timeline = await apiFetch(`/api/service-orders/${orderId}/timeline`, {}, token);
  if (!Array.isArray(timeline)) throw new Error('Timeline endpoint did not return an array');

  const auditEvents = await apiFetch('/api/admin/audit-events?limit=20', {}, token);
  if (!Array.isArray(auditEvents)) throw new Error('Audit endpoint did not return an array');

  await supabaseFetch(`/rest/v1/service_orders?id=eq.${encodeURIComponent(orderId)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  await supabaseFetch(`/rest/v1/customers?id=eq.${encodeURIComponent(String(customer.id))}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });

  // crude RLS check: unauthenticated users should not read tenant data
  const anonymousRead = await fetch(`${STAGING_SUPABASE_URL}/rest/v1/service_orders?select=id&limit=1`, {
    headers: { apikey: STAGING_SUPABASE_ANON_KEY }
  });
  if (anonymousRead.status !== 401) {
    throw new Error(`Expected anonymous RLS rejection, received status ${anonymousRead.status}`);
  }

  console.log('Staging integration checks passed');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
