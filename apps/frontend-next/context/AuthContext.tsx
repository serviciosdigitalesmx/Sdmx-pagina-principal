"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clearToken, getToken, setToken } from "@/lib/auth/tokenManager";
import { apiClient } from "@/lib/apiClient";
import type { Session } from "@/lib/session";
import { login as backendLogin, logout as backendLogout } from "@/services/auth.service";

type AuthContextValue = {
  user: Session["user"] | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (input: { email: string; password: string }) => Promise<Session>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<Session | null>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isAuthenticated: false,
  loading: true,
  login: async () => { throw new Error("AuthProvider no inicializado"); },
  logout: async () => undefined,
  refreshSession: async () => null
});

async function loadSession(): Promise<Session | null> {
  const response = await apiClient.get<Session>("/auth/me", { credentials: 'include' });
  if (!response.success || !response.data) return null;
  return response.data;
}

async function refreshSessionRequest(): Promise<Session | null> {
  const refresh = await apiClient.post<{ accessToken?: string; session?: Session }>("/auth/refresh", {}, { credentials: 'include' });
  if (!refresh.success || !refresh.data) return null;
  if (refresh.data.accessToken) setToken(refresh.data.accessToken);
  if (refresh.data.session) return refresh.data.session;
  return loadSession();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = async () => {
    const current = getToken() ? await loadSession() : await refreshSessionRequest();
    if (!current) {
      clearToken();
      setSession(null);
      setLoading(false);
      return;
    }
    setSession(current);
    setLoading(false);
  };

  useEffect(() => {
    void bootstrap();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    session,
    isAuthenticated: Boolean(session),
    loading,
    login: async (input: { email: string; password: string }) => {
      const nextSession = await backendLogin(input);
      setSession(nextSession);
      return nextSession;
    },
    logout: async () => {
      await backendLogout();
      clearToken();
      setSession(null);
      router.push("/login");
    },
    refreshSession: async () => {
      const nextSession = await refreshSessionRequest();
      setSession(nextSession);
      if (!nextSession) router.push("/login");
      return nextSession;
    }
  }), [loading, router, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
