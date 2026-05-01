'use client';
import type { ServiceOrderCreateRequestDto } from "@sdmx/contracts";
import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { ClipboardList, Plus, Smartphone, AlertCircle } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

interface Order {
  id: string;
  folio: string;
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  status: string;
}

export function Operativo() {
  const [tenantId, setTenantId] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    customerFullName: "",
    customerEmail: "",
    customerPhone: "",
    deviceType: "",
    deviceBrand: "",
    deviceModel: "",
    reportedIssue: ""
  });

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const ordersRes = await apiClient.get<Order[]>("/api/service-orders");

      if (!ordersRes.success) throw new Error(ordersRes.error?.message);

      setOrders(ordersRes.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const resolveTenant = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.getSession();
      const tenant = data.session?.user.user_metadata?.tenant_id || data.session?.user.app_metadata?.tenant_id || '';
      setTenantId(tenant);
    };

    void resolveTenant();
    loadData();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();

    if (!form.customerFullName.trim()) return setError("Falta nombre del cliente");
    if (!form.customerEmail.trim()) return setError("Falta correo del cliente");
    if (!form.deviceType) return setError("Falta tipo de equipo");
    if (!form.reportedIssue) return setError("Falla reportada es obligatoria");

    setLoading(true);
    setError("");

    try {
      const customerRes = await apiClient.post<{ id: string }>("/api/customers", {
        tenantId,
        fullName: form.customerFullName.trim(),
        email: form.customerEmail.trim(),
        phone: form.customerPhone.trim() || null
      });
      if (!customerRes.success || !customerRes.data?.id) {
        throw new Error(customerRes.error?.message || "No se pudo crear el cliente");
      }

      const orderPayload: ServiceOrderCreateRequestDto = {
        tenantId,
        customerId: customerRes.data.id,
        deviceType: form.deviceType,
        deviceBrand: form.deviceBrand,
        deviceModel: form.deviceModel,
        reportedIssue: form.reportedIssue
      };

      const res = await apiClient.post("/api/service-orders", orderPayload);
      if (!res.success) throw new Error(res.error?.message || "No se pudo crear la orden");

      setForm({
        customerFullName: "",
        customerEmail: "",
        customerPhone: "",
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
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 rounded-3xl border border-white/5 bg-white/5 p-4">
          <div className="space-y-1 md:col-span-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Cliente nuevo</label>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Nombre</label>
            <input
              className="srf-input"
              placeholder="Ej. Juan Pérez"
              value={form.customerFullName}
              onChange={(e) => setForm({ ...form, customerFullName: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Correo</label>
            <input
              className="srf-input"
              placeholder="juan@correo.com"
              type="email"
              value={form.customerEmail}
              onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Teléfono</label>
            <input
              className="srf-input"
              placeholder="8112345678"
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
            />
          </div>
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
