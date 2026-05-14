import { Request, Response } from 'express';
import { z } from 'zod';
import { getTenantClient } from '@srfix/database';

// Esquema de validación para la creación de órdenes
const createOrderSchema = z.object({
  clientName: z.string().min(1, 'El nombre del cliente es requerido'),
  clientPhone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  clientEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  deviceType: z.string().min(1, 'El tipo de dispositivo es requerido'),
  deviceModel: z.string().min(1, 'La marca y modelo son requeridos'),
  issue: z.string().min(1, 'La falla es requerida'),
  quoteFolio: z.string().optional(),
});

export const createOrder = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const validatedData = createOrderSchema.parse(req.body);
    const supabase = getTenantClient(tenantId);
    const folioPrefix = process.env.ORDER_FOLIO_PREFIX ?? 'ORD';
    const newFolio = `${folioPrefix}-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          tenant_id: tenantId,
          folio: newFolio,
          client_name: validatedData.clientName,
          client_phone: validatedData.clientPhone,
          client_email: validatedData.clientEmail,
          device_type: validatedData.deviceType,
          device_model: validatedData.deviceModel,
          issue: validatedData.issue,
          status: 'NUEVA',
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error.message);
      return res.status(502).json({
        error: 'Failed to persist order',
        details: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Orden creada exitosamente',
      data,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos de validación incorrectos',
        details: error.errors,
      });
    }
    console.error('Error creating order:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const listOrders = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const supabase = getTenantClient(tenantId);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(502).json({
        error: 'Failed to fetch orders',
        details: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error listing orders:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
