"use client";

import type { ApiResponse } from "@sdmx/contracts";
import { buildApiUrl } from "@/lib/api-base";
import { clearToken, getToken, setToken } from "@/lib/auth/tokenManager";

let refreshInFlight: Promise<string | null> | null = null;

function isPublicEndpoint(endpoint: string) {
  return endpoint.startsWith("/api/public/") || endpoint.startsWith("/api/portal/");
}

function isAuthEndpoint(endpoint: string) {
  return endpoint.startsWith("/auth/");
}

function unauthorizedResponse<T>(message = "No autorizado"): ApiResponse<T> {
  return { success: false, error: { code: "UNAUTHORIZED", message } };
}

function goToLogin() {
  if (typeof window !== "undefined") {
    clearToken();
    if (!window.location.pathname.startsWith("/login")) window.location.assign("/login");
  }
}

async function refreshSession(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const response = await fetch(buildApiUrl("/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      cache: "no-store"
    }).catch(() => null);
    if (!response || !response.ok) return null;
    const payload = await response.json().catch(() => null) as ApiResponse<{ accessToken?: string }> | null;
    const accessToken = payload?.data?.accessToken || null;
    if (accessToken) setToken(accessToken);
    return accessToken;
  })().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getToken();
  if (!isPublicEndpoint(endpoint) && !isAuthEndpoint(endpoint) && !token) {
    const refreshed = await refreshSession();
    if (!refreshed) {
      goToLogin();
      return unauthorizedResponse<T>("This endpoint requires a valid Bearer token");
    }
  }

  const makeRequest = async () => {
    const headers = new Headers(options.headers);
    headers.set("content-type", "application/json");
    const currentToken = getToken();
    if (currentToken) headers.set("Authorization", `Bearer ${currentToken}`);
    return fetch(buildApiUrl(endpoint), {
      ...options,
      headers,
      credentials: options.credentials ?? "include",
      cache: "no-store"
    });
  };

  try {
    let response = await makeRequest();
    if (response.status === 401 && !isPublicEndpoint(endpoint) && !isAuthEndpoint(endpoint)) {
      const refreshed = await refreshSession();
      if (refreshed) {
        response = await makeRequest();
      }
    }

    if (response.status === 401) {
      if (!isAuthEndpoint(endpoint)) {
        goToLogin();
      }
      return unauthorizedResponse<T>("Sesión expirada");
    }

    const payload = await response.json().catch(() => ({ success: false, error: { code: "PARSE_ERROR", message: "Failed to parse response" } }));
    if (response.status === 403) return payload as ApiResponse<T>;
    return payload as ApiResponse<T>;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: { code: "NETWORK_ERROR", message: errorMessage } };
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => fetchJson<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) => fetchJson<T>(endpoint, { ...options, method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) => fetchJson<T>(endpoint, { ...options, method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) => fetchJson<T>(endpoint, { ...options, method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string, options?: RequestInit) => fetchJson<T>(endpoint, { ...options, method: "DELETE" })
};
