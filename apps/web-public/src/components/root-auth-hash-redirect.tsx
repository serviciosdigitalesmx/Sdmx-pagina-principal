"use client";

import { useEffect } from "react";
import { saveAuthToken } from "@/lib/auth-storage";
import { getPublicApiPath } from "@/lib/public-api";

function getDashboardRedirectUrl() {
  return "/dashboard";
}

function getAdminBridgeUrl(token: string) {
  const adminUrl =
    process.env.NEXT_PUBLIC_WEB_ADMIN_URL ??
    (process.env.NEXT_PUBLIC_BASE_DOMAIN ? `https://app.${process.env.NEXT_PUBLIC_BASE_DOMAIN}` : "");

  if (!adminUrl) {
    return getDashboardRedirectUrl();
  }

  try {
    const bridgeUrl = new URL("/auth/bridge", adminUrl);
    bridgeUrl.searchParams.set("token", token);
    return bridgeUrl.toString();
  } catch {
    return getDashboardRedirectUrl();
  }
}

async function exchangeSessionForApiToken(accessToken: string) {
  const response = await fetch(getPublicApiPath("/api/auth/exchange"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ accessToken }),
  });

  const payload = (await response.json().catch(() => ({}))) as { error?: string; token?: string };

  if (!response.ok || !payload.token) {
    throw new Error(payload.error || `No pudimos convertir la sesión. HTTP ${response.status}`);
  }

  return payload.token;
}

export function RootAuthHashRedirect() {
  useEffect(() => {
    const hash = typeof window === "undefined" ? "" : window.location.hash.replace(/^#/, "");

    if (!hash) {
      return;
    }

    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");

    if (!accessToken) {
      return;
    }

    let cancelled = false;

    const redirect = async () => {
      try {
        const apiToken = await exchangeSessionForApiToken(accessToken);

        if (cancelled) {
          return;
        }

        saveAuthToken(apiToken, true);
        window.location.replace(getAdminBridgeUrl(apiToken));
      } catch (error) {
        console.error("ROOT_HASH_REDIRECT_FAILED", error);
      }
    };

    void redirect();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
