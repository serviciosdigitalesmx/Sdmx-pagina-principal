import { NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { tenantIdFromAuthUser } from '@/lib/tenant';

type PlanCode = 'basic' | 'pro' | 'enterprise';

const prices: Record<PlanCode, number> = {
  basic: 300,
  pro: 450,
  enterprise: 600
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mpAccessToken = process.env.MP_ACCESS_TOKEN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
const webhookBaseUrl = process.env.WEBHOOK_BASE_URL || process.env.BACKEND_PUBLIC_URL || appUrl;

function serverSupabase(jwt?: string) {
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase environment variables are required');
  return createClient(supabaseUrl, supabaseAnonKey, jwt ? { global: { headers: { authorization: `Bearer ${jwt}` } } } : undefined);
}

function serviceClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY no definido');
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

async function resolveTenantId(token: string) {
  const supabase = serverSupabase(token);
  const { data: userRes, error: userError } = await supabase.auth.getUser(token);
  if (userError) throw userError;
  const user = userRes.user;
  if (!user) throw new Error('Usuario no autenticado');
  const tenantId = tenantIdFromAuthUser(user);
  if (!tenantId) throw new Error('No se pudo resolver tenant');
  return String(tenantId);
}

export async function POST(request: Request) {
  try {
    const auth = request.headers.get('authorization') || '';
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
    if (!token) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autorizado' } }, { status: 401 });
    if (!mpAccessToken) throw new Error('MP_ACCESS_TOKEN no configurado');
    if (!appUrl || !webhookBaseUrl) throw new Error('APP_URL/WEBHOOK_BASE_URL no configurado');

    const body = await request.json().catch(() => null) as { plan?: PlanCode } | null;
    const plan = body?.plan;
    if (!plan || !(plan in prices)) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'plan es obligatorio' } }, { status: 400 });
    }

    const tenantId = await resolveTenantId(token);
    const preference = {
      items: [
        {
          title: `Servicios Digitales MX - Plan ${plan}`,
          quantity: 1,
          currency_id: 'MXN',
          unit_price: prices[plan]
        }
      ],
      back_urls: {
        success: `${appUrl}/billing/success`,
        failure: `${appUrl}/billing/failure`,
        pending: `${appUrl}/billing/pending`
      },
      auto_return: 'approved',
      notification_url: `${webhookBaseUrl.replace(/\/$/, '')}/api/webhooks/mercadopago`,
      metadata: { tenantId, plan }
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${mpAccessToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(preference)
    });

    const json = await mpRes.json().catch(() => ({}));
    if (!mpRes.ok) {
      return NextResponse.json({ success: false, error: { code: 'DOMAIN_ERROR', message: 'Mercado Pago rechazó la preferencia' } }, { status: 400 });
    }

    const initPoint = String(json.init_point || json.sandbox_init_point || '');
    if (!initPoint) throw new Error('Mercado Pago no devolvió init_point');

    const service = serviceClient();
    await service.from('subscriptions').upsert({
      tenant_id: tenantId,
      plan,
      status: 'pending',
      provider: 'mercadopago',
      external_id: String(json.id || `preference_${Date.now()}`),
      raw_payload: json
    }, { onConflict: 'tenant_id,provider' });

    await service.from('audit_events').insert({
      tenant_id: tenantId,
      event_type: 'billing.checkout_created',
      action: 'billing.checkout_created',
      payload: { plan, preferenceId: json.id, initPoint },
      created_at: new Date().toISOString()
    });

    return NextResponse.json({ success: true, data: { initPoint, preferenceId: json.id ? String(json.id) : undefined } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ success: false, error: { code: 'DOMAIN_ERROR', message } }, { status: 400 });
  }
}
