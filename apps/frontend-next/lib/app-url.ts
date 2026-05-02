"use client";

function normalizeAppUrl(value: string) {
  return value.trim().replace(/\/$/, "");
}

export function getAppUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return normalizeAppUrl(configured);
  }

  if (typeof window !== "undefined") {
    return normalizeAppUrl(window.location.origin);
  }

  return "";
}

export function buildAppUrl(path: string) {
  const baseUrl = getAppUrl();
  if (!baseUrl) {
    throw new Error("No se pudo resolver la URL base de la app");
  }

  return path.startsWith("http") ? path : `${baseUrl}${path}`;
}
