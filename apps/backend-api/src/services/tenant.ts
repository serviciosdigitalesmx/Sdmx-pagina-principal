import type { SessionDto } from '@sdmx/contracts';

type TenantSubject = {
  tenant_id?: string;
  app_metadata?: { tenant_id?: string };
};

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

export function tenantIdFromSession(session: SessionDto): string {
  const subject = session.user as unknown as TenantSubject | undefined;
  const tenantId = String(subject?.tenant_id || subject?.app_metadata?.tenant_id || '');
  assert(Boolean(tenantId), 'El tenant no está definido en la sesión');
  return tenantId;
}
