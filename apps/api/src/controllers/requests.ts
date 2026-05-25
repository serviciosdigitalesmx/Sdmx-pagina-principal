import { Request, Response } from 'express';
import { z } from 'zod';
import { getTenantClient } from '@white-label/database';

const convertRequestSchema = z.object({
  estimatedCost: z.coerce.number().min(0).default(0),
  deviceType: z.string().min(1).optional(),
  deviceModel: z.string().min(1).optional(),
  issue: z.string().min(1).optional(),
  createCustomer: z.coerce.boolean().default(true),
});

function normalizeRequestStatus(status?: string | null) {
  const value = String(status ?? '').toLowerCase();
  if (value.includes('revis')) return 'en_revision';
  if (value.includes('conv')) return 'convertida';
  if (value.includes('rech')) return 'rechazada';
  return 'pendiente';
}

export async function listServiceRequests(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const supabase = getTenantClient(tenantId);
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return res.status(502).json({ error: 'Failed to fetch service requests', details: error.message });
    }

    return res.status(200).json({
      success: true,
      data: data ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
}

export async function getServiceRequestById(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;
    const requestId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    if (!requestId) {
      return res.status(400).json({ error: 'Request id is required' });
    }

    const supabase = getTenantClient(tenantId);
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', requestId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Request not found', details: error?.message ?? 'Not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...data,
        normalized_status: normalizeRequestStatus((data as { status?: string | null }).status ?? null),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
}

export async function convertServiceRequestToOrder(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId;
    const requestId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    if (!requestId) {
      return res.status(400).json({ error: 'Request id is required' });
    }

    const body = convertRequestSchema.parse(req.body);
    const supabase = getTenantClient(tenantId);

    const { data: requestRow, error: requestError } = await supabase
      .from('service_requests')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', requestId)
      .single();

    if (requestError || !requestRow) {
      return res.status(404).json({ error: 'Request not found', details: requestError?.message ?? 'Not found' });
    }

    let customerId: string | null = null;
    if (body.createCustomer) {
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert([
          {
            tenant_id: tenantId,
            name: requestRow.customer_name,
            phone: requestRow.customer_phone,
            email: requestRow.customer_email || null,
          },
        ])
        .select('id')
        .single();

      if (customerError || !customerData) {
        return res.status(502).json({ error: 'Failed to create customer from request', details: customerError?.message ?? 'Unknown error' });
      }

      customerId = customerData.id;
    }

    const folioPrefix = process.env.ORDER_FOLIO_PREFIX ?? 'ORD';
    const nextFolio = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const estimatedCost = Number.isFinite(body.estimatedCost) ? body.estimatedCost : Number((requestRow.quoted_total ?? 0) || 0);
    const finalCost = Number((estimatedCost || 0).toFixed(2));

    const { data: orderData, error: orderError } = await supabase
      .from('service_orders')
      .insert([
        {
          tenant_id: tenantId,
          customer_id: customerId,
          folio: nextFolio.replace('ORD-', `${folioPrefix}-`),
          status: 'recibido',
          device_info: {
            customer_name: requestRow.customer_name,
            customer_phone: requestRow.customer_phone,
            customer_email: requestRow.customer_email,
            type: body.deviceType || requestRow.device_type || '',
            brand: body.deviceModel || requestRow.device_model || '',
            model: body.deviceModel || requestRow.device_model || '',
          },
          problem_description: body.issue || requestRow.issue_description || '',
          estimated_cost: estimatedCost,
          final_cost: finalCost,
          receipt_url: null,
        },
      ])
      .select()
      .single();

    if (orderError || !orderData) {
      return res.status(502).json({ error: 'Failed to convert request to order', details: orderError?.message ?? 'Unknown error' });
    }

    const { error: updateRequestError } = await supabase
      .from('service_requests')
      .update({
        status: 'convertida',
      })
      .eq('tenant_id', tenantId)
      .eq('id', requestId);

    if (updateRequestError) {
      return res.status(502).json({ error: 'Failed to update request status', details: updateRequestError.message });
    }

    return res.status(201).json({
      success: true,
      data: {
        request: {
          ...requestRow,
          status: 'convertida',
        },
        order: orderData,
        customer_id: customerId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
}
