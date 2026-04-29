"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  CreditCard,
  Home,
  LogOut,
  ShieldCheck,
  Smartphone,
  Users,
  Wrench
} from "lucide-react";
import { clearSession, readSession } from "@/lib/session";
import type { Session } from "@/lib/session";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/hub", label: "Hub Operativo", icon: ClipboardList },
  { href: "/recepcion", label: "Recepción", icon: Smartphone },
  { href: "/tecnico", label: "Técnico", icon: Wrench },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/billing", label: "Planes / Billing", icon: CreditCard },
  { href: "/auditoria", label: "Auditoría", icon: ShieldCheck }
];

export function SaasShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const session = readSession();

  const typedSession = session as Session | null;
  const userName = typedSession?.user.full_name || typedSession?.user.email || "Usuario";
  const shopName = typedSession?.shop.name || "Tenant activo";

  function logout() {
    clearSession();
    router.push("/login");
  }

  return (
    <div className="srf-shell min-h-screen">
      <div className="flex min-h-screen">
        <aside className="srf-sidebar hidden lg:flex w-80 shrink-0 flex-col px-5 py-6">
          <Link href="/dashboard" className="flex items-center gap-3 px-3">
            <div className="h-12 w-12 rounded-2xl bg-[#1F7EDC] flex items-center justify-center shadow-[0_0_28px_rgba(31,126,220,.35)]">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-white font-black tracking-[0.18em] text-sm">SDMX</div>
              <div className="text-slate-500 text-[10px] uppercase tracking-[0.22em]">Servicios Digitales</div>
            </div>
          </Link>

          <div className="mt-8 srf-card-soft p-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-black">Negocio</div>
            <div className="text-white font-bold mt-1 truncate">{shopName}</div>
            <div className="mt-3 inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest srf-badge-green">
              Tenant activo
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`srf-nav-item ${active ? "srf-nav-item-active" : ""} flex items-center gap-3 px-4 py-3 text-sm font-bold`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 py-3 text-sm font-black text-red-300 hover:bg-red-500/20"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-4 lg:p-8">
          <header className="srf-topbar px-5 py-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-[#FF6A2A] text-[10px] font-black uppercase tracking-[0.28em]">Panel SaaS Multi-tenant</div>
              <h1 className="text-2xl md:text-4xl font-black text-white mt-1">{title}</h1>
              {subtitle ? <p className="text-slate-400 mt-1 text-sm">{subtitle}</p> : null}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <div className="text-white text-sm font-bold">{userName}</div>
                <div className="text-slate-500 text-[10px] uppercase tracking-widest">Sesión activa</div>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-[#2B2B2B] border border-[#1F7EDC]/40 flex items-center justify-center text-[#2FA4FF] font-black">
                {userName.slice(0, 1).toUpperCase()}
              </div>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
