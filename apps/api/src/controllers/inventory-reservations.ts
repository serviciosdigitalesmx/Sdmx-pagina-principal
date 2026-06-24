import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { supabaseAdmin } from '@white-label/database';

const createReservationSchema = z.object({
  serviceOrderId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  idempotencyKey: z.string().trim().optional().or(z.literal('')),
  reason: z.string().trim().optional().or(z.literal('')),
});

const releaseReservationSchema = z.object({
  quantity: z.coerce.number().positive(),
  reason: z.string().trim().optional().or(z.literal('')),
});

const consumeReservationSchema = z.object({
  quantity: z.coerce.number().positive(),
  idempotencyKey: z.string().trim().min(8),
  reason: z.string().trim().optional().or(z.literal('')),
});

function requestIdFrom(req: Request) {
  return String(req.headers['x-request-id'] ?? req.headers['x-correlation-id'] ?? randomUUID());
}

function userIdFrom(req: Request) {
  return req.user?.userId ?? req.user?.sub ?? null;
}

export const listInventoryReservations = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });

    let query = supabaseAdmin
      .from('inventory_reservations')
      .select('id, tenant_id, sucursal_id, service_order_id, product_id, reserved_quantity, consumed_quantity, released_quantity, status, idempotency_key, reservation_reason, reserved_by, consumed_by, released_by, reserved_at, consumed_at, released_at, expires_at, created_at, updated_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100);

    const serviceOrderId = String(req.query.serviceOrderId ?? '').trim();
    const productId = String(req.query.productId ?? '').trim();
    const status = String(req.query.status ?? '').trim();

    if (serviceOrderId) query = query.eq('service_order_id', serviceOrderId);
    if (productId) query = query.eq('product_id', productId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return res.status(502).json({ error: 'Failed to fetch reservations', details: error.message });

    return res.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error('Error listing inventory reservations:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createInventoryReservation = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });

    const body = createReservationSchema.parse(req.body);
    const idempotencyKey = (body.idempotencyKey ?? '').trim() || `reserve:${tenantId}:${body.serviceOrderId}:${body.productId}`;
    const requestId = requestIdFrom(req);

    const { data, error } = await supabaseAdmin.rpc('reserve_inventory_for_order', {
      p_tenant_id: tenantId,
      p_service_order_id: body.serviceOrderId,
      p_product_id: body.productId,
      p_quantity: body.quantity,
      p_idempotency_key: idempotencyKey,
      p_reserved_by: userIdFrom(req),
      p_request_id: requestId,
      p_reservation_reason: body.reason?.trim() || null,
    });

    if (error) {
      return res.status(409).json({ error: 'Failed to reserve inventory', details: error.message });
    }

    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error creating inventory reservation:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const releaseInventoryReservation = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });

    const body = releaseReservationSchema.parse(req.body);
    const requestId = requestIdFrom(req);

    const { data, error } = await supabaseAdmin.rpc('release_inventory_reservation', {
      p_tenant_id: tenantId,
      p_reservation_id: req.params.id,
      p_release_quantity: body.quantity,
      p_released_by: userIdFrom(req),
      p_request_id: requestId,
      p_release_reason: body.reason?.trim() || null,
    });

    if (error) {
      return res.status(409).json({ error: 'Failed to release reservation', details: error.message });
    }

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error releasing inventory reservation:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const consumeInventoryReservation = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });

    const body = consumeReservationSchema.parse(req.body);
    const requestId = requestIdFrom(req);

    const { data, error } = await supabaseAdmin.rpc('consume_inventory_reservation', {
      p_tenant_id: tenantId,
      p_reservation_id: req.params.id,
      p_quantity: body.quantity,
      p_idempotency_key: body.idempotencyKey,
      p_consumed_by: userIdFrom(req),
      p_request_id: requestId,
      p_consume_reason: body.reason?.trim() || null,
    });

    if (error) {
      return res.status(409).json({ error: 'Failed to consume reservation', details: error.message });
    }

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error consuming inventory reservation:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
