"use client";

import type { ReactNode } from "react";
import type { LandingContent, Tenant } from "../types";
import { TenantThemeProvider } from "./tenant-theme-provider";
import { resolveTenantTheme } from "./theme-resolver";

type TenantBrandingProviderProps = {
  tenant: Tenant;
  landingContent?: LandingContent | null;
  children: ReactNode;
};

export function TenantBrandingProvider({ tenant, children }: TenantBrandingProviderProps) {
  return <TenantThemeProvider tenantSlug={tenant.slug} theme={resolveTenantTheme(tenant)}>{children}</TenantThemeProvider>;
}
