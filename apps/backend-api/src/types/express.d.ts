import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    context?: {
      userId: string;
      tenantId: string;
      subscription?: {
        status: string;
        plan_id: string;
        plans?: {
          code: string;
          limits: Record<string, boolean | number>;
        };
      };
    };
  }
}
