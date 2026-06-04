"use client";

import { useMemo } from "react";
import { logout, getStoredUser } from "@/lib/auth";

export function Header() {
  const user = useMemo(() => getStoredUser(), []);

  return (
    <header className="flex items-center justify-between border-b border-srf-primary/30 bg-srf-bg px-4 py-3 text-srf-text">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-srf-muted">Servicios Digitales MX Admin</p>
        <h1 className="font-bold text-srf-primary">SRFIX · Integrador Interno</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold">{user?.name || user?.email || "Usuario"}</p>
          <p className="text-xs text-srf-muted">{user?.role || "manager"}</p>
        </div>
        <button onClick={logout} className="rounded-lg border border-srf-primary/30 px-3 py-2 text-sm text-srf-text hover:bg-srf-surface/50">
          Salir
        </button>
      </div>
    </header>
  );
}

