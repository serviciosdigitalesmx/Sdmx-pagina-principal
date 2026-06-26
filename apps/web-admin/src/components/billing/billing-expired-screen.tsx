"use client";

import Link from "next/link";
import { useMemo } from "react";
import { LogOut, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { platformBrand } from "@/config/branding";
import { logout } from "@/lib/auth";

function resolveWhatsappHref() {
  const phone = process.env.NEXT_PUBLIC_SAAS_CONTACT_PHONE?.replace(/\D/g, "") ?? "";
  if (!phone) return null;
  const message = encodeURIComponent("Hola, quiero reactivar mi cuenta de FIXI. ¿Me apoyan con un plan?");
  return `https://wa.me/${phone}?text=${message}`;
}

export function BillingExpiredScreen() {
  const whatsappHref = useMemo(() => resolveWhatsappHref(), []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(31,126,220,0.18),_transparent_30%),linear-gradient(180deg,#07111f_0%,#0a0f17_40%,#0f172a_100%)] px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row lg:items-stretch">
        <section className="flex-1 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">Estado de cuenta</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Tu prueba gratuita terminó</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
            El acceso a este negocio está pausado porque el periodo de prueba expiró. Tus clientes, órdenes, inventario y configuración están guardados. Activa un plan para continuar usando Fixi.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
            No perderás tu información. Al activar tu plan, el acceso se restablece automáticamente.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Link href="/dashboard/billing" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 font-semibold text-white transition hover:bg-sky-400">
              <Sparkles className="h-4 w-4" />
              Activar plan
            </Link>
            <Link href="/dashboard/billing" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10">
              Ver planes
            </Link>
            {whatsappHref ? (
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-100 transition hover:bg-emerald-500/15">
                <MessageCircle className="h-4 w-4" />
                Hablar por WhatsApp
              </a>
            ) : (
              <span className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-slate-400">
                <MessageCircle className="h-4 w-4" />
                WhatsApp no configurado
              </span>
            )}
            <button onClick={logout} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-3 font-semibold text-rose-100 transition hover:bg-rose-500/15">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </section>

        <aside className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/60 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-3 text-sky-300">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.35em]">Tus datos están seguros</span>
          </div>
          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
            <p>{platformBrand} mantiene tu información aislada por tenant y lista para reactivación inmediata.</p>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="font-semibold text-white">Qué sigue</p>
              <ul className="mt-2 space-y-2 text-slate-300">
                <li>1. Elige el plan que mejor te funcione.</li>
                <li>2. Solicita activación por WhatsApp o desde el panel de billing.</li>
                <li>3. El acceso vuelve sin perder historial ni configuración.</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

