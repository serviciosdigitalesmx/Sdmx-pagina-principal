'use client';
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, Activity } from "lucide-react";

interface FinanceSummary {
  totalSalesMxn: number;
  openOrders: number;
  inProgressOrders: number;
  readyOrders: number;
  totalCustomers: number;
}

export function Finanzas() {
  const [data, setData] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await apiClient.get<FinanceSummary>("/api/dashboard/summary");
        if (!res.success) throw new Error(res.error?.message || "Error de API");
        setData(res.data || null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error cargando datos");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = [
    { 
      label: "Ingresos Totales", 
      value: data ? `$${data.totalSalesMxn.toLocaleString()} MXN` : "—", 
      icon: Wallet, 
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20"
    },
    { 
      label: "Órdenes Activas", 
      value: data ? String(data.openOrders + data.inProgressOrders) : "—", 
      icon: Activity, 
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    },
    { 
      label: "Clientes Registrados", 
      value: data ? String(data.totalCustomers) : "—", 
      icon: TrendingUp, 
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20"
    }
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3 border-b border-white/5 pb-4">
        <div className="h-10 w-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
          <DollarSign className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">Resumen Financiero</h2>
          <p className="text-slate-500 text-xs">Métricas de facturación y rendimiento operativo.</p>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-900/40 animate-pulse rounded-2xl border border-white/5" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <article key={i} className="srf-card-soft p-6 group hover:border-white/10 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className={`h-12 w-12 rounded-2xl ${stat.bg} border ${stat.border} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-slate-700" />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{stat.label}</div>
                <div className="text-2xl font-black text-white tracking-tight">{stat.value}</div>
              </article>
            );
          })}
        </div>
      )}

      <section className="srf-card-soft p-6 border-dashed border-white/10">
        <div className="flex items-center gap-3 mb-4">
           <CreditCard className="h-4 w-4 text-slate-500" />
           <h3 className="text-sm font-bold text-slate-300">Próxima liquidación</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Las métricas se sincronizan automáticamente con Mercado Pago. Las órdenes "Listas" impactan el total proyectado de ventas.
        </p>
      </section>
    </div>
  );
}
