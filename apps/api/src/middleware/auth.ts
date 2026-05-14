import { createHmac, timingSafeEqual } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

type JwtClaims = {
  sub: string;
  tenant_id: string;
  role: 'owner' | 'manager' | 'technician';
  email?: string;
  sucursal_id?: string;
  exp?: number;
  iat?: number;
};

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function verifyJwt(token: string): JwtClaims {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64url');

  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(encodedSignature);

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JwtClaims;
  const claimsSchema = z.object({
    sub: z.string().min(1),
    tenant_id: z.string().min(1),
    role: z.enum(['owner', 'manager', 'technician']),
    email: z.string().email().optional(),
    sucursal_id: z.string().min(1).optional(),
    exp: z.number().optional(),
    iat: z.number().optional(),
  });

  const parsed = claimsSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error('Invalid token payload');
  }

  if (parsed.data.exp && parsed.data.exp * 1000 <= Date.now()) {
    throw new Error('Token expired');
  }

  return parsed.data;
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice('Bearer '.length).trim();

  try {
    const claims = verifyJwt(token);
    req.user = {
      tenantId: claims.tenant_id,
      role: claims.role,
      email: claims.email,
      sucursalId: claims.sucursal_id,
      sub: claims.sub,
    };
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return res.status(401).json({ error: message });
  }
};
