import { optionalEnv, resolveBaseDomain } from "@white-label/config";

function normalizeHttpsUrl(candidate: string) {
  const trimmed = candidate.trim();
  const parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);

  if (parsed.protocol !== "https:") {
    return null;
  }

  return parsed.toString().replace(/\/$/, "");
}

export function resolveAdminUrl() {
  // Production resolves the admin URL from explicit env first so onboarding never falls back to the public landing.
  const candidate =
    optionalEnv("NEXT_PUBLIC_WEB_ADMIN_URL") ??
    optionalEnv("NEXT_PUBLIC_APP_URL") ??
    optionalEnv("NEXT_PUBLIC_WEB_PUBLIC_URL");

  if (candidate) {
    try {
      return normalizeHttpsUrl(candidate);
    } catch {
      return null;
    }
  }

  const baseDomain = resolveBaseDomain();
  if (baseDomain) {
    return `https://app.${baseDomain}`;
  }

  return null;
}

export function resolveAdminBridgeUrl(token: string, tenant?: string | null) {
  const adminUrl = resolveAdminUrl();

  if (!adminUrl) {
    return null;
  }

  const bridgeUrl = new URL("/auth/bridge", adminUrl);
  bridgeUrl.searchParams.set("token", token);

  if (tenant) {
    bridgeUrl.searchParams.set("tenant", tenant);
  }

  return bridgeUrl.toString();
}
