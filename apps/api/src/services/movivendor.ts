import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { supabaseAdmin, getTenantClient } from '@white-label/database';

const DEFAULT_BASE_URL = 'https://restdev.movivendor.com';
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 12;

export type MovivendorAccountStatus = 'pending' | 'active' | 'credentials_error' | 'suspended';
export type MovivendorActivationStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'active' | 'suspended';
export type MovivendorTransactionStatus = 'pending' | 'checking' | 'approved' | 'rejected' | 'failed' | 'voided';

export type MovivendorActivationRequestRow = {
  id: string;
  tenant_id: string;
  tenant_slug: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  status: MovivendorActivationStatus;
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MovivendorTenantAccountRow = {
  id: string;
  tenant_id: string;
  movivendor_user: string;
  movivendor_password_encrypted: string;
  movivendor_ident: string;
  movivendor_terminal: string;
  token_expires_at: string | null;
  status: MovivendorAccountStatus;
  last_validation_error: string | null;
  last_validated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MovivendorTransactionRow = {
  id: string;
  tenant_id: string;
  user_id: string | null;
  external_id: string;
  product: string;
  subprod: string | null;
  destination: string;
  amount: number;
  confirmation: string | null;
  trace: string | null;
  pin: string | null;
  customer_balance: number | null;
  status: MovivendorTransactionStatus;
  response_code: string | null;
  response_message: string | null;
  raw_request: Record<string, unknown>;
  raw_response: Record<string, unknown>;
  payment_method: string | null;
  branch_id: string | null;
  commission: number | null;
  created_at: string;
  updated_at: string;
};

type MovivendorTokenResponse = {
  token?: string;
  expires_in?: number;
  expire_seconds?: number;
  access_token?: string;
  error?: string;
  message?: string;
};

type MovivendorBalanceResponse = {
  balance?: number | string;
  customer_balance?: number | string;
  available_balance?: number | string;
  error?: string;
  message?: string;
};

type MovivendorProduct = {
  product?: string;
  subprod?: string;
  description?: string;
  amount?: number | string;
  price?: number | string;
  category?: string;
  subcategory?: string;
  type?: string;
  [key: string]: unknown;
};

type MovivendorTxResponse = {
  confirmation?: string;
  trace?: string;
  pin?: string;
  customer_balance?: number | string;
  response_code?: string;
  response_message?: string;
  message?: string;
  status?: string;
  error?: string;
  [key: string]: unknown;
};

function normalizeBaseUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return DEFAULT_BASE_URL;
  return trimmed.replace(/\/$/, '');
}

function requireEncryptionSecret() {
  const secret = process.env.MOVIVENDOR_CRYPTO_SECRET?.trim();
  if (!secret) {
    throw new Error('MOVIVENDOR_CRYPTO_SECRET no configurado');
  }
  return createHash('sha256').update(secret).digest();
}

function encryptSecret(value: string) {
  const key = requireEncryptionSecret();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join(':');
}

function decryptSecret(value: string) {
  const [version, iv, tag, data] = value.split(':');
  if (version !== 'v1' || !iv || !tag || !data) {
    throw new Error('Formato de credencial inválido');
  }

  const key = requireEncryptionSecret();
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data, 'base64url')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

async function vendorFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const baseUrl = normalizeBaseUrl(process.env.MOVIVENDOR_REST_BASE_URL);
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((payload as MovivendorTokenResponse | MovivendorTxResponse | MovivendorBalanceResponse)?.error || (payload as any)?.message || `Movivendor HTTP ${response.status}`);
  }

  return payload as T;
}

async function getTenantAccountRow(tenantId: string): Promise<MovivendorTenantAccountRow | null> {
  const { data, error } = await supabaseAdmin
    .from('movivendor_tenant_accounts')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) throw error;
  return data as MovivendorTenantAccountRow | null;
}

async function enableMovivendorModule(tenantId: string) {
  await supabaseAdmin
    .from('tenant_enabled_modules')
    .upsert([{
      tenant_id: tenantId,
      module_key: 'movivendor',
      module_label: 'Movivendor',
      enabled: true,
      sort_order: 99,
      metadata: { source: 'movivendor_account_validation' },
    }], { onConflict: 'tenant_id,module_key' })
    .select('id')
    .maybeSingle();
}

