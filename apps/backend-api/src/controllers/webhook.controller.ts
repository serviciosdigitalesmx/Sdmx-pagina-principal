import { Request, Response } from 'express';
import { createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const webhookSecret = process.env.MP_WEBHOOK_SECRET;

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

function buildSignature(paymentId: string, type: string, signature: string): boolean {
  if (!webhookSecret) return true;
  try {
    const parts = signature.split(',').reduce((acc, part) => {
      const [k, v] = part.split('=');
      if (k && v) acc[k.trim()] = v.trim();
      return acc;
    }, {} as Record<string, string>);
    const { ts, v1 } = parts;
    if (!ts || !v1) return false;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - Number(ts)) > 600) return false;
    const template = `id:${paymentId};topic:${type};ts:${ts};`;
    const computed = createHmac('sha256', webhookSecret).update(template).digest('hex');
    return computed === v1;
  } catch (e) { return false; }
}

function mapPaymentStatus(status: string): 'pending' | 'active' | 'past_due' | 'canceled' {
  const mapping: any = { approved: 'active', rejected: 'canceled', in_process: 'pending', pending: 'pending' };
  return mapping[status] || 'past_due';
}

export const handleMercadoPagoWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-signature'] as string;
    const payload = req.body;
    const type = String(payload.type || payload.action || '');
    const paymentId = String(payload.data?.id || payload.id || '');

    if (!paymentId || (!type.includes('payment') && !payload.action)) {
      return res.status(200).json({ received: true });
    }

    if (signature && !buildSignature(paymentId, type, signature)) {
      return res.status(403).json({ error: 'Firma inválida' });
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { authorization: `Bearer ${mpAccessToken}` }
    });

    if (!response.ok) throw new Error('Error al consultar pago en MP');
    const payment = await response.json();
    const { tenantId, plan = 'basic' } = payment.metadata || {};

    if (tenantId) {
      const status = mapPaymentStatus(payment.status);
      const expiresAt = payment.status === 'approved' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
        : null;

      await supabase.from('subscriptions').upsert({
        tenant_id: tenantId,
        plan,
        status,
        provider: 'mercadopago',
        external_id: String(payment.id),
        current_period_end: expiresAt,
        raw_payload: payment
      }, { onConflict: 'tenant_id,provider' });

      await supabase.from('audit_events').insert({
        tenant_id: tenantId,
        event_type: 'billing.mercadopago_webhook',
        action: 'billing.mercadopago_webhook',
        payload: { paymentId, status: payment.status }
      });
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};
