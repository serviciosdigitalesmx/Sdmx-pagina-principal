export type TenantRuntimeConfig = {
  industryKey: string | null;
  industryLabel: string | null;
};

const STORAGE_KEY = 'srf_tenant_runtime_config';

export function saveTenantRuntimeConfig(input: TenantRuntimeConfig): void {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(input));

  if (input.industryKey) {
    window.localStorage.setItem('srf_industry_key', input.industryKey);
  }
}

export function getTenantRuntimeConfig(): TenantRuntimeConfig | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<TenantRuntimeConfig>;

    return {
      industryKey: typeof parsed.industryKey === 'string' ? parsed.industryKey : null,
      industryLabel: typeof parsed.industryLabel === 'string' ? parsed.industryLabel : null,
    };
  } catch {
    return null;
  }
}

export function getStoredIndustryKey(): string | null {
  return getTenantRuntimeConfig()?.industryKey ?? null;
}

export function extractTenantRuntimeConfig(payload: unknown): TenantRuntimeConfig {
  const root = payload as any;
  const tenant = root?.data?.tenant ?? root?.tenant ?? root?.data ?? root;

  const profile =
    tenant?.industry_profile ??
    tenant?.industryProfile ??
    root?.data?.industry_profile ??
    root?.industry_profile ??
    null;

  return {
    industryKey:
      typeof profile?.industry_key === 'string'
        ? profile.industry_key
        : typeof profile?.industryKey === 'string'
          ? profile.industryKey
          : null,

    industryLabel:
      typeof profile?.industry_label === 'string'
        ? profile.industry_label
        : typeof profile?.industryLabel === 'string'
          ? profile.industryLabel
          : null,
  };
}
