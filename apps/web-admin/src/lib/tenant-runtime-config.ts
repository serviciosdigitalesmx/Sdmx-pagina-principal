export type TenantRuntimeConfig = {
  industryKey: string | null;
  industryLabel: string | null;
  activeModules: string[];
};

const STORAGE_KEY = 'srf_tenant_runtime_config';

export function saveTenantRuntimeConfig(input: TenantRuntimeConfig): void {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(input));

  if (input.industryKey) {
    window.localStorage.setItem('srf_industry_key', input.industryKey);
  }

  window.localStorage.setItem('srf_active_modules', JSON.stringify(Array.isArray(input.activeModules) ? input.activeModules : []));
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
      activeModules: Array.isArray((parsed as { activeModules?: unknown }).activeModules)
        ? ((parsed as { activeModules?: unknown }).activeModules as unknown[]).filter((item): item is string => typeof item === 'string')
        : [],
    };
  } catch {
    return {
      industryKey: null,
      industryLabel: null,
      activeModules: [],
    };
  }
}

export function getStoredIndustryKey(): string | null {
  return getTenantRuntimeConfig()?.industryKey ?? null;
}

export function getStoredActiveModules(): string[] {
  return getTenantRuntimeConfig()?.activeModules ?? [];
}

export function extractTenantRuntimeConfig(payload: unknown): TenantRuntimeConfig {
  const root = payload as any;
  const tenant = root?.data?.tenant ?? root?.tenant ?? root?.data ?? root;

  const profile =
    tenant?.industry_profile ??
    tenant?.industryProfile ??
    root?.data?.industry_profile ??
    root?.data?.config?.industry_profile ??
    root?.data?.config?.industryProfile ??
    root?.industry_profile ??
    root?.config?.industry_profile ??
    root?.config?.industryProfile ??
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

    activeModules: Array.isArray(root?.data?.capabilities?.active_modules)
      ? (root.data.capabilities.active_modules as unknown[]).filter((item): item is string => typeof item === 'string')
      : Array.isArray(root?.data?.config?.capabilities?.active_modules)
        ? (root.data.config.capabilities.active_modules as unknown[]).filter((item): item is string => typeof item === 'string')
      : Array.isArray(root?.capabilities?.active_modules)
        ? (root.capabilities.active_modules as unknown[]).filter((item): item is string => typeof item === 'string')
        : Array.isArray(root?.config?.capabilities?.active_modules)
          ? (root.config.capabilities.active_modules as unknown[]).filter((item): item is string => typeof item === 'string')
        : Array.isArray(root?.data?.active_modules)
          ? (root.data.active_modules as unknown[]).filter((item): item is string => typeof item === 'string')
          : Array.isArray(root?.active_modules)
            ? (root.active_modules as unknown[]).filter((item): item is string => typeof item === 'string')
            : [],
  };
}
