import { supabase } from './supabase.js';
import { loadSession, resolveTenantIdFromSession } from './context.js';
import type { ServiceOrderDto } from '@sdmx/contracts';

const DEFAULT_WHATSAPP_BASE = process.env.WHATSAPP_BASE_URL || 'https://wa.me';
const APP_BASE_URL = process.env.APP_BASE_URL || 'https://app.example.com/orders';

export class NotificationsService {
  // Build a simple templated WhatsApp link for an order.
  // Placeholders supported: {{cliente}}, {{folio}}, {{total}}, {{link}}
  async buildWhatsAppLink(token: string, serviceOrderId: string, template?: string, phone?: string) {
    const session = await loadSession(token);
    const tenantId = resolveTenantIdFromSession(session);

    const rows = await supabase.query<ServiceOrderDto[]>(`service_orders?id=eq.${encodeURIComponent(serviceOrderId)}&tenant_id=eq.${encodeURIComponent(tenantId)}&select=*`, token);
    const order = rows && rows[0] ? rows[0] : null;
    if (!order) throw new Error('Orden no encontrada');

    // Try to resolve customer name and phone
    let customerName = 'cliente';
    let customerPhone = phone || '';
    if (order.customer_id) {
      const cust = await supabase.query<any[]>(`customers?id=eq.${encodeURIComponent(order.customer_id)}&tenant_id=eq.${encodeURIComponent(tenantId)}&select=*`, token);
      if (cust && cust[0]) {
        customerName = cust[0].full_name || customerName;
        customerPhone = customerPhone || (cust[0].phone || '');
      }
    }

    const total = (order as any).total_mxn ?? (order as any).estimated_cost ?? '0.00';
    const orderLink = `${APP_BASE_URL}/${encodeURIComponent(order.folio || order.id)}`;

    const tpl = template || 'Hola {{cliente}}, su orden {{folio}} tiene un total de ${{total}}. Ver detalles: {{link}}';
    const message = tpl
      .replace(/{{cliente}}/g, String(customerName))
      .replace(/{{folio}}/g, String(order.folio || order.id))
      .replace(/{{total}}/g, String(total))
      .replace(/{{link}}/g, orderLink);

    if (!customerPhone) {
      // Return encoded message only
      const encoded = encodeURIComponent(message);
      return `${DEFAULT_WHATSAPP_BASE}/?text=${encoded}`;
    }

    // Normalize phone: strip non-digits
    const digits = String(customerPhone).replace(/\D/g, '');
    const encoded = encodeURIComponent(message);
    return `${DEFAULT_WHATSAPP_BASE}/${digits}?text=${encoded}`;
  }
}

export const notificationsService = new NotificationsService();
