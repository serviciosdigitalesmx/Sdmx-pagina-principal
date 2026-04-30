import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { supabase } from './supabase.js';
import { loadSession, resolveTenantIdFromSession, requireActiveSubscription } from './context.js';
import type {
  CreateSupplierRequestDto,
  SupplierDto,
  UpdateSupplierRequestDto
} from '@sdmx/contracts';

const nowIso = () => new Date().toISOString();
const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

export const suppliersService = {
  async listSuppliers(token: string): Promise<SupplierDto[]> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    return supabase.query<SupplierDto[]>(`suppliers?order=updated_at.desc&select=*`, token);
  },

  async getSupplierById(token: string, supplierId: string): Promise<SupplierDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const suppliers = await supabase.query<SupplierDto[]>(
      `suppliers?id=eq.${encodeURIComponent(supplierId)}&select=*`,
      token
    );
    const supplier = suppliers[0];
    assert(Boolean(supplier), 'Proveedor no encontrado');
    return supplier;
  },

  async createSupplier(token: string, request: CreateSupplierRequestDto): Promise<SupplierDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);

    assert(Boolean(request.name?.trim()), 'name es obligatorio');

    const created = await supabase.insert<SupplierDto[]>('suppliers', token, {
      id: randomUUID(),
      tenant_id: tenantId,
      name: request.name.trim(),
      contact_name: request.contactName?.trim() || null,
      phone: request.phone?.trim() || null,
      email: request.email?.trim() || null,
      address: request.address?.trim() || null,
      notes: request.notes?.trim() || null,
      created_at: nowIso(),
      updated_at: nowIso()
    });

    await this.audit(token, 'supplier.created', created[0] ?? {});
    return created[0];
  },

  async updateSupplier(token: string, supplierId: string, request: UpdateSupplierRequestDto): Promise<SupplierDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);

    const current = await this.getSupplierById(token, supplierId);

    const updated = await supabase.patch<SupplierDto[]>(
      `suppliers?id=eq.${encodeURIComponent(supplierId)}&select=*`,
      token,
      {
        ...(request.name !== undefined ? { name: request.name.trim() } : {}),
        ...(request.contactName !== undefined ? { contact_name: request.contactName?.trim() || null } : {}),
        ...(request.phone !== undefined ? { phone: request.phone?.trim() || null } : {}),
        ...(request.email !== undefined ? { email: request.email?.trim() || null } : {}),
        ...(request.address !== undefined ? { address: request.address?.trim() || null } : {}),
        ...(request.notes !== undefined ? { notes: request.notes?.trim() || null } : {}),
        updated_at: nowIso()
      }
    );

    await this.audit(token, 'supplier.updated', { before: current, after: updated[0] ?? {} });
    return updated[0];
  },

  async deleteSupplier(token: string, supplierId: string): Promise<{ deleted: true }> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    await this.getSupplierById(token, supplierId);

    const tenantId = resolveTenantIdFromSession(session);
    const base = new URL(`${env.supabaseUrl}/rest/v1/suppliers`);
    base.searchParams.set('id', `eq.${supplierId}`);
    base.searchParams.set('tenant_id', `eq.${tenantId}`);

    const res = await fetch(base.toString(), {
      method: 'DELETE',
      headers: {
        apikey: env.supabaseAnonKey,
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        Prefer: 'return=minimal'
      }
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || `Supabase error ${res.status}`);

    await this.audit(token, 'supplier.deleted', { supplierId });
    return { deleted: true };
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
