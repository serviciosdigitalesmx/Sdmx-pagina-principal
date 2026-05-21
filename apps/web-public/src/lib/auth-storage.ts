"use client";

export const AUTH_TOKEN_KEY = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY ?? "app_auth_token";
const AUTH_TOKEN_KEYS = Array.from(new Set([AUTH_TOKEN_KEY, "app_auth_token", "auth_token"]));

export function saveAuthToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  for (const key of AUTH_TOKEN_KEYS) {
    window.localStorage.setItem(key, token);
  }
}

export function readAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  for (const key of AUTH_TOKEN_KEYS) {
    const value = window.localStorage.getItem(key);

    if (value) {
      return value;
    }
  }

  return null;
}
