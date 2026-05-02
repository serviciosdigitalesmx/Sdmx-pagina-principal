"use client";

import type { User } from '@supabase/supabase-js';

type TenantAuthSubject = {
  tenant_id?: string | null;
  tenantId?: string | null;
  app_metadata?: {
    tenant_id?: string | null;
    tenantId?: string | null;
  } | null;
  user_metadata?: {
    tenant_id?: string | null;
    tenantId?: string | null;
  } | null;
};

export function tenantIdFromAuthUser(user?: User | TenantAuthSubject | null): string {
  const subject = user as TenantAuthSubject | null | undefined;

  return String(
    subject?.tenant_id ||
      subject?.tenantId ||
      subject?.app_metadata?.tenant_id ||
      subject?.app_metadata?.tenantId ||
      subject?.user_metadata?.tenant_id ||
      subject?.user_metadata?.tenantId ||
      ''
  );
}
