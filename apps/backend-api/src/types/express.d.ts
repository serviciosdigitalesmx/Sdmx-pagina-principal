import { SessionDto } from '@sdmx/contracts';

declare global {
  namespace Express {
    interface Request {
      session: SessionDto;
      token: string;
    }
  }
}
export {};
