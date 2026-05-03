"use client";
let memoryToken: string | null = null;
export function getToken(): string | null { return memoryToken; }
export function setToken(token: string | null): void { memoryToken = token; }
export function clearToken(): void { memoryToken = null; }
export function hasToken(): boolean { return Boolean(memoryToken); }
