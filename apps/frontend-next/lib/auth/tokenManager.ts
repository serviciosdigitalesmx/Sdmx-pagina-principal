"use client";

let inMemoryToken: string | null = null;

export function getToken(): string | null {
  return inMemoryToken;
}

export function setToken(token: string | null) {
  inMemoryToken = token;
}

export function clearToken() {
  inMemoryToken = null;
}

export function hasToken(): boolean {
  return Boolean(inMemoryToken);
}
