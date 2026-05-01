"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import type { Session } from "@/lib/session";
import { getSupabaseClient } from "@/lib/supabase";

const AuthContext = createContext<{ session: Session | null; loading: boolean }>({ session: null, loading: true });

const PUBLIC_PATHS = ['/login', '/register', '/portal', '/seed'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient();
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        if (!PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
          router.push('/login');
        }
        setLoading(false);
        return;
      }

      // Verify with backend (Source of Truth)
      try {
        const response = await apiClient.get<Session>('/api/auth/me');
        if (response.success && response.data) {
          setSession(response.data);
        } else {
          if (!PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
            router.push('/login');
          }
        }
      } catch (e) {
        console.error("Auth Verification Error:", e);
        if (!PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    void checkAuth();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
