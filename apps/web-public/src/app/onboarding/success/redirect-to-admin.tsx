"use client";

import { useEffect } from "react";
import { saveAuthToken } from "@/lib/auth-storage";

function resolveAdminBridgeUrl(token?: string) {
  if (!token) {
    return null;
  }

  const adminUrl = process.env.NEXT_PUBLIC_WEB_ADMIN_URL;

  if (!adminUrl) {
    return null;
  }

  const bridgeUrl = new URL("/auth/bridge", adminUrl);
  bridgeUrl.searchParams.set("token", token);
  return bridgeUrl.toString();
}

export function AutoRedirectToAdmin({ token }: { token?: string }) {
  useEffect(() => {
    if (!token) {
      return;
    }

    saveAuthToken(token);

    const bridgeUrl = resolveAdminBridgeUrl(token);

    if (bridgeUrl) {
      window.location.replace(bridgeUrl);
    }
  }, [token]);

  return null;
}
