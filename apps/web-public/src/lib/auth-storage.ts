"use client";

export const AUTH_TOKEN_KEY = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY ?? "app_auth_token";
const AUTH_TOKEN_KEYS = Array.from(new Set([AUTH_TOKEN_KEY, "app_auth_token", "auth_token"]));

function writeToken(token: string, persistent: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  const primaryStorage = persistent ? window.localStorage : window.sessionStorage;
  const secondaryStorage = persistent ? window.sessionStorage : window.localStorage;

  for (const key of AUTH_TOKEN_KEYS) {
    primaryStorage.setItem(key, token);
    secondaryStorage.removeItem(key);
  }
}

export function saveAuthToken(token: string, persistent = true) {
  writeToken(token, persistent);
}

export function readAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  for (const key of AUTH_TOKEN_KEYS) {
    const persistentValue = window.localStorage.getItem(key);
    if (persistentValue) {
      return persistentValue;
    }

    const sessionValue = window.sessionStorage.getItem(key);
    if (sessionValue) {
      return sessionValue;
    }
  }

  return null;
}

export function clearAuthToken() {
  if (typeof window === "undefined") {
    return;
  }

  for (const key of AUTH_TOKEN_KEYS) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }
}
