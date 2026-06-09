import { optionalEnv } from "@white-label/config";

function normalizeHttpsUrl(candidate: string) {
  const parsed = new URL(candidate);

  if (parsed.protocol !== "https:") {
    return null;
  }

  return parsed.toString().replace(/\/$/, "");
}

export function resolveAdminUrl() {
  const candidate =
    optionalEnv("NEXT_PUBLIC_WEB_ADMIN_URL") ??
    optionalEnv("NEXT_PUBLIC_APP_URL") ??
    optionalEnv("NEXT_PUBLIC_WEB_PUBLIC_URL");

  if (!candidate) {
    return null;
  }

  try {
    return normalizeHttpsUrl(candidate);
  } catch {
    return null;
  }
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
