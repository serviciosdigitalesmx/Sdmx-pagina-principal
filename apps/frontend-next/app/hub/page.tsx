"use client";

import { useEffect, useState } from "react";
import { SaasShell } from "@/components/ui/SaasShell";
import { Operativo } from "@/components/native/Operativo";
import { Tecnico } from "@/components/native/Tecnico";
import { Stock } from "@/components/native/Stock";
import { Finanzas } from "@/components/native/Finanzas";
import { Solicitudes } from "@/components/native/Solicitudes";
import FeatureGuard from "@/components/native/FeatureGuard";
import { Boxes, ClipboardList, DollarSign, Wrench, Link2, Copy, type LucideIcon } from "lucide-react";
import { useAuth } from "@/components/native/AuthGuard";

type ModuleKey = "recepcion" | "solicitudes" | "tecnico" | "stock" | "finanzas";

const modules: Array<{ key: ModuleKey; label: string; icon: LucideIcon; description: string }> = [
  { key: "recepcion", label: "Recepción", icon: ClipboardList, description: "Alta y seguimiento de órdenes." },
  { key: "solicitudes", label: "Solicitudes", icon: Link2, description: "Ingresos públicos y solicitudes del portal." },
  { key: "tecnico", label: "Técnico", icon: Wrench, description: "Semáforo, diagnóstico y reparación." },
  { key: "stock", label: "Stock", icon: Boxes, description: "Inventario, productos y proveedores." },
  { key: "finanzas", label: "Finanzas", icon: DollarSign, description: "Ingresos, gastos y control operativo." }
];

export default function HubPage() {
  const { session } = useAuth();
  const [active, setActive] = useState<ModuleKey>("recepcion");
  const [copyState, setCopyState] = useState("");
  const [landingUrl, setLandingUrl] = useState("");

  useEffect(() => {
    const slug = session?.shop?.slug || session?.shop?.id || "";
    setLandingUrl(slug ? `${window.location.origin}/landing/${slug}` : "");
  }, [session]);

  async function copyLandingUrl() {
    if (!landingUrl) return;
    await navigator.clipboard.writeText(landingUrl);
    setCopyState("Link copiado");
    window.setTimeout(() => setCopyState(""), 1800);
  }

  function renderModule() {
    switch (active) {
      case "recepcion":
        return <Operativo />;
      case "solicitudes":
        return <Solicitudes />;
      case "tecnico":
        return <Tecnico />;
      case "stock":
        return <Stock />;
      case "finanzas":
        return <Finanzas />;
      default:
        return null;
    }
  }

  return (
    <SaasShell title="Hub Operativo" subtitle="Centro SPA del taller. Módulos migrados desde Sr-Fix legacy.">
      <section className="srf-card p-5 md:p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Landing pública del tenant</div>
            <h2 className="text-white text-xl font-black mt-1">Enlace compartible para solicitudes y cotización</h2>
            <p className="text-slate-500 text-sm mt-1">Cada tenant tiene su propia landing pública con cotizador y acceso al portal del cliente.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={landingUrl || "#"}
              target="_blank"
              rel="noreferrer"
              className="srf-btn-primary px-5 py-3 text-sm font-black inline-flex items-center justify-center gap-2"
            >
              <Link2 className="h-4 w-4" />
              Abrir landing
            </a>
            <button onClick={copyLandingUrl} className="srf-btn-secondary px-5 py-3 text-sm font-black inline-flex items-center justify-center gap-2">
              <Copy className="h-4 w-4" />
              Copiar link
            </button>
          </div>
        </div>
        {copyState && <div className="mt-3 text-xs font-bold text-emerald-400">{copyState}</div>}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const selected = active === mod.key;

          return (
            <button
              key={mod.key}
              type="button"
              onClick={() => setActive(mod.key)}
              className={`text-left srf-card-soft p-5 transition ${
                selected ? "border-[#FF6A2A]/60 shadow-[0_0_25px_rgba(255,106,42,.14)]" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`h-11 w-11 rounded-2xl flex items-center justify-center ${
                    selected ? "bg-[#FF6A2A]/20 text-[#FF6A2A]" : "bg-[#1F7EDC]/15 text-[#2FA4FF]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {selected && (
                  <span className="srf-badge-orange px-2 py-1 rounded-full text-[9px] font-black uppercase">
                    Activo
                  </span>
                )}
              </div>

              <h3 className="text-white font-black mt-4">{mod.label}</h3>
              <p className="text-slate-500 text-xs mt-1">{mod.description}</p>
            </button>
          );
        })}
      </section>

      <section className="srf-card p-5 md:p-7">
        <FeatureGuard featureName="el Hub Operativo">
          {renderModule()}
        </FeatureGuard>
      </section>
    </SaasShell>
  );
}
