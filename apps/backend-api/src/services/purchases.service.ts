import { randomUUID } from 'node:crypto';
import { supabase } from './supabase.js';
import { loadSession, resolveTenantIdFromSession, requireActiveSubscription } from './context.js';
import type {
  ConfirmPurchaseRequestDto,
  CreatePurchaseRequestDto,
  PurchaseItemDto,
  PurchaseOrderDto
} from '@sdmx/contracts';

const nowIso = () => new Date().toISOString();
const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

type PurchaseOrderRow = PurchaseOrderDto;

const attachItems = async (token: string, order: PurchaseOrderDto): Promise<PurchaseOrderDto> => {
  const items = await supabase.query<PurchaseItemDto[]>(
    `purchase_items?purchase_order_id=eq.${encodeURIComponent(order.id)}&order=created_at.asc&select=*`,
    token
  );
  return { ...order, items };
};

export const purchasesService = {
  async listPurchases(token: string): Promise<PurchaseOrderDto[]> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);
    // 🔐 Filtro por tenant
    const orders = await supabase.query<PurchaseOrderDto[]>(`purchase_orders?tenant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc&select=*`, token);
    const withItems = await Promise.all(orders.map((order) => attachItems(token, order)));
    return withItems;
  },

  async getPurchaseById(token: string, purchaseOrderId: string): Promise<PurchaseOrderDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);
    const orders = await supabase.query<PurchaseOrderDto[]>(
      `purchase_orders?id=eq.${encodeURIComponent(purchaseOrderId)}&select=*`,
      token
    );
    const order = orders[0];
    assert(Boolean(order), 'Compra no encontrada');
    // 🔐 Verificar que la compra pertenezca al tenant
    if (order.tenant_id !== tenantId) throw new Error('Acceso denegado a la compra');
    return attachItems(token, order);
  },

  async createPurchase(token: string, request: CreatePurchaseRequestDto): Promise<PurchaseOrderDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);

    assert(Boolean(request.supplierId), 'supplierId es obligatorio');
    assert(Array.isArray(request.items) && request.items.length > 0, 'items es obligatorio');
    request.items.forEach((item, index) => {
      assert(Boolean(item.productId), `items[${index}].productId es obligatorio`);
      assert(Number(item.quantity) > 0, `items[${index}].quantity debe ser mayor a 0`);
      assert(Number(item.unitCostCents) >= 0, `items[${index}].unitCostCents debe ser mayor o igual a 0`);
    });

    const created = await supabase.rpc<string>('create_purchase_order', token, {
      p_tenant_id: tenantId,
      p_supplier_id: request.supplierId,
      p_notes: request.notes ?? null,
      p_items: request.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCostCents: item.unitCostCents
      }))
    });

    const purchaseOrderId = typeof created === 'string' ? created : String(created);
    const order = await this.getPurchaseById(token, purchaseOrderId);
    await this.audit(token, 'purchase.created', order);
    return order;
  },

  async confirmPurchase(token: string, purchaseOrderId: string, request?: ConfirmPurchaseRequestDto): Promise<PurchaseOrderDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);
    if (request?.tenantId && request.tenantId !== tenantId) {
      throw new Error('Tenant inválido');
    }

    await supabase.rpc('confirm_purchase_order', token, {
      p_tenant_id: tenantId,
      p_purchase_order_id: purchaseOrderId
    });

    const order = await this.getPurchaseById(token, purchaseOrderId);
    await this.audit(token, 'purchase.confirmed', order);
    return order;
  },

  async cancelPurchase(token: string, purchaseOrderId: string): Promise<PurchaseOrderDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const order = await this.getPurchaseById(token, purchaseOrderId);
    if (order.status === 'confirmed') {
      throw new Error('No se puede cancelar una compra confirmada');
    }

    const updated = await supabase.patch<PurchaseOrderRow[]>(
      `purchase_orders?id=eq.${encodeURIComponent(purchaseOrderId)}&select=*`,
      token,
      {
        status: 'cancelled',
        updated_at: nowIso()
      }
    );

    const current = updated[0];
    assert(Boolean(current), 'No se pudo cancelar la compra');
    const withItems = await attachItems(token, current);
    await this.audit(token, 'purchase.cancelled', withItems);
    return withItems;
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
