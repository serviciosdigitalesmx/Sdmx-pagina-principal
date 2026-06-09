import type { Benefit, FaqItem, GalleryItem, LandingContent, Service, SocialLink, Testimonial } from "../types";

export type ContentValidationIssue = {
  field: string;
  message: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeString(value: unknown): string {
  return isNonEmptyString(value) ? value.trim() : "";
}

function normalizeService(item: unknown): Service | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const title = normalizeString(record.title);
  const description = normalizeString(record.description);
  return title && description ? { title, description } : null;
}

function normalizeBenefit(item: unknown): Benefit | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const title = normalizeString(record.title);
  const description = normalizeString(record.description);
  return title && description ? { title, description } : null;
}

function normalizeFaq(item: unknown): FaqItem | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const question = normalizeString(record.question);
  const answer = normalizeString(record.answer);
  return question && answer ? { question, answer } : null;
}

function normalizeTestimonial(item: unknown): Testimonial | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const clientName = normalizeString(record.clientName);
  const comment = normalizeString(record.comment);
  const date = normalizeString(record.date);
  const rating = typeof record.rating === "number" ? record.rating : Number(record.rating);
  return clientName && comment && date && Number.isFinite(rating) ? { clientName, comment, date, rating } : null;
}

function normalizeGalleryItem(item: unknown): GalleryItem | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const url = normalizeString(record.url);
  if (!url) return null;
  return {
    id: isNonEmptyString(record.id) ? record.id : undefined,
    url,
    alt: isNonEmptyString(record.alt) ? record.alt : undefined,
    caption: isNonEmptyString(record.caption) ? record.caption : undefined,
    type: record.type === "video" ? "video" : "image",
  };
}

function normalizeSocialLink(item: unknown): SocialLink | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const label = normalizeString(record.label);
  const href = normalizeString(record.href);
  return label && href ? { label, href } : null;
}

export function validateLandingContent(input: unknown): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  if (!input || typeof input !== "object") {
    return [{ field: "landingContent", message: "landingContent debe ser un objeto válido" }];
  }

  const content = input as Record<string, unknown>;
  if (!isNonEmptyString(content.heroTitle)) issues.push({ field: "heroTitle", message: "heroTitle requerido" });
  if (!isNonEmptyString(content.heroDescription)) issues.push({ field: "heroDescription", message: "heroDescription requerido" });
  if (!isNonEmptyString(content.primaryCtaLabel)) issues.push({ field: "primaryCtaLabel", message: "primaryCtaLabel requerido" });
  if (!isNonEmptyString(content.primaryCtaHref)) issues.push({ field: "primaryCtaHref", message: "primaryCtaHref requerido" });

  return issues;
}

export function normalizeLandingContent(input: unknown, tenantName: string, tenantSlug: string): LandingContent | null {
  if (!input || typeof input !== "object") return null;

  const content = input as Record<string, unknown>;
  const services = Array.isArray(content.services) ? content.services.map(normalizeService).filter(Boolean) as Service[] : [];
  const benefits = Array.isArray(content.benefits) ? content.benefits.map(normalizeBenefit).filter(Boolean) as Benefit[] : [];
  const faqs = Array.isArray(content.faqs) ? content.faqs.map(normalizeFaq).filter(Boolean) as FaqItem[] : [];
  const testimonials = Array.isArray(content.testimonials) ? content.testimonials.map(normalizeTestimonial).filter(Boolean) as Testimonial[] : [];
  const gallery = Array.isArray(content.gallery) ? content.gallery.map(normalizeGalleryItem).filter(Boolean) as GalleryItem[] : [];
  const socialLinks = Array.isArray(content.socialLinks) ? content.socialLinks.map(normalizeSocialLink).filter(Boolean) as SocialLink[] : [];

  return {
    heroTitle: normalizeString(content.heroTitle) || tenantName,
    heroSubtitle: normalizeString(content.heroSubtitle) || "Landing pública por tenant",
    heroDescription: normalizeString(content.heroDescription) || `Landing pública del taller ${tenantSlug}.`,
    seoTitle: normalizeString(content.seoTitle) || tenantName,
    seoDescription: normalizeString(content.seoDescription) || `Landing pública del taller ${tenantSlug}.`,
    primaryCtaLabel: normalizeString(content.primaryCtaLabel) || "Cotizar ahora",
    primaryCtaHref: normalizeString(content.primaryCtaHref) || "/",
    secondaryCtaLabel: normalizeString(content.secondaryCtaLabel) || "Ver estatus",
    secondaryCtaHref: normalizeString(content.secondaryCtaHref) || `/t/${tenantSlug}/portal`,
    contactLabel: normalizeString(content.contactLabel) || "Contacto",
    contactHref: normalizeString(content.contactHref) || "",
    contactPhone: normalizeString(content.contactPhone),
    contactEmail: normalizeString(content.contactEmail),
    contactAddress: normalizeString(content.contactAddress),
    hours: normalizeString(content.hours),
    services,
    benefits,
    testimonials,
    socialLinks,
    gallery,
    faqs,
    aboutTitle: normalizeString(content.aboutTitle),
    aboutDescription: normalizeString(content.aboutDescription),
    showMap: Boolean(content.showMap),
    mapEmbedUrl: normalizeString(content.mapEmbedUrl),
    showVideo: Boolean(content.showVideo),
    videoUrl: normalizeString(content.videoUrl),
  };
}
