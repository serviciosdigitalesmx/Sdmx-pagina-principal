'use client';
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { Wrench, Clock, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/format";

interface ServiceOrder {
  id: string;
  folio: string;
  device_brand: string;
  device_model: string;
  device_type: string;
  status: string;
  updated_at: string;
}

export function Tecnico() {
  const [data, setData] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await apiClient.get<ServiceOrder[]>("/api/service-orders");
        if (!res.success) throw new Error(res.error?.message || "Error de API");
        setData(Array.isArray(res.data) ? res.data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error cargando datos");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3 border-b border-white/5 pb-4">
        <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
          <Wrench className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">Centro de Diagnóstico</h2>
          <p className="text-slate-500 text-xs">Monitoreo técnico y flujo de reparaciones.</p>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-900/40 animate-pulse rounded-2xl border border-white/5" />)}
        </div>
      ) : (
        <div className="grid gap-4">
          {data.map((item) => (
            <article key={item.id} className="srf-card-soft p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-orange-500/40 transition-all">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-center text-orange-500 font-black text-sm shadow-inner group-hover:scale-105 transition-transform">
                  {item.folio}
                </div>
                <div>
                  <h3 className="text-white font-bold group-hover:text-orange-400 transition-colors">
                    {item.device_brand} {item.device_model}
                  </h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-2">
                    {item.device_type}
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    Actualizado {formatDate(item.updated_at, { dateStyle: 'medium' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 border border-white/5">
                  {item.status === 'recibido' && <Clock className="h-3.5 w-3.5 text-blue-400" />}
                  {item.status === 'diagnostico' && <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />}
                  {item.status === 'listo' && <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />}
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    {item.status}
                  </span>
                </div>
                <button className="h-10 w-10 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-orange-500 transition-all">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
          {data.length === 0 && (
            <div className="py-20 text-center srf-card-soft opacity-50 italic text-slate-500 text-sm">
              No hay equipos en tránsito técnico.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
