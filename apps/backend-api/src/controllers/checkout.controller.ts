import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const prices: Record<string, number> = {
  basic: 300,
  pro: 450,
  enterprise: 600
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const appUrl = process.env.APP_URL; // URL de Vercel
const webhookBaseUrl = process.env.WEBHOOK_BASE_URL; // URL de Render

const serviceSupabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

export const createCheckoutPreference = async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '').trim();
    const { plan } = req.body;

    if (!token) return res.status(401).json({ error: 'No autorizado' });
    if (!plan || !prices[plan]) return res.status(400).json({ error: 'Plan inválido' });

    // 1. Validar Usuario y obtener Tenant (Arquitectura Real)
    const tempClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { data: { user }, error: userError } = await tempClient.auth.getUser();
    if (userError || !user) throw new Error('Sesión inválida');

    // Extraer tenant_id (Metadata centralizada)
    const tenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id;
    if (!tenantId) throw new Error('No se pudo resolver tenant del usuario');

    // 2. Crear Preferencia en Mercado Pago
    const preference = {
      items: [{
        title: `Servicios Digitales MX - Plan ${plan}`,
        quantity: 1,
        currency_id: 'MXN',
        unit_price: prices[plan]
      }],
      back_urls: {
        success: `${appUrl}/billing/success`,
        failure: `${appUrl}/billing/failure`,
        pending: `${appUrl}/billing/pending`
      },
      auto_return: 'approved',
      notification_url: `${webhookBaseUrl}/api/webhooks/mercadopago`,
      metadata: { tenantId, plan }
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preference)
    });

    const json = await mpRes.json();
    if (!mpRes.ok) throw new Error('Error con Mercado Pago');

    const initPoint = json.init_point || json.sandbox_init_point;

    // 3. Registrar en DB (Service Role)
    await serviceSupabase.from('subscriptions').upsert({
      tenant_id: tenantId,
      plan,
      status: 'pending',
      provider: 'mercadopago',
      external_id: String(json.id),
      raw_payload: json
    }, { onConflict: 'tenant_id,provider' });

    await serviceSupabase.from('audit_events').insert({
      tenant_id: tenantId,
      event_type: 'billing.checkout_created',
      payload: { plan, preferenceId: json.id }
    });

    return res.status(200).json({ success: true, initPoint, preferenceId: json.id });

  } catch (error: any) {
    console.error('[Checkout Error]:', error.message);
    return res.status(400).json({ error: error.message });
  }
};
