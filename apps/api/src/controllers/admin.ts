import { Request, Response } from 'express';
import { z } from 'zod';
import { getRequestIp } from '../lib/request-ip';
import {
  getPlatformTenantLimitDiagnostics,
  getPlatformTenantAudit,
  listPlatformPlanDefinitions,
  listPlatformTenants,
  setTenantBillingExempt,
  validatePlatformTenantPlanLimit,
} from '../services/platform-admin';
import { PlanLimitExceededError } from '../services/tenant-plan-limits';

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

const planLimitValidationSchema = z.object({
  resource: z.enum(['users', 'sucursales']),
  increment: z.coerce.number().int().min(1).max(100).default(1),
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

export async function listAdminPlans(_req: Request, res: Response) {
  const data = listPlatformPlanDefinitions();
  return res.json({ success: true, data });
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

export async function getAdminTenantLimits(req: Request, res: Response) {
  try {
    const data = await getPlatformTenantLimitDiagnostics({
      tenantId: req.params.tenantId,
    });

    return res.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tenant limits';
    const status = message.includes('UUID') || message.includes('not found') ? 400 : 502;
    return res.status(status).json({ error: message, requestId: req.requestId ?? null });
  }
}

export async function validateAdminTenantLimit(req: Request, res: Response) {
  try {
    const parsed = planLimitValidationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten(), requestId: req.requestId ?? null });
    }

    const data = await validatePlatformTenantPlanLimit({
      tenantId: req.params.tenantId,
      resource: parsed.data.resource,
      increment: parsed.data.increment,
      requestId: req.requestId ?? null,
    });

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof PlanLimitExceededError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
        resource: error.resource,
        limit: error.limit,
        used: error.used,
        requested: error.requested,
        requestId: error.requestId ?? req.requestId ?? null,
      });
    }

    const message = error instanceof Error ? error.message : 'Failed to validate tenant limit';
    const status = message.includes('UUID') || message.includes('not found') ? 400 : 502;
    return res.status(status).json({ error: message, requestId: req.requestId ?? null });
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
