"use client";

import { resolveApiBaseUrl } from "@white-label/config";
import { readAuthToken } from "@/lib/auth-storage";
import { getActiveSucursalId } from "@/lib/tenant";

type ApiOptions = RequestInit & { fileType?: string };

function buildHeaders(options?: ApiOptions) {
  const headers = new Headers(options?.headers ?? {});
  headers.set("Accept", "application/json");
  if (options?.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = readAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const sucursalId = getActiveSucursalId();
  if (sucursalId) {
    headers.set("x-fixi-sucursal-id", sucursalId);
    headers.set("x-sucursal-id", sucursalId);
  }

  return headers;
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const apiBaseUrl = resolveApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    ...options,
    headers: buildHeaders(options),
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => "");

  if (!response.ok) {
    const message = typeof payload === "object" && payload && "error" in payload ? String((payload as { error?: string }).error) : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: ApiOptions) => request<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    request<T>(endpoint, { ...options, method: "POST", body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    request<T>(endpoint, { ...options, method: "PUT", body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    request<T>(endpoint, { ...options, method: "PATCH", body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T>(endpoint: string, options?: ApiOptions) => request<T>(endpoint, { ...options, method: "DELETE" }),
  upload: async <T>(endpoint: string, file: File, extra?: Record<string, unknown>, options?: ApiOptions) => {
    const form = new FormData();
    form.append("file", file);
    if (extra) {
      for (const [key, value] of Object.entries(extra)) {
        if (value === undefined || value === null) continue;
        form.append(key, typeof value === "string" ? value : JSON.stringify(value));
      }
    }
    return request<T>(endpoint, { ...options, method: "POST", body: form });
  },
};

