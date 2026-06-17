import { Request, Response } from 'express';
import { z } from 'zod';
import {
  createActivationRequest,
  executeSale,
  executeService,
  fetchBalance,
  fetchProducts,
  fetchTransactionStatus,
  getActivationStatus,
  listActivationRequests,
  listTransactions,
  saveTenantAccount,
  updateActivationRequest,
} from '../services/movivendor';

const activationRequestSchema = z.object({
  businessName: z.string().min(2),
  ownerName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
});

const activationUpdateSchema = z.object({
  status: z.enum(['pending', 'reviewing', 'approved', 'rejected', 'active', 'suspended']),
  reviewNotes: z.string().optional().nullable(),
});

const accountSchema = z.object({
  movivendorUser: z.string().min(1),
  movivendorPassword: z.string().min(6),
  movivendorIdent: z.string().min(1),
  movivendorTerminal: z.string().min(1),
});

const txSchema = z.object({
  externalId: z.string().min(1),
  product: z.string().min(1),
  subprod: z.string().nullable().optional(),
  destination: z.string().min(1),
  amount: z.coerce.number().positive(),
  paymentMethod: z.string().nullable().optional(),
  commission: z.coerce.number().nullable().optional(),
});

function resolveTenant(req: Request) {
  const tenantId = req.user?.tenantId ?? req.scope?.tenantId ?? req.tenantId ?? null;
  const tenantSlug = req.user?.tenantSlug ?? req.scope?.tenantSlug ?? req.params.tenantSlug ?? null;
  if (!tenantId || !tenantSlug) {
    throw new Error('Tenant context missing');
  }
  return { tenantId, tenantSlug };
}

export async function getMovivendorStatus(req: Request, res: Response) {
  try {
    const { tenantId } = resolveTenant(req);
    const data = await getActivationStatus(tenantId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Error loading status' });
  }
}

export async function createMovivendorActivationRequest(req: Request, res: Response) {
  try {
    const { tenantId, tenantSlug } = resolveTenant(req);
    const body = activationRequestSchema.parse(req.body);
    const request = await createActivationRequest({
      tenantId,
      tenantSlug,
      businessName: body.businessName,
      ownerName: body.ownerName,
      email: body.email,
      phone: body.phone,
    });
    return res.status(201).json({ success: true, data: request });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Error creating activation request' });
  }
}

export async function listMovivendorActivationRequestsHandler(_req: Request, res: Response) {
  try {
    const data = await listActivationRequests();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Error listing activation requests' });
  }
}

export async function updateMovivendorActivationRequestHandler(req: Request, res: Response) {
  try {
    const body = activationUpdateSchema.parse(req.body);
    const id = String(req.params.id || '');
    const updated = await updateActivationRequest(id, {
      status: body.status,
      reviewNotes: body.reviewNotes ?? null,
      reviewedBy: req.user?.userId ?? req.user?.sub ?? null,
    });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Error updating activation request' });
  }
}

export async function getMovivendorAccountHandler(req: Request, res: Response) {
  try {
    const { tenantId } = resolveTenant(req);
    const data = await getActivationStatus(tenantId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Error loading account' });
  }
}

export async function saveMovivendorAccountHandler(req: Request, res: Response) {
  try {
    const { tenantId } = resolveTenant(req);
    const body = accountSchema.parse(req.body);
    const account = await saveTenantAccount({
      tenantId,
      movivendorUser: body.movivendorUser,
      movivendorPassword: body.movivendorPassword,
      movivendorIdent: body.movivendorIdent,
      movivendorTerminal: body.movivendorTerminal,
    });
    return res.status(200).json({ success: true, data: account });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Error saving account' });
  }
}

export async function getMovivendorProductsHandler(req: Request, res: Response) {
  try {
    const { tenantId } = resolveTenant(req);
    const data = await fetchProducts(tenantId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Error loading products' });
  }
}

export async function getMovivendorBalanceHandler(req: Request, res: Response) {
  try {
    const { tenantId } = resolveTenant(req);
    const data = await fetchBalance(tenantId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Error loading balance' });
  }
}

export async function getMovivendorTransactionsHandler(req: Request, res: Response) {
  try {
    const { tenantId } = resolveTenant(req);
    const data = await listTransactions(tenantId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Error loading transactions' });
  }
}

export async function getMovivendorTransactionStatusHandler(req: Request, res: Response) {
  try {
    const { tenantId } = resolveTenant(req);
    const externalId = String(req.params.externalId || req.query.externalId || '');
    const data = await fetchTransactionStatus(tenantId, externalId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Error loading transaction' });
  }
}

export async function createMovivendorSaleHandler(req: Request, res: Response) {
  try {
    const { tenantId } = resolveTenant(req);
    const body = txSchema.parse(req.body);
    const data = await executeSale({
      tenantId,
      userId: req.user?.userId ?? req.user?.sub ?? null,
      externalId: body.externalId,
      product: body.product,
      subprod: body.subprod ?? null,
      destination: body.destination,
      amount: body.amount,
      paymentMethod: body.paymentMethod ?? null,
      branchId: req.scope?.sucursalId ?? req.user?.sucursalId ?? null,
      commission: body.commission ?? null,
      rawRequest: req.body as Record<string, unknown>,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Error executing sale' });
  }
}

export async function createMovivendorServiceHandler(req: Request, res: Response) {
  try {
    const { tenantId } = resolveTenant(req);
    const body = txSchema.parse(req.body);
    const data = await executeService({
      tenantId,
      userId: req.user?.userId ?? req.user?.sub ?? null,
      externalId: body.externalId,
      product: body.product,
      subprod: body.subprod ?? null,
      destination: body.destination,
      amount: body.amount,
      paymentMethod: body.paymentMethod ?? null,
      branchId: req.scope?.sucursalId ?? req.user?.sucursalId ?? null,
      commission: body.commission ?? null,
      rawRequest: req.body as Record<string, unknown>,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Error executing service payment' });
  }
}

export async function checkMovivendorTransactionHandler(req: Request, res: Response) {
  try {
    const { tenantId } = resolveTenant(req);
    const body = txSchema.parse(req.body);
    const data = await executeService({
      tenantId,
      userId: req.user?.userId ?? req.user?.sub ?? null,
      externalId: body.externalId,
      product: body.product,
      subprod: body.subprod ?? null,
      destination: body.destination,
      amount: body.amount,
      paymentMethod: body.paymentMethod ?? null,
      branchId: req.scope?.sucursalId ?? req.user?.sucursalId ?? null,
      commission: body.commission ?? null,
      rawRequest: req.body as Record<string, unknown>,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Error checking transaction' });
  }
}
