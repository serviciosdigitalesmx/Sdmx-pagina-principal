"use client";

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/$/, "");
}

export function getApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configured) {
    return normalizeBaseUrl(configured);
  }

  if (typeof window !== "undefined") {
    return normalizeBaseUrl(window.location.origin);
  }

  return "";
}

export function buildApiUrl(path: string) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error("No se pudo resolver la URL base del API");
  }

  return path.startsWith("http") ? path : `${baseUrl}${path}`;
}
