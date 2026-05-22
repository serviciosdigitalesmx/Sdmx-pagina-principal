"use client";

import { useEffect } from "react";
import { saveAuthToken } from "@/lib/auth-storage";

function resolveAdminBridgeUrl(token?: string) {
  if (!token) {
    return new URL("/dashboard", window.location.origin).toString();
  }

  const adminUrl = process.env.NEXT_PUBLIC_WEB_ADMIN_URL;

  if (!adminUrl) {
    return new URL("/dashboard", window.location.origin).toString();
  }

  if (typeof window !== "undefined") {
    try {
      if (new URL(adminUrl).origin === window.location.origin) {
        return new URL("/dashboard", window.location.origin).toString();
      }
    } catch {
      return new URL("/dashboard", window.location.origin).toString();
    }
  }

  const bridgeUrl = new URL("/auth/bridge", adminUrl);
  bridgeUrl.searchParams.set("token", token);
  return bridgeUrl.toString();
}

export function AutoRedirectToAdmin({ token }: { token?: string }) {
  useEffect(() => {
    if (!token) {
      window.location.replace("/dashboard");
      return;
    }

    saveAuthToken(token);

    const bridgeUrl = resolveAdminBridgeUrl(token);

    if (bridgeUrl) {
      window.location.replace(bridgeUrl);
    } else {
      window.location.replace("/dashboard");
    }
  }, [token]);

  return null;
}
