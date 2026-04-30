import { randomUUID } from 'node:crypto';
import { supabase } from './supabase.js';
import { loadSession, resolveTenantIdFromSession, requireActiveSubscription } from './context.js';
import type {
  InventoryKardexEntryDto,
  InventoryMovementCreateRequestDto,
  InventoryMovementDto,
  InventoryProductCreateRequestDto,
  InventoryProductDto,
  InventoryProductUpdateRequestDto
} from '@sdmx/contracts';

const nowIso = () => new Date().toISOString();
const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

type InventoryProductRow = InventoryProductDto;
type InventoryMovementRow = InventoryMovementDto;

function normalizeSku(value: string): string {
  return value.trim().toUpperCase();
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function balanceAfterMovement(current: number, movementType: InventoryMovementCreateRequestDto['movementType'], quantity: number): number {
  if (movementType === 'in') return current + quantity;
  if (movementType === 'out') return current - quantity;
  if (movementType === 'transfer') return current;
  return current;
}

export const inventoryService = {
  async listProducts(token: string): Promise<InventoryProductDto[]> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    return supabase.query<InventoryProductDto[]>(`inventory_products?order=updated_at.desc&select=*`, token);
  },

  async createProduct(token: string, request: InventoryProductCreateRequestDto): Promise<InventoryProductDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);

    assert(Boolean(request.sku), 'sku es obligatorio');
    assert(Boolean(request.name), 'name es obligatorio');

    const created = await supabase.insert<InventoryProductDto[]>('inventory_products', token, {
      id: randomUUID(),
      tenant_id: tenantId,
      branch_id: request.branchId ?? null,
      sku: normalizeSku(request.sku),
      name: request.name.trim(),
      category: request.category?.trim() || null,
      unit_cost_mxn: request.unitCostMxn ?? null,
      sale_price_mxn: request.salePriceMxn ?? null,
      current_stock: 0,
      min_stock: toNumber(request.minStock, 0),
      is_active: true,
      created_at: nowIso(),
      updated_at: nowIso()
    });

    await this.audit(token, 'inventory_product.created', created[0] ?? {});
    return created[0];
  },

  async updateProduct(token: string, productId: string, request: InventoryProductUpdateRequestDto): Promise<InventoryProductDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);

    const existing = await supabase.query<InventoryProductDto[]>(`inventory_products?id=eq.${encodeURIComponent(productId)}&select=*`, token);
    assert(Boolean(existing[0]), 'Producto no encontrado');

    const updated = await supabase.patch<InventoryProductDto[]>(`inventory_products?id=eq.${encodeURIComponent(productId)}&select=*`, token, {
      ...(request.sku !== undefined ? { sku: normalizeSku(request.sku) } : {}),
      ...(request.name !== undefined ? { name: request.name.trim() } : {}),
      ...(request.category !== undefined ? { category: request.category?.trim() || null } : {}),
      ...(request.unitCostMxn !== undefined ? { unit_cost_mxn: request.unitCostMxn ?? null } : {}),
      ...(request.salePriceMxn !== undefined ? { sale_price_mxn: request.salePriceMxn ?? null } : {}),
      ...(request.minStock !== undefined ? { min_stock: toNumber(request.minStock, 0) } : {}),
      ...(request.isActive !== undefined ? { is_active: request.isActive } : {}),
      updated_at: nowIso()
    });

    await this.audit(token, 'inventory_product.updated', updated[0] ?? {});
    return updated[0];
  },

  async listMovements(token: string, productId?: string): Promise<InventoryMovementDto[]> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const query = productId
      ? `inventory_movements?product_id=eq.${encodeURIComponent(productId)}&order=created_at.desc&select=*`
      : `inventory_movements?order=created_at.desc&select=*`;
    return supabase.query<InventoryMovementDto[]>(query, token);
  },

  async createMovement(token: string, request: InventoryMovementCreateRequestDto): Promise<InventoryMovementDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);

    assert(Boolean(request.productId), 'productId es obligatorio');
    assert(Boolean(request.movementType), 'movementType es obligatorio');
    assert(request.quantity > 0, 'quantity debe ser mayor a 0');

    const products = await supabase.query<InventoryProductRow[]>(
      `inventory_products?id=eq.${encodeURIComponent(request.productId)}&select=*`,
      token
    );
    const product = products[0];
    assert(Boolean(product), 'Producto no encontrado');
    assert(String(product.tenant_id) === tenantId, 'Producto fuera del tenant');

    const currentStock = toNumber(product.current_stock, 0);
    const quantity = toNumber(request.quantity, 0);
    const nextStock = balanceAfterMovement(currentStock, request.movementType, quantity);
    assert(nextStock >= 0, 'El inventario no puede quedar negativo');

    const created = await supabase.insert<InventoryMovementRow[]>('inventory_movements', token, {
      id: randomUUID(),
      tenant_id: tenantId,
      branch_id: request.branchId ?? product.branch_id ?? null,
      product_id: request.productId,
      movement_type: request.movementType,
      quantity,
      unit_cost_mxn: request.unitCostMxn ?? product.unit_cost_mxn ?? null,
      reference_type: request.referenceType ?? null,
      reference_id: request.referenceId ?? null,
      note: request.note ?? null,
      created_at: nowIso()
    });

    const updated = await supabase.patch<InventoryProductDto[]>(
      `inventory_products?id=eq.${encodeURIComponent(request.productId)}&select=*`,
      token,
      {
        current_stock: nextStock,
        updated_at: nowIso()
      }
    );

    await this.audit(token, 'inventory_movement.created', {
      movement: created[0] ?? {},
      product: updated[0] ?? {}
    });

    return created[0];
  },

  async getKardex(token: string, productId: string): Promise<InventoryKardexEntryDto[]> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const products = await supabase.query<InventoryProductDto[]>(
      `inventory_products?id=eq.${encodeURIComponent(productId)}&select=*`,
      token
    );
    const product = products[0];
    assert(Boolean(product), 'Producto no encontrado');

    const movements = await supabase.query<InventoryMovementDto[]>(
      `inventory_movements?product_id=eq.${encodeURIComponent(productId)}&order=created_at.asc&select=*`,
      token
    );

    let balance = 0;
    return movements.map((movement) => {
      if (movement.movement_type === 'in') balance += toNumber(movement.quantity, 0);
      else if (movement.movement_type === 'out') balance -= toNumber(movement.quantity, 0);
      return {
        movement,
        product,
        balance
      };
    });
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

