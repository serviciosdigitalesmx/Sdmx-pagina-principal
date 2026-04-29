import { supabase } from './supabase.js';
import { loadSession, resolveTenantIdFromSession, requireActiveSubscription } from './context.js';
import type { QuoteDto, QuoteCreateRequestDto } from '@sdmx/contracts';

const IVA_RATE = 0.16;
const nowIso = () => new Date().toISOString();

export const quotesService = {
  async listQuotes(token: string): Promise<QuoteDto[]> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    return supabase.query<QuoteDto[]>(`quotations?order=created_at.desc&select=*`, token);
  },

  async createQuote(token: string, request: QuoteCreateRequestDto): Promise<QuoteDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);

    const subtotal = Number(request.subtotalMxn);
    const vat = request.vatMxn > 0 ? Number(request.vatMxn) : Number((subtotal * IVA_RATE).toFixed(2));
    const total = Number((subtotal + vat).toFixed(2));
    const advance = Number(request.advanceMxn ?? 0);
    const balance = Number((total - advance).toFixed(2));

    const created = await supabase.insert<QuoteDto[]>('quotations', token, {
      tenant_id: tenantId,
      service_order_id: request.serviceOrderId,
      subtotal_mxn: subtotal,
      vat_mxn: vat,
      total_mxn: total,
      advance_mxn: advance,
      balance_mxn: balance,
      status: 'draft',
      created_at: nowIso()
    });

    await this.audit(token, 'quote.created', created[0] ?? {});
    return created[0];
  },

  async audit(token: string, action: string, payload: unknown): Promise<void> {
    const session = await loadSession(token);
    const tenantId = resolveTenantIdFromSession(session);
    await supabase.insert('audit_events', token, {
      tenant_id: tenantId,
      actor_user_id: session.user.id,
      action,
      payload,
      created_at: nowIso()
    });
  }
};
