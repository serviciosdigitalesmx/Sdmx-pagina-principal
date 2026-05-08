"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const PUBLIC_PATHS = ["/login", "/register", "/portal", "/seed"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated && typeof window !== "undefined" && !PUBLIC_PATHS.some((path) => window.location.pathname.startsWith(path))) {
      window.location.assign("/login");
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
