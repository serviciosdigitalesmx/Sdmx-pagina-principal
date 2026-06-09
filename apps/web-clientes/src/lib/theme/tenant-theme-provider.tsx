"use client";

import type { CSSProperties, ReactNode } from "react";
import type { ResolvedTenantTheme } from "./theme-resolver";

type TenantThemeProviderProps = {
  tenantSlug: string;
  theme: ResolvedTenantTheme;
  children: ReactNode;
};

export function TenantThemeProvider({ tenantSlug, theme, children }: TenantThemeProviderProps) {
  const style = Object.fromEntries(
    Object.entries(theme.cssVariables).filter(([, value]) => typeof value === "string" && value.length > 0)
  ) as CSSProperties;

  return (
    <div data-tenant-slug={tenantSlug} data-tenant-theme={tenantSlug} style={style}>
      {children}
    </div>
  );
}
