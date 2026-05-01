import { createHmac } from 'node:crypto';
import { supabase } from './supabase.js';
import { loadSession, mpSettings, resolveTenantIdFromSession } from './context.js';
import { logger } from '../core/logger.js';
import type { CheckoutRequestDto, CheckoutResponseDto, PlanCode, SubscriptionDto } from '@sdmx/contracts';

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

const prices: Record<PlanCode, number> = {
  basic: 300,
  pro: 450,
  enterprise: 600
};

const addPaidPeriod = (base: Date): string => {
  const expires = new Date(base);
  expires.setDate(expires.getDate() + 30);
  return expires.toISOString();
};

export const billingService = {
  async createCheckout(token: string, request: CheckoutRequestDto): Promise<CheckoutResponseDto> {
    const settings = mpSettings();
    if (!settings.accessToken) throw new Error('MP_ACCESS_TOKEN no configurado');

    const session = await loadSession(token);
    const tenantId = resolveTenantIdFromSession(session);
    assert(Boolean(tenantId), 'No se pudo resolver tenant para checkout');

    const amount = prices[request.plan];
    assert(Boolean(amount), 'Plan inválido');

    const preference = {
      items: [
        {
          title: `Servicios Digitales MX - Plan ${request.plan}`,
          quantity: 1,
          currency_id: 'MXN',
          unit_price: amount
        }
      ],
      back_urls: {
        success: `${settings.appUrl}/billing/success`,
        failure: `${settings.appUrl}/billing/failure`,
        pending: `${settings.appUrl}/billing/pending`
      },
      auto_return: 'approved',
      notification_url: `${settings.webhookBaseUrl}/api/webhooks/mercadopago`,
      metadata: {
        tenantId,
        plan: request.plan
      }
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${settings.accessToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(preference)
    });

    const json = (await response.json().catch(() => ({}))) as { init_point?: string; sandbox_init_point?: string; id?: string };
    if (!response.ok) throw new Error('Mercado Pago rechazó la preferencia');

    const initPoint = String(json.init_point || json.sandbox_init_point || '');
    assert(Boolean(initPoint), 'Mercado Pago no devolvió init_point');

    try {
      await supabase.upsertAsService('subscriptions', {
        tenant_id: tenantId,
        plan: request.plan,
        status: 'pending',
        provider: 'mercadopago',
        external_id: String(json.id || `preference_${Date.now()}`),
        raw_payload: json
      }, 'tenant_id,provider');
    } catch (error) {
      logger.error({ error, tenantId }, 'No se pudo registrar la suscripcion pendiente; continuando con la preferencia');
    }

    return {
      initPoint,
      preferenceId: json.id ? String(json.id) : undefined
    };
  },

  async handleMercadoPagoWebhook(payload: unknown, signature?: string, requestId?: string): Promise<{ received: true }> {
    const settings = mpSettings();
    if (!settings.accessToken) throw new Error('MP_ACCESS_TOKEN no configurado');
    const typedPayload = payload as {
      type?: string;
      action?: string;
      data?: { id?: string };
      id?: string | number;
      topic?: string;
    };

    const type = String(typedPayload.type || typedPayload.action || '');
    const paymentId = String(typedPayload.data?.id || typedPayload.id || '');

    if (!paymentId || (!type.includes('payment') && !typedPayload.action)) {
      return { received: true };
    }

    if (settings.webhookBaseUrl && signature) {
      const payloadSignature = this.buildSignature(paymentId, type, signature);
      if (!payloadSignature) throw new Error('Firma inválida');
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { authorization: `Bearer ${settings.accessToken}` }
    });
    const payment = (await response.json().catch(() => ({}))) as {
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
      await supabase.upsertAsService(
        'subscriptions',
        {
          tenant_id: tenantId,
          plan,
          status: this.mapPaymentStatus(String(payment.status || 'pending')),
          provider: 'mercadopago',
          external_id: String(payment.id || paymentId),
          current_period_end: currentPeriodEnd,
          raw_payload: payment
        },
        'tenant_id,provider'
      );
    }

    await this.audit(paymentId, tenantId || 'unknown', 'billing.mercadopago_webhook', {
      paymentId,
      status: payment.status,
      requestId
    });

    return { received: true };
  },

  mapPaymentStatus(status: string): SubscriptionDto['status'] {
    if (status === 'approved') return 'active';
    if (status === 'rejected') return 'canceled';
    if (status === 'in_process') return 'pending';
    if (status === 'pending') return 'pending';
    return 'past_due';
  },

  buildSignature(paymentId: string, type: string, signature: string): boolean {
    const settings = mpSettings();
    if (!settings.webhookSecret) return true;
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
    const computed = createHmac('sha256', settings.webhookSecret).update(template).digest('hex');
    return computed === v1;
  },

  async audit(paymentId: string, tenantId: string, action: string, payload: unknown): Promise<void> {
    await supabase.insertAsService('audit_events', {
      tenant_id: tenantId,
      action,
      payload,
      external_ref: paymentId,
      created_at: new Date().toISOString()
    });
  }
};
