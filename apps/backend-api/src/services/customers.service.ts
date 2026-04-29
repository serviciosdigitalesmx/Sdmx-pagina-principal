import { supabase } from './supabase.js';
import { loadSession, resolveTenantIdFromSession, requireActiveSubscription } from './context.js';
import type {
  CustomerDto,
  CustomerCreateRequestDto,
  CustomerContactDto,
  CustomerContactCreateRequestDto
} from '@sdmx/contracts';

const nowIso = () => new Date().toISOString();

export const customersService = {
  async listCustomers(token: string): Promise<CustomerDto[]> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    return supabase.query<CustomerDto[]>(`customers?order=created_at.desc&select=*`, token);
  },

  async createCustomer(token: string, request: CustomerCreateRequestDto): Promise<CustomerDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);

    const created = await supabase.insert<CustomerDto[]>('customers', token, {
      tenant_id: tenantId,
      branch_id: request.branchId ?? null,
      full_name: request.fullName,
      email: request.email,
      phone: request.phone ?? null,
      created_at: nowIso()
    });

    await this.audit(token, 'customer.created', created[0] ?? {});
    return created[0];
  },

  async listCustomerContacts(token: string, customerId: string): Promise<CustomerContactDto[]> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    return supabase.query<CustomerContactDto[]>(`customer_contacts?customer_id=eq.${encodeURIComponent(customerId)}&select=*`, token);
  },

  async createCustomerContact(token: string, request: CustomerContactCreateRequestDto): Promise<CustomerContactDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const created = await supabase.insert<CustomerContactDto[]>('customer_contacts', token, request);
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