export async function listActivationRequests() {
  const { data, error } = await supabaseAdmin
    .from('movivendor_activation_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as MovivendorActivationRequestRow[];
}

export async function createActivationRequest(input: {
  tenantId: string;
  tenantSlug: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
}) {
  const { data, error } = await supabaseAdmin
    .from('movivendor_activation_requests')
    .insert([{
      tenant_id: input.tenantId,
      tenant_slug: input.tenantSlug,
      business_name: input.businessName,
      owner_name: input.ownerName,
      email: input.email,
      phone: input.phone,
      status: 'pending',
    }])
    .select('*')
    .single();

  if (error) throw error;
  try {
    await supabaseAdmin.from('audit_logs').insert([{
      tenant_id: input.tenantId,
      action: 'movivendor.activation.request_created',
      data_after: data,
      created_at: new Date().toISOString(),
    }]);
  } catch {
    // Audit logging must not block activation request creation.
  }
  return data as MovivendorActivationRequestRow;
}

export async function updateActivationRequest(id: string, input: { status: MovivendorActivationStatus; reviewNotes?: string | null; reviewedBy?: string | null }) {
  const { data, error } = await supabaseAdmin
    .from('movivendor_activation_requests')
    .update({
      status: input.status,
      review_notes: input.reviewNotes ?? null,
      reviewed_by: input.reviewedBy ?? null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  try {
    await supabaseAdmin.from('audit_logs').insert([{
      tenant_id: data.tenant_id,
      action: `movivendor.activation.${input.status}`,
      data_after: data,
      created_at: new Date().toISOString(),
    }]);
  } catch {
    // Audit logging must not block activation updates.
  }
  return data as MovivendorActivationRequestRow;
}

export async function getActivationStatus(tenantId: string) {
  const [request, account] = await Promise.all([
    supabaseAdmin.from('movivendor_activation_requests').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    getTenantAccountRow(tenantId),
  ]);

  if (request.error) throw request.error;

  return {
    activationRequest: (request.data as MovivendorActivationRequestRow | null) ?? null,
    account: account ? {
      ...account,
      movivendor_password_encrypted: undefined,
    } : null,
  };
}

export async function saveTenantAccount(input: {
  tenantId: string;
  movivendorUser: string;
  movivendorPassword: string;
  movivendorIdent: string;
  movivendorTerminal: string;
}) {
  const encryptedPassword = encryptSecret(input.movivendorPassword);
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('movivendor_tenant_accounts')
    .upsert([{
      tenant_id: input.tenantId,
      movivendor_user: input.movivendorUser,
      movivendor_password_encrypted: encryptedPassword,
      movivendor_ident: input.movivendorIdent,
      movivendor_terminal: input.movivendorTerminal,
      status: 'pending',
      updated_at: now,
      created_at: now,
    }], { onConflict: 'tenant_id' })
    .select('*')
    .single();

  if (error) throw error;

  await supabaseAdmin.from('tenants').update({
    movivendor_status: 'pending',
    movivendor_updated_at: now,
  }).eq('id', input.tenantId);

  return await validateTenantAccount(data as MovivendorTenantAccountRow);
}

export async function validateTenantAccount(account: MovivendorTenantAccountRow) {
  try {
    const token = await generateVendorToken(account);
    const expiresIn = Number(token.expires_in ?? token.expire_seconds ?? 3600);
    const { data, error } = await supabaseAdmin
      .from('movivendor_tenant_accounts')
      .update({
        status: 'active',
        token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        last_validation_error: null,
        last_validated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', account.tenant_id)
      .select('*')
      .single();

    if (error) throw error;
    await supabaseAdmin.from('tenants').update({
      movivendor_status: 'active',
      movivendor_updated_at: new Date().toISOString(),
    }).eq('id', account.tenant_id);
    await enableMovivendorModule(account.tenant_id);
    return data as MovivendorTenantAccountRow;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error validando credenciales';
    const { data, error: updateError } = await supabaseAdmin
      .from('movivendor_tenant_accounts')
      .update({
        status: 'credentials_error',
        last_validation_error: message,
        last_validated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', account.tenant_id)
      .select('*')
      .single();

    if (updateError) throw updateError;
    await supabaseAdmin.from('tenants').update({
      movivendor_status: 'credentials_error',
      movivendor_updated_at: new Date().toISOString(),
    }).eq('id', account.tenant_id);
    throw new Error(message);
  }
}

export async function generateVendorToken(account: MovivendorTenantAccountRow) {
  const password = decryptSecret(account.movivendor_password_encrypted);
  return vendorFetch<MovivendorTokenResponse>('/v1/generate/token', {
    user: account.movivendor_user,
    password,
    ident: account.movivendor_ident,
    expire_seconds: 3600,
  });
}

export async function getVendorToken(account: MovivendorTenantAccountRow) {
  const tokenResult = await generateVendorToken(account);
  const token = tokenResult.token || tokenResult.access_token;
  if (!token) throw new Error('Movivendor no devolvió token');
  return token;
}

export async function fetchProducts(tenantId: string) {
  const account = await getTenantAccountRow(tenantId);
  if (!account || account.status !== 'active') {
    throw new Error('Movivendor no está activo para este tenant');
  }
  return callWithToken<MovivendorProduct[]>('/v1/account/products', account, {});
}

export async function fetchBalance(tenantId: string) {
  const account = await getTenantAccountRow(tenantId);
  if (!account || account.status !== 'active') {
    throw new Error('Movivendor no está activo para este tenant');
  }
  return callWithToken<MovivendorBalanceResponse>('/v1/account/balance', account, {});
}

async function callWithToken<T>(path: string, account: MovivendorTenantAccountRow, body: Record<string, unknown>) {
  const token = await getVendorToken(account);
  return vendorFetch<T>(path, {
    token,
    ...body,
  });
}

export async function createTransaction(input: {
  tenantId: string;
  userId: string | null;
  externalId: string;
  product: string;
  subprod: string | null;
  destination: string;
  amount: number;
  paymentMethod?: string | null;
  branchId?: string | null;
  commission?: number | null;
  rawRequest?: Record<string, unknown>;
}) {
  const existing = await supabaseAdmin
    .from('movivendor_transactions')
    .select('*')
    .eq('external_id', input.externalId)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data) return existing.data as MovivendorTransactionRow;

  const { data, error } = await supabaseAdmin
    .from('movivendor_transactions')
    .insert([{
      tenant_id: input.tenantId,
      user_id: input.userId,
      external_id: input.externalId,
      product: input.product,
      subprod: input.subprod,
      destination: input.destination,
      amount: input.amount,
      status: 'pending',
      raw_request: input.rawRequest ?? {},
      payment_method: input.paymentMethod ?? null,
      branch_id: input.branchId ?? null,
      commission: input.commission ?? null,
    }])
    .select('*')
    .single();

  if (error) throw error;
  return data as MovivendorTransactionRow;
}

export async function updateTransactionByExternalId(externalId: string, patch: Partial<MovivendorTransactionRow>) {
  const { data, error } = await supabaseAdmin
    .from('movivendor_transactions')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('external_id', externalId)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return data as MovivendorTransactionRow | null;
}

export async function listTransactions(tenantId: string) {
  const { data, error } = await supabaseAdmin
    .from('movivendor_transactions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw error;
  return (data ?? []) as MovivendorTransactionRow[];
}

export async function executeSale(input: {
  tenantId: string;
  userId: string | null;
  externalId: string;
  product: string;
  subprod: string | null;
  destination: string;
  amount: number;
  paymentMethod?: string | null;
  branchId?: string | null;
  commission?: number | null;
  rawRequest?: Record<string, unknown>;
}) {
  const account = await getTenantAccountRow(input.tenantId);
  if (!account || account.status !== 'active') {
    throw new Error('Movivendor no está activo para este tenant');
  }

  const transaction = await createTransaction(input);
  const payload = {
    token: await getVendorToken(account),
    id: input.externalId,
    terminal: account.movivendor_terminal,
    product: input.product,
    subprod: input.subprod ?? '',
    destination: input.destination,
    amount: input.amount,
  };

  try {
    const result = await vendorFetch<MovivendorTxResponse>('/v1/do/tx', payload);
    return await finalizeTransaction(transaction.external_id, input.tenantId, {
      status: 'approved',
      response_code: result.response_code ?? '200',
      response_message: result.response_message ?? result.message ?? null,
      confirmation: result.confirmation ?? null,
      trace: result.trace ?? null,
      pin: result.pin ?? null,
      customer_balance: toNumberOrNull(result.customer_balance),
      raw_response: result as Record<string, unknown>,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al ejecutar la venta';
    if (message.includes('504')) {
      await updateTransactionByExternalId(input.externalId, {
        status: 'checking',
        response_code: '504',
        response_message: 'Gateway Timeout',
        raw_response: { timeout: true, message },
      } as Partial<MovivendorTransactionRow>);

      return pollTransactionStatus(account, input.tenantId, input.externalId, payload);
    }

    return finalizeTransaction(transaction.external_id, input.tenantId, {
      status: 'failed',
      response_code: '500',
      response_message: message,
      raw_response: { error: message },
    });
  }
}

function toNumberOrNull(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : null;
}

async function finalizeTransaction(externalId: string, tenantId: string, patch: Partial<MovivendorTransactionRow>) {
  const updated = await updateTransactionByExternalId(externalId, patch);
  try {
    await supabaseAdmin.from('audit_logs').insert([{
      tenant_id: tenantId,
      action: `movivendor.transaction.${patch.status ?? 'updated'}`,
      data_after: updated ?? patch,
      created_at: new Date().toISOString(),
    }]);
  } catch {
    // Audit logging must not block transaction updates.
  }
  return updated;
}

async function pollTransactionStatus(account: MovivendorTenantAccountRow, tenantId: string, externalId: string, originalPayload: Record<string, unknown>) {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    const result = await vendorFetch<MovivendorTxResponse>('/v1/check/tx', originalPayload);
    const resolvedStatus = normalizeVendorStatus(result.status, result.response_code, result.response_message);
    if (resolvedStatus === 'checking') {
      continue;
    }
    return finalizeTransaction(externalId, tenantId, {
      status: resolvedStatus,
      response_code: result.response_code ?? null,
      response_message: result.response_message ?? result.message ?? null,
      confirmation: result.confirmation ?? null,
      trace: result.trace ?? null,
      pin: result.pin ?? null,
      customer_balance: toNumberOrNull(result.customer_balance),
      raw_response: result as Record<string, unknown>,
    });
  }

  return updateTransactionByExternalId(externalId, {
    status: 'checking',
    response_message: 'Pendiente de confirmación en Movivendor',
  } as Partial<MovivendorTransactionRow>);
}

function normalizeVendorStatus(status?: string, responseCode?: string | null, responseMessage?: string | null): MovivendorTransactionStatus {
  const raw = `${status ?? ''} ${responseCode ?? ''} ${responseMessage ?? ''}`.toLowerCase();
  if (raw.includes('approved') || raw.includes('aprob')) return 'approved';
  if (raw.includes('rejected') || raw.includes('rechaz')) return 'rejected';
  if (raw.includes('void')) return 'voided';
  if (raw.includes('timeout') || raw.includes('pend') || raw.includes('checking')) return 'checking';
  return 'failed';
}

export async function executeService(input: {
  tenantId: string;
  userId: string | null;
  externalId: string;
  product: string;
  subprod: string | null;
  destination: string;
  amount: number;
  paymentMethod?: string | null;
  branchId?: string | null;
  commission?: number | null;
  rawRequest?: Record<string, unknown>;
}) {
  const account = await getTenantAccountRow(input.tenantId);
  if (!account || account.status !== 'active') {
    throw new Error('Movivendor no está activo para este tenant');
  }

  const balanceCheck = await vendorFetch<MovivendorTxResponse>('/v1/query/tx', {
    token: await getVendorToken(account),
    id: input.externalId,
    terminal: account.movivendor_terminal,
    product: input.product,
    subprod: input.subprod ?? '',
    destination: input.destination,
    amount: input.amount,
  });

  const updated = await supabaseAdmin
    .from('movivendor_transactions')
    .upsert([{
      tenant_id: input.tenantId,
      user_id: input.userId,
      external_id: input.externalId,
      product: input.product,
      subprod: input.subprod,
      destination: input.destination,
      amount: input.amount,
      customer_balance: toNumberOrNull(balanceCheck.customer_balance),
      status: 'pending',
      raw_request: input.rawRequest ?? {},
      payment_method: input.paymentMethod ?? null,
      branch_id: input.branchId ?? null,
      commission: input.commission ?? null,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }], { onConflict: 'external_id' })
    .select('*')
    .single();

  if (updated.error) throw updated.error;

  return executeSale({
    ...input,
    rawRequest: {
      ...(input.rawRequest ?? {}),
      customer_balance: toNumberOrNull(balanceCheck.customer_balance),
      balance_check: balanceCheck as Record<string, unknown>,
    },
  });
}

export async function fetchTransactionStatus(tenantId: string, externalId: string) {
  const { data, error } = await supabaseAdmin
    .from('movivendor_transactions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('external_id', externalId)
    .maybeSingle();

  if (error) throw error;
  return data as MovivendorTransactionRow | null;
}

export function decryptMovivendorPassword(encrypted: string) {
  return decryptSecret(encrypted);
}

export function getTenantMovivendorClient(tenantId: string) {
  return getTenantClient(tenantId);
}
