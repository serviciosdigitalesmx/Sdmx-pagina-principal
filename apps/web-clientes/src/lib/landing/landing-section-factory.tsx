import type { ReactNode } from "react";
import type { LandingContent, Tenant } from "../types";
import { resolveLandingSectionRegistry, type LandingSectionId } from "./section-registry";
import { LandingRenderer } from "./landing-renderer";

type LandingSectionFactoryProps = {
  tenant: Tenant;
  landingContent: LandingContent;
};

export function LandingSectionFactory({ tenant, landingContent }: LandingSectionFactoryProps): ReactNode {
  const registry = resolveLandingSectionRegistry(landingContent);
  const enabledSections = new Set(registry.filter((item) => item.enabled).map((item) => item.id));

  const requiresContent = enabledSections.has("hero") || enabledSections.has("services");
  if (!requiresContent) {
    return null;
  }

  return <LandingRenderer tenant={tenant} landingContent={landingContent} />;
}

export function isLandingSectionEnabled(sectionId: LandingSectionId, landingContent: LandingContent): boolean {
  return resolveLandingSectionRegistry(landingContent).some((item) => item.id === sectionId && item.enabled);
}
