import type { Tenant } from "../types";

export type ResolvedTenantTheme = {
  logoUrl: string | null;
  faviconUrl: string | null;
  colors: Record<string, string>;
  typography: Record<string, string>;
  imagery: Record<string, string>;
  cta: Record<string, string>;
  footer: Record<string, string>;
  cssVariables: Record<string, string>;
};

const FALLBACK_THEME: ResolvedTenantTheme = {
  logoUrl: null,
  faviconUrl: null,
  colors: {
    primary: "#0f172a",
    secondary: "#1e293b",
    accent: "#0284c7",
    background: "#020617",
    foreground: "#e2e8f0",
    surface: "#0f172a",
    surfaceElevated: "#111827",
    border: "#1f2937",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    muted: "#94a3b8",
  },
  typography: {
    sans: "Arial, Helvetica, sans-serif",
    display: "Arial, Helvetica, sans-serif",
    mono: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
  },
  imagery: {
    heroImage: "",
    coverImage: "",
  },
  cta: {
    primaryRadius: "9999px",
    secondaryRadius: "1rem",
    primaryVariant: "solid",
    secondaryVariant: "outline",
    shadow: "0 12px 30px rgba(0,0,0,0.20)",
  },
  footer: {
    background: "#020617",
    text: "#e2e8f0",
    border: "#1f2937",
    compact: "false",
  },
  cssVariables: {},
};

function normalizeColor(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function resolveTenantTheme(tenant: Tenant): ResolvedTenantTheme {
  const theme = tenant.theme_config ?? null;
  const colors = theme?.colors ?? {};
  const typography = theme?.typography ?? {};
  const imagery = theme?.imagery ?? {};
  const cta = theme?.cta ?? {};
  const footer = theme?.footer ?? {};

  const resolved: ResolvedTenantTheme = {
    logoUrl: theme?.logoUrl ?? tenant.branding.logoUrl ?? null,
    faviconUrl: theme?.faviconUrl ?? tenant.branding.faviconUrl ?? null,
    colors: {
      primary: normalizeColor(colors.primary, tenant.branding.primaryColor || FALLBACK_THEME.colors.primary),
      secondary: normalizeColor(colors.secondary, tenant.branding.secondaryColor || FALLBACK_THEME.colors.secondary),
      accent: normalizeColor(colors.accent, FALLBACK_THEME.colors.accent),
      background: normalizeColor(colors.background, FALLBACK_THEME.colors.background),
      foreground: normalizeColor(colors.foreground, FALLBACK_THEME.colors.foreground),
      surface: normalizeColor(colors.surface, FALLBACK_THEME.colors.surface),
      surfaceElevated: normalizeColor(colors.surfaceElevated, FALLBACK_THEME.colors.surfaceElevated),
      border: normalizeColor(colors.border, FALLBACK_THEME.colors.border),
      success: normalizeColor(colors.success, FALLBACK_THEME.colors.success),
      warning: normalizeColor(colors.warning, FALLBACK_THEME.colors.warning),
      danger: normalizeColor(colors.danger, FALLBACK_THEME.colors.danger),
      muted: normalizeColor(colors.muted, FALLBACK_THEME.colors.muted),
    },
    typography: {
      sans: normalizeColor(typography.sans, FALLBACK_THEME.typography.sans),
      display: normalizeColor(typography.display, FALLBACK_THEME.typography.display),
      mono: normalizeColor(typography.mono, FALLBACK_THEME.typography.mono),
    },
    imagery: {
      heroImage: normalizeColor(imagery.heroImageUrl, ""),
      coverImage: normalizeColor(imagery.coverImageUrl, ""),
    },
    cta: {
      primaryRadius: normalizeColor(cta.primaryRadius, FALLBACK_THEME.cta.primaryRadius),
      secondaryRadius: normalizeColor(cta.secondaryRadius, FALLBACK_THEME.cta.secondaryRadius),
      primaryVariant: cta.primaryVariant ?? FALLBACK_THEME.cta.primaryVariant,
      secondaryVariant: cta.secondaryVariant ?? FALLBACK_THEME.cta.secondaryVariant,
      shadow: normalizeColor(cta.shadow, FALLBACK_THEME.cta.shadow),
    },
    footer: {
      background: normalizeColor(footer.background, FALLBACK_THEME.footer.background),
      text: normalizeColor(footer.text, FALLBACK_THEME.footer.text),
      border: normalizeColor(footer.border, FALLBACK_THEME.footer.border),
      compact: String(Boolean(footer.compact)),
    },
    cssVariables: {},
  };

  resolved.cssVariables = {
    "--tenant-primary": resolved.colors.primary,
    "--tenant-secondary": resolved.colors.secondary,
    "--tenant-accent": resolved.colors.accent,
    "--tenant-background": resolved.colors.background,
    "--tenant-foreground": resolved.colors.foreground,
    "--tenant-surface": resolved.colors.surface,
    "--tenant-surface-elevated": resolved.colors.surfaceElevated,
    "--tenant-border": resolved.colors.border,
    "--tenant-success": resolved.colors.success,
    "--tenant-warning": resolved.colors.warning,
    "--tenant-danger": resolved.colors.danger,
    "--tenant-muted": resolved.colors.muted,
    "--tenant-font-sans": resolved.typography.sans,
    "--tenant-font-display": resolved.typography.display,
    "--tenant-font-mono": resolved.typography.mono,
    "--tenant-hero-image": resolved.imagery.heroImage,
    "--tenant-cover-image": resolved.imagery.coverImage,
    "--tenant-cta-radius": resolved.cta.primaryRadius,
    "--tenant-cta-shadow": resolved.cta.shadow,
    "--tenant-footer-background": resolved.footer.background,
    "--tenant-footer-text": resolved.footer.text,
    "--tenant-footer-border": resolved.footer.border,
  };

  return resolved;
}
