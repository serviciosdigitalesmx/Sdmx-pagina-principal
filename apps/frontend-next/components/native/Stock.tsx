'use client';
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { Boxes, Tag, Package, AlertCircle, ShoppingCart } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
}

export function Stock() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await apiClient.get<Product[]>("/api/inventory-products");
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
        <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <Boxes className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">Inventario de Refacciones</h2>
          <p className="text-slate-500 text-xs">Control de stock y suministros operativos.</p>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-900/40 animate-pulse rounded-2xl border border-white/5" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item) => (
            <article key={item.id} className="srf-card-soft p-5 group hover:border-purple-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-purple-400">
                    <Package className="h-5 w-5" />
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    {item.category}
                  </span>
                </div>
                <h3 className="text-white font-bold mb-1 group-hover:text-purple-400 transition-colors">
                  {item.name}
                </h3>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <Tag className="h-3.5 w-3.5 text-slate-600" />
                  ${item.price.toFixed(2)} MXN
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Existencia</span>
                  <div className={`text-lg font-black ${item.stock <= 2 ? 'text-red-400' : 'text-green-400'}`}>
                    {item.stock} <span className="text-xs font-medium text-slate-500">unid.</span>
                  </div>
                </div>
                {item.stock <= 2 && (
                  <div className="flex items-center gap-1 text-[9px] font-black text-red-400 uppercase tracking-widest bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20">
                    <AlertCircle className="h-3 w-3" /> Reordenar
                  </div>
                )}
              </div>
            </article>
          ))}
          {data.length === 0 && (
            <div className="col-span-full py-20 text-center srf-card-soft opacity-50 italic text-slate-500 text-sm">
              No hay productos registrados en el inventario.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
