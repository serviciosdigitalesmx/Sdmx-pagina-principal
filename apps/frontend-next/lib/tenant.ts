"use client";

import type { User } from '@supabase/supabase-js';

type MetadataLike = {
  tenant_id?: string;
  tenantId?: string;
};

export function tenantIdFromAuthUser(user?: User | null): string {
  const appMetadata = (user?.app_metadata ?? {}) as MetadataLike;
  const userMetadata = (user?.user_metadata ?? {}) as MetadataLike;

  return String(
    appMetadata.tenant_id ||
      appMetadata.tenantId ||
      userMetadata.tenant_id ||
      userMetadata.tenantId ||
      ''
  );
}
