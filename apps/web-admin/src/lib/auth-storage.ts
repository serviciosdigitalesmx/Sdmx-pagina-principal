"use client";

export const AUTH_TOKEN_KEY = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY ?? "app_auth_token";

export function saveAuthToken(token: string) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function readAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

