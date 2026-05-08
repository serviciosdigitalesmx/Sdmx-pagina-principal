import type { SessionDto } from '@sdmx/contracts';

declare global {
  namespace Express {
    interface Request {
      session?: SessionDto | any;
      tenantId?: string;
    }
  }
}

export {};
