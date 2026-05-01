"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { Search, Package, Clock, ShieldCheck, MapPin, Smartphone, ArrowRight, FileText } from "lucide-react";

type PortalOrder = {
  folio: string;
  status: string;
  device_type?: string;
  device_brand?: string;
  device_model?: string;
  reported_issue?: string;
  promised_date?: string;
  updated_at?: string;
};

export function PortalClient() {
  const searchParams = useSearchParams();
  const [folio, setFolio] = useState("");
  const [order, setOrder] = useState<PortalOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const folioParam = searchParams.get("folio") || "";
    if (folioParam) {
      setFolio(folioParam);
      void loadFolio(folioParam);
    }
  }, [searchParams]);

  const loadFolio = async (folioValue?: string) => {
    const target = (folioValue || folio).trim();
    if (!target) return;
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const response = await apiClient.get<PortalOrder[]>(`/api/portal/orders/${target}`);
      if (response.success && response.data && response.data.length > 0) {
        setOrder(response.data[0]);
      } else {
        setError("No se encontró ninguna orden con ese folio. Verifica que esté bien escrito.");
      }
    } catch {
      setError("Error al consultar el portal. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen srf-shell flex flex-col items-center p-6 md:p-12 overflow-x-hidden">
      <div className="w-full max-w-3xl space-y-12">
        <header className="text-center space-y-6">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-[2.5rem] bg-blue-600 shadow-[0_0_50px_rgba(31,126,220,0.5)] border-4 border-white/10 rotate-3 hover:rotate-0 transition-transform duration-500">
            <Package className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter">
              Rastreo de <span className="text-blue-500">Orden</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl font-medium">Fixi · Centro de Soporte Técnico</p>
          </div>
        </header>

        <section className="srf-card p-1">
          <div className="bg-slate-900/40 rounded-[1.4rem] p-8 md:p-10">
            <div className="space-y-6">
              <div className="space-y-3 text-center md:text-left">
                <label className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-500 ml-1">Ingresa tu Folio</label>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-600" />
                    <input
                      value={folio}
                      onChange={(e) => setFolio(e.target.value)}
                      placeholder="SERV-XXXXX"
                      className="srf-input pl-16 uppercase font-black tracking-[0.15em] text-2xl py-6 border-none ring-1 ring-white/10 focus:ring-blue-500/50 bg-slate-950/50"
                      onKeyDown={(e) => e.key === "Enter" && loadFolio()}
                    />
                  </div>
                  <button
                    onClick={() => void loadFolio()}
                    disabled={loading || !folio}
                    className="srf-btn-primary px-12 py-6 font-black text-xl shadow-[0_20px_40px_rgba(255,106,2,.3)] hover:shadow-orange-500/50 active:scale-95 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Rastrear <ArrowRight className="h-6 w-6" /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="srf-card-soft p-6 border-red-500/30 bg-red-500/5 text-red-400 text-center font-bold rounded-3xl animate-in fade-in zoom-in duration-300">
            {error}
          </div>
        )}

        {order && (
          <section className="srf-card overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-700">
            <div className="bg-gradient-to-br from-blue-600/30 via-slate-900/90 to-orange-500/10 p-10 border-b border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32" />
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Estado de Reparación</div>
                  <div className="mt-3 inline-flex px-8 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black uppercase tracking-widest text-sm shadow-[0_10px_25px_rgba(234,88,12,0.4)] ring-2 ring-white/20">
                    {order.status}
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Folio de Referencia</div>
                  <div className="text-4xl font-black text-white mt-1 uppercase tracking-widest drop-shadow-sm">{order.folio}</div>
                </div>
              </div>
            </div>

            <div className="p-10 grid md:grid-cols-2 gap-12 bg-slate-950/20">
              <div className="space-y-10">
                <div className="flex gap-6 items-start">
                  <div className="h-14 w-14 rounded-2xl bg-slate-800/80 flex items-center justify-center shrink-0 border border-white/10 shadow-xl">
                    <Smartphone className="h-7 w-7 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Equipo</div>
                    <div className="text-xl font-black text-white mt-1">{order.device_brand} {order.device_model}</div>
                    <div className="text-blue-400/80 text-sm font-bold mt-0.5 uppercase tracking-wider">{order.device_type}</div>
                  </div>
                </div>

                <div className="flex gap-6 items-start">
                  <div className="h-14 w-14 rounded-2xl bg-slate-800/80 flex items-center justify-center shrink-0 border border-white/10 shadow-xl">
                    <ShieldCheck className="h-7 w-7 text-green-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Reporte de Falla</div>
                    <p className="text-slate-300 mt-2 text-base leading-relaxed font-medium">{order.reported_issue}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-10 bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-sm">
                <div className="flex gap-6 items-start">
                  <div className="h-14 w-14 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
                    <Clock className="h-7 w-7 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Entrega Estimada</div>
                    <div className="text-xl font-black text-white mt-1">
                      {order.promised_date ? new Date(order.promised_date).toLocaleDateString("es-MX", { dateStyle: "full" }) : "Evaluando fecha..."}
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 items-start">
                  <div className="h-14 w-14 rounded-2xl bg-orange-500/20 flex items-center justify-center shrink-0 border border-orange-500/30">
                    <MapPin className="h-7 w-7 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Última Actualización</div>
                    <div className="text-base font-bold text-slate-400 mt-1 uppercase tracking-tight">
                      {order.updated_at ? new Date(order.updated_at).toLocaleString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      }) : "Sin actualización"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-10 pb-10">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">PDF de la orden</div>
                    <div className="text-white font-black text-lg mt-1">Documento visible del folio</div>
                  </div>
                  <a
                    href={`/api/public/orders/${encodeURIComponent(order.folio)}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="srf-btn-primary inline-flex items-center gap-2 px-5 py-3 font-black"
                  >
                    <FileText className="h-4 w-4" />
                    Abrir PDF
                  </a>
                </div>
                <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/70">
                  <iframe
                    title={`PDF ${order.folio}`}
                    src={`/api/public/orders/${encodeURIComponent(order.folio)}/pdf`}
                    className="h-[760px] w-full bg-white"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        <footer className="text-center pt-12 space-y-4">
          <div className="flex justify-center gap-6">
            <div className="h-1 w-12 bg-slate-800 rounded-full" />
            <div className="h-1 w-1 bg-slate-800 rounded-full" />
            <div className="h-1 w-12 bg-slate-800 rounded-full" />
          </div>
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">
            Fixi Command Center · Enterprise Grade Infrastructure
          </p>
        </footer>
      </div>
    </main>
  );
}
