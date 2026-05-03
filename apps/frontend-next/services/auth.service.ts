"use client";
import { apiClient } from "@/lib/apiClient";
import { clearToken, setToken } from "@/lib/auth/tokenManager";
import type { Session } from "@/lib/session";
type LoginInput = { email: string; password: string };
export async function login(input: LoginInput): Promise<Session> {
  const res = await apiClient.post<Session>("/auth/login", input, { credentials: "include" });
  if (!res.success || !res.data) throw new Error(res.error?.message || "Error");
  if (res.data.accessToken) setToken(res.data.accessToken);
  return res.data;
}
export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout", {}, { credentials: "include" }).catch(()=>{});
  clearToken();
}
export async function fetchSession(): Promise<Session | null> {
  const res = await apiClient.get<Session>("/auth/me", { credentials: "include" });
  if (!res.success || !res.data) return null;
  if (res.data.accessToken) setToken(res.data.accessToken);
  return res.data;
}
