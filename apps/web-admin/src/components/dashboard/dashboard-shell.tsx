"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { isAuthenticated, getStoredUser } from "@/lib/auth";

export type TenantConfig = {
  tenantId: string;
  tenantName: string;
  brandName: string;
  sucursalName: string;
  userSucursalId: string;
  userEmail: string;
  userRole: string;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
};

export function DashboardShell({ children }: { children: React.ReactNode; tenant?: TenantConfig }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(getStoredUser());

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    } else {
      setUser(getStoredUser());
    }
  }, [router, pathname]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-srf-bg">
        <div className="spinner h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-srf-bg text-srf-text">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

