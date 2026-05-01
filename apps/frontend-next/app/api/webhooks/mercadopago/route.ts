import { NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

type PlanCode = 'basic' | 'pro' | 'enterprise';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mpAccessToken = process.env.MP_ACCESS_TOKEN;
const webhookSecret = process.env.MP_WEBHOOK_SECRET;

function serviceClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY no definido');
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

function buildSignature(paymentId: string, type: string, signature: string): boolean {
  if (!webhookSecret) return true;
  const parts = signature.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {} as Record<string, string>);
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(ts)) > 600) return false;
  const template = `id:${paymentId};topic:${type};ts:${ts};`;
  const computed = createHmac('sha256', webhookSecret).update(template).digest('hex');
  return computed === v1;
}

function mapPaymentStatus(status: string): 'pending' | 'active' | 'past_due' | 'canceled' {
  if (status === 'approved') return 'active';
  if (status === 'rejected') return 'canceled';
  if (status === 'in_process') return 'pending';
  if (status === 'pending') return 'pending';
  return 'past_due';
}

function addPaidPeriod(base: Date): string {
  const expires = new Date(base);
  expires.setDate(expires.getDate() + 30);
  return expires.toISOString();
}

export async function POST(request: Request) {
  try {
    if (!mpAccessToken) throw new Error('MP_ACCESS_TOKEN no configurado');
    const signature = request.headers.get('x-signature') || undefined;
    const requestId = request.headers.get('x-request-id') || undefined;
    const payload = await request.json().catch(() => ({})) as {
      type?: string;
      action?: string;
      data?: { id?: string };
      id?: string | number;
      topic?: string;
    };

    const type = String(payload.type || payload.action || '');
    const paymentId = String(payload.data?.id || payload.id || '');

    if (!paymentId || (!type.includes('payment') && !payload.action)) {
      return NextResponse.json({ received: true });
    }

    if (signature && !buildSignature(paymentId, type, signature)) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Firma inválida' } }, { status: 403 });
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { authorization: `Bearer ${mpAccessToken}` }
    });
    const payment = await response.json().catch(() => ({})) as {
      status?: string;
      metadata?: { tenantId?: string; plan?: PlanCode };
      id?: string;
    };
    if (!response.ok) throw new Error('No se pudo obtener el pago');

    const metadata = payment.metadata ?? {};
    const tenantId = String(metadata.tenantId || '');
    const plan = (metadata.plan || 'basic') as PlanCode;
    const currentPeriodEnd = payment.status === 'approved' ? addPaidPeriod(new Date()) : null;

    if (tenantId) {
      const service = serviceClient();
      await service.from('subscriptions').upsert({
        tenant_id: tenantId,
        plan,
        status: mapPaymentStatus(String(payment.status || 'pending')),
        provider: 'mercadopago',
        external_id: String(payment.id || paymentId),
        current_period_end: currentPeriodEnd,
        raw_payload: payment
      }, { onConflict: 'tenant_id,provider' });

      await service.from('audit_events').insert({
        tenant_id: tenantId,
        event_type: 'billing.mercadopago_webhook',
        action: 'billing.mercadopago_webhook',
        payload: {
          paymentId,
          status: payment.status,
          requestId
        },
        created_at: new Date().toISOString()
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ success: false, error: { code: 'DOMAIN_ERROR', message } }, { status: 400 });
  }
}
