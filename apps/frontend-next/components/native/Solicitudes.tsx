"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { Inbox, RefreshCw, ExternalLink } from "lucide-react";

type RequestRow = {
  id: string;
  folio: string;
  status: string;
  device_type?: string | null;
  device_brand?: string | null;
  device_model?: string | null;
  reported_issue?: string | null;
  updated_at?: string | null;
};

export function Solicitudes() {
  const [items, setItems] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get<RequestRow[]>("/api/service-orders");
      if (!response.success) throw new Error(response.error?.message || "No se pudieron cargar las solicitudes");
      const filtered = (response.data || []).filter((item) => ["solicitud", "recibido"].includes(String(item.status).toLowerCase()));
      setItems(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando solicitudes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Inbox className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Solicitudes</h2>
            <p className="text-slate-500 text-xs">Ingresos desde el portal público y recepción inicial.</p>
          </div>
        </div>
        <button onClick={() => void load()} className="srf-btn-secondary px-4 py-2 text-xs font-black uppercase tracking-widest inline-flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </button>
      </header>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((item) => (
            <div key={item} className="h-36 rounded-2xl bg-slate-900/40 border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="srf-card-soft p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black">Folio</div>
                  <div className="text-white font-black text-lg mt-1">{item.folio}</div>
                </div>
                <span className="srf-badge-orange px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {item.status}
                </span>
              </div>

              <div className="text-sm text-slate-300 font-medium">
                {item.device_type} {item.device_brand} {item.device_model}
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">{item.reported_issue || "Sin detalle"}</p>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="text-[10px] uppercase tracking-widest text-slate-500">
                  {item.updated_at ? new Date(item.updated_at).toLocaleString("es-MX") : "Sin actualización"}
                </div>
                <a
                  href={`/portal?folio=${encodeURIComponent(item.folio)}`}
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-400 hover:text-blue-300"
                >
                  Ver portal
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </article>
          ))}

          {!items.length && (
            <div className="col-span-full py-16 text-center text-slate-500 font-black uppercase tracking-widest text-sm border border-dashed border-white/10 rounded-3xl bg-white/5">
              No hay solicitudes pendientes
            </div>
          )}
        </div>
      )}
    </div>
  );
}
