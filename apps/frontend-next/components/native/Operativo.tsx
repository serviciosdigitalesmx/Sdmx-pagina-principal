'use client';
import type { ServiceOrderCreateRequestDto } from "@contracts/index";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { ClipboardList, Plus, User, Smartphone, AlertCircle } from "lucide-react";

interface Customer {
  id: string;
  fullName: string;
}

interface Order {
  id: string;
  folio: string;
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  status: string;
}

export function Operativo() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    customerId: "",
    deviceType: "",
    deviceBrand: "",
    deviceModel: "",
    reportedIssue: ""
  });

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [customersRes, ordersRes] = await Promise.all([
        apiClient.get<Customer[]>("/api/customers"),
        apiClient.get<Order[]>("/api/service-orders")
      ]);

      if (!customersRes.success) throw new Error(customersRes.error?.message);
      if (!ordersRes.success) throw new Error(ordersRes.error?.message);

      setCustomers(customersRes.data || []);
      setOrders(ordersRes.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();

    if (!form.customerId) return setError("Selecciona un cliente");
    if (!form.deviceType) return setError("Falta tipo de equipo");
    if (!form.reportedIssue) return setError("Falla reportada es obligatoria");

    setLoading(true);
    setError("");

    try {
      const res = await apiClient.post("/api/service-orders", form);
      if (!res.success) throw new Error(res.error?.message);

      setForm({
        customerId: "",
        deviceType: "",
        deviceBrand: "",
        deviceModel: "",
        reportedIssue: ""
      });

      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creando orden");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3 border-b border-white/5 pb-4">
        <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <ClipboardList className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">Gestión de Órdenes</h2>
          <p className="text-slate-500 text-xs">Recepción y control de equipos en taller.</p>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold flex items-center gap-3">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Cliente</label>
          <select
            className="srf-input bg-slate-950/50"
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value })}
          >
            <option value="">Seleccionar cliente...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.fullName}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Tipo de Equipo</label>
          <input
            className="srf-input"
            placeholder="Ej. Laptop, Celular..."
            value={form.deviceType}
            onChange={(e) => setForm({ ...form, deviceType: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Marca</label>
          <input
            className="srf-input"
            placeholder="Ej. Apple, HP, Samsung"
            value={form.deviceBrand}
            onChange={(e) => setForm({ ...form, deviceBrand: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Modelo</label>
          <input
            className="srf-input"
            placeholder="Ej. iPhone 15, Pavilion x360"
            value={form.deviceModel}
            onChange={(e) => setForm({ ...form, deviceModel: e.target.value })}
          />
        </div>

        <div className="md:col-span-2 space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Falla Reportada</label>
          <textarea
            className="srf-input min-h-[80px] py-3"
            placeholder="Describe el problema que reporta el cliente..."
            value={form.reportedIssue}
            onChange={(e) => setForm({ ...form, reportedIssue: e.target.value })}
          />
        </div>

        <button 
          disabled={loading}
          className="md:col-span-2 srf-btn-primary py-4 flex items-center justify-center gap-2 font-black uppercase tracking-widest text-sm"
        >
          {loading ? "Procesando..." : <><Plus className="h-4 w-4" /> Registrar Orden</>}
        </button>
      </form>

      <div className="space-y-4 pt-4 border-t border-white/5">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 ml-2">Últimos Registros</h3>
        <div className="grid gap-3">
          {orders.map((o) => (
            <article key={o.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-blue-500/30 transition-all group">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-blue-400 font-bold text-xs uppercase tracking-tighter shadow-inner">
                  {o.folio}
                </div>
                <div>
                  <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                    {o.deviceBrand} {o.deviceModel}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">{o.deviceType}</div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                o.status === 'recibido' ? 'srf-badge-blue' : 'srf-badge-green'
              }`}>
                {o.status}
              </span>
            </article>
          ))}
          {orders.length === 0 && !loading && (
            <p className="text-center py-10 text-slate-600 italic text-sm">No hay órdenes para mostrar.</p>
          )}
        </div>
      </div>
    </div>
  );
}
