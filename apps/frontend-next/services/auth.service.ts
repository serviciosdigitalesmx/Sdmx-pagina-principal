"use client";

import { apiClient } from "@/lib/apiClient";
import { clearToken, setToken } from "@/lib/auth/tokenManager";
import type { Session } from "@/lib/session";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResult = {
  accessToken: string;
  expiresAt: string;
  user?: Session["user"];
  shop?: Session["shop"];
  subscription?: Session["subscription"];
  roles?: Session["roles"];
  permissions?: Session["permissions"];
};

export type AuthState = {
  user: Session["user"] | null;
  session: Session | null;
};

function requireAccessToken(result: LoginResult) {
  if (!result.accessToken) {
    throw new Error("La respuesta del backend no contiene un access token válido.");
  }
}

export async function login(input: LoginRequest): Promise<Session> {
  const response = await apiClient.post<LoginResult>("/auth/login", input, { credentials: 'include' });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || "No se pudo iniciar sesión");
  }

  requireAccessToken(response.data);
  setToken(response.data.accessToken);

  const me = await apiClient.get<Session>("/auth/me", { credentials: 'include' });
  if (!me.success || !me.data) {
    clearToken();
    throw new Error(me.error?.message || "No se pudo resolver la sesión");
  }

  return me.data;
}

export async function me(): Promise<Session> {
  const response = await apiClient.get<Session>("/auth/me", { credentials: 'include' });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || "No se pudo resolver la sesión");
  }
  return response.data;
}

export async function logout() {
  clearToken();
  await apiClient.post("/auth/logout", {}, { credentials: 'include' }).catch(() => undefined);
}
