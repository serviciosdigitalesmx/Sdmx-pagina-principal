import type { LandingContent, Tenant } from "../types";

export type LandingSectionId =
  | "hero"
  | "services"
  | "benefits"
  | "about"
  | "gallery"
  | "testimonials"
  | "faq"
  | "contact"
  | "whatsapp-cta"
  | "quote";

export type LandingSectionConfig = {
  id: LandingSectionId;
  enabled: boolean;
};

export function getDefaultLandingSectionRegistry(content: LandingContent): LandingSectionConfig[] {
  const sections: LandingSectionConfig[] = [
    { id: "hero", enabled: true },
    { id: "services", enabled: (content.services?.length ?? 0) > 0 },
    { id: "benefits", enabled: (content.benefits?.length ?? 0) > 0 },
    { id: "about", enabled: Boolean(content.aboutTitle || content.aboutDescription) },
    { id: "gallery", enabled: (content.gallery?.length ?? 0) > 0 },
    { id: "testimonials", enabled: (content.testimonials?.length ?? 0) > 0 },
    { id: "faq", enabled: (content.faqs?.length ?? 0) > 0 },
    { id: "contact", enabled: Boolean(content.contactLabel || content.contactHref) },
    { id: "whatsapp-cta", enabled: true },
    { id: "quote", enabled: Boolean(content.primaryCtaHref) },
  ];

  return sections;
}

export function resolveLandingSectionRegistry(content: LandingContent): LandingSectionConfig[] {
  const overrides = new Map((content.sections ?? []).map((section) => [section.id, section.enabled ?? true]));
  return getDefaultLandingSectionRegistry(content).map((section) => ({
    ...section,
    enabled: overrides.has(section.id) ? Boolean(overrides.get(section.id)) : section.enabled,
  }));
}

export function hasTenantLandingContent(tenant: Tenant | null | undefined): boolean {
  return Boolean(tenant?.config?.templates?.landing);
}
