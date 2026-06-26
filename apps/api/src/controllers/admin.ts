import { Request, Response } from 'express';
import { z } from 'zod';
import { getRequestIp } from '../lib/request-ip';
import {
  getPlatformTenantAudit,
  listPlatformTenants,
  setTenantBillingExempt,
} from '../services/platform-admin';

const listTenantsQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const auditQuerySchema = z.object({
  action: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const billingExemptSchema = z.object({
  billingExempt: z.boolean(),
  supportReason: z.string().trim().min(10).max(500),
  supportTicketId: z.string().trim().max(120).optional(),
});

export async function getAdminHealth(req: Request, res: Response) {
  return res.json({
    success: true,
    data: {
      service: 'fixi-platform-admin',
      status: 'ok',
      requestId: req.requestId ?? null,
    },
  });
}

export async function listAdminTenants(req: Request, res: Response) {
  try {
    const parsed = listTenantsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid query', details: parsed.error.flatten(), requestId: req.requestId ?? null });
    }

    const data = await listPlatformTenants(parsed.data);
    return res.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list tenants';
    return res.status(502).json({ error: message, requestId: req.requestId ?? null });
  }
}

export async function getAdminTenantAudit(req: Request, res: Response) {
  try {
    const parsed = auditQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid query', details: parsed.error.flatten(), requestId: req.requestId ?? null });
    }

    const data = await getPlatformTenantAudit({
      tenantId: req.params.tenantId,
      ...parsed.data,
    });

    return res.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tenant audit';
    const status = message.includes('UUID') ? 400 : 502;
    return res.status(status).json({ error: message, requestId: req.requestId ?? null });
  }
}

export async function patchAdminTenantBillingExempt(req: Request, res: Response) {
  try {
    const parsed = billingExemptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten(), requestId: req.requestId ?? null });
    }

    const data = await setTenantBillingExempt({
      tenantId: req.params.tenantId,
      billingExempt: parsed.data.billingExempt,
      supportReason: parsed.data.supportReason,
      supportTicketId: parsed.data.supportTicketId ?? null,
      actorUserId: req.user?.userId ?? null,
      actorTenantId: req.user?.tenantId ?? '',
      requestId: req.requestId ?? '',
      ipAddress: getRequestIp(req.headers, req.ip),
      userAgent: req.headers['user-agent'] ?? null,
    });

    return res.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update billing exemption';
    const status = message.includes('UUID') || message.includes('master tenant') || message.includes('not found') ? 400 : 502;
    return res.status(status).json({ error: message, requestId: req.requestId ?? null });
  }
}
