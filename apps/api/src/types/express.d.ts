export {};

declare global {
  namespace Express {
    interface TenantCapabilities {
      plan_key: 'basic' | 'pro' | 'scale';
      access_status: 'active' | 'trial' | 'billing_exempt' | 'master' | 'blocked';
      active_modules: string[];
      locked_modules: string[];
      limits: {
        users: number | null;
        sucursales: number | null;
        monthly_orders: number | null;
        storage_mb: number | null;
        public_portal: boolean;
        whatsapp_templates: number | null;
        document_templates: number | null;
      };
      reasons: string[];
    }

    interface Request {
      tenantId?: string;
      tenantCapabilities?: TenantCapabilities;
      user?: {
        tenantId: string;
        tenantSlug?: string | null;
        role: 'owner' | 'manager' | 'technician';
        email?: string;
        sucursalId?: string;
        sub?: string;
      };
    }
  }
}
