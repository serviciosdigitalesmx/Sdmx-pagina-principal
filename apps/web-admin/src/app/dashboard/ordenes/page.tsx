"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { fixService } from "@/services/fixService";
import { Table } from "@white-label/ui";

type OrderStatus = "pending" | "diagnostico" | "reparacion" | "listo" | "entregado";

type OrderRow = {
  id?: string;
  folio?: string;
  clientName?: string;
  customer_name?: string;
  device_model?: string;
  device_info?: {
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    brand?: string;
    model?: string;
    type?: string;
  };
  problem_description?: string;
  status?: string;
  created_at?: string;
};

const columnLabels: Record<OrderStatus, string> = {
  pending: "Recibido",
  diagnostico: "Diagnóstico",
  reparacion: "En reparación",
  listo: "Listo",
  entregado: "Entregado",
};

function normalizeStatus(status?: string): OrderStatus {
  const value = (status || "").toLowerCase();

  if (value.includes("diag")) return "diagnostico";
  if (value.includes("repar")) return "reparacion";
  if (value.includes("list")) return "listo";
  if (value.includes("entreg")) return "entregado";
  return "pending";
}

export default function OrdenesKanbanPage() {
  const { role } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [form, setForm] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    deviceType: "Smartphone",
    deviceModel: "",
    issue: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await fixService.getOrders();
        if (!cancelled) setOrders(data as OrderRow[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar órdenes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const columns = useMemo(
    () =>
      (["pending", "diagnostico", "reparacion", "listo", "entregado"] as OrderStatus[]).map((id) => ({
        id,
        title: columnLabels[id],
      })),
    []
  );

  const mappedRows = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        clientName: order.clientName ?? order.customer_name ?? order.device_info?.customer_name ?? "",
        device_model: order.device_model ?? order.device_info?.model ?? order.device_info?.brand ?? "",
      })),
    [orders]
  );

  if (!mounted) {
    return (
      <RequireRole allowed={["owner", "manager", "technician"]}>
        <div className="space-y-6 text-slate-950">
          <header className="flex flex-col justify-between gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_70px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 [font-family:var(--font-display)]">
                Tablero de Órdenes
              </h1>
              <p className="mt-1 text-sm text-slate-600">Gestiona el flujo de trabajo del taller con datos reales del API.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-11 w-36 rounded-full bg-slate-100" aria-busy="true" />
            </div>
          </header>

          <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-[0_12px_50px_rgba(15,23,42,0.06)]">
            Cargando órdenes...
          </div>
        </div>
      </RequireRole>
    );
  }

  const handleDragStart = (event: React.DragEvent, id?: string) => {
    if (!id) return;
    setDraggedOrderId(id);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (event: React.DragEvent, status: OrderStatus) => {
    event.preventDefault();
    if (!draggedOrderId) return;

    setOrders((current) =>
      current.map((order) => (order.id === draggedOrderId ? { ...order, status } : order))
    );
    setDraggedOrderId(null);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const created = await fixService.createOrder({
        clientName: form.clientName.trim(),
        clientPhone: form.clientPhone.trim(),
        clientEmail: form.clientEmail.trim(),
        deviceType: form.deviceType.trim(),
        deviceModel: form.deviceModel.trim(),
        issue: form.issue.trim(),
      });

      setOrders((current) => [created as OrderRow, ...current]);
      setForm({
        clientName: "",
        clientPhone: "",
        clientEmail: "",
        deviceType: "Smartphone",
        deviceModel: "",
        issue: "",
      });
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear orden");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RequireRole allowed={["owner", "manager", "technician"]}>
      <div className="space-y-6 text-slate-950">
        <header className="flex flex-col justify-between gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_70px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 [font-family:var(--font-display)]">
              Tablero de Órdenes
            </h1>
            <p className="mt-1 text-sm text-slate-600">Gestiona el flujo de trabajo del taller con datos reales del API.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-full bg-[#2c6e9f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245a82]"
            >
              Nueva Orden
            </button>
          </div>
        </header>

        {error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {columns.map((column) => {
            const columnOrders = mappedRows.filter((order) => normalizeStatus(order.status) === column.id);

            return (
              <div
                key={column.id}
                className="min-w-[260px] rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_50px_rgba(15,23,42,0.06)]"
                onDragOver={handleDragOver}
                onDrop={(event) => handleDrop(event, column.id)}
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#245a82]">{column.title}</h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {columnOrders.length}
                  </span>
                </div>
                <div className="space-y-3 p-3">
                  {columnOrders.map((order) => (
                    <article
                      key={order.id}
                      draggable={Boolean(order.id)}
                      onDragStart={(event) => handleDragStart(event, order.id)}
                      className="cursor-grab rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#2c6e9f]/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#245a82]">{order.folio ?? "ORD-..."}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">{order.clientName ?? "Cliente sin nombre"}</p>
                        </div>
                        <span className="rounded-full bg-[#1b9e5e]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1b9e5e]">
                          Activo
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{order.device_model ?? "Equipo sin detallar"}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-700">{order.problem_description ?? "Sin descripción"}</p>
                    </article>
                  ))}
                  {loading ? (
                    <p className="px-2 py-8 text-center text-sm text-slate-500">Cargando órdenes…</p>
                  ) : columnOrders.length === 0 ? (
                    <p className="px-2 py-8 text-center text-sm text-slate-500">Sin órdenes en esta columna</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {isModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_90px_rgba(15,23,42,0.16)]">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">Recepción rápida</h2>
                  <p className="text-sm text-slate-600">Alta real de orden contra el API del tenant.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 transition hover:text-slate-900">
                  ✕
                </button>
              </div>

              <form className="grid gap-4 p-6" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    name="clientName"
                    value={form.clientName}
                    onChange={handleChange}
                    placeholder="Nombre completo"
                    className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20"
                    required
                  />
                  <input
                    name="clientPhone"
                    value={form.clientPhone}
                    onChange={handleChange}
                    placeholder="WhatsApp"
                    className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20"
                    required
                  />
                  <input
                    name="clientEmail"
                    value={form.clientEmail}
                    onChange={handleChange}
                    placeholder="Correo opcional"
                    type="email"
                    className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20"
                  />
                  <select
                    name="deviceType"
                    value={form.deviceType}
                    onChange={handleChange}
                    className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20"
                  >
                    <option>Smartphone</option>
                    <option>Laptop</option>
                    <option>Consola</option>
                    <option>Tablet</option>
                  </select>
                </div>
                <input
                  name="deviceModel"
                  value={form.deviceModel}
                  onChange={handleChange}
                  placeholder="Modelo exacto"
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20"
                  required
                />
                <textarea
                  name="issue"
                  value={form.issue}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe el problema"
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20"
                  required
                />

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-full bg-[#2c6e9f] px-5 py-3 font-semibold text-white transition hover:bg-[#245a82] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Creando..." : "Crear orden"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_70px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#245a82]">Tabla real</p>
          <Table<OrderRow>
            columns={[
              { label: "Folio", key: "folio" },
              { label: "Cliente", key: "clientName" },
              { label: "Equipo", key: "device_model" },
              { label: "Estado", key: "status" },
            ]}
            rows={mappedRows}
            emptyMessage={loading ? "Cargando órdenes…" : "No hay órdenes para mostrar"}
          />
        </section>
      </div>
    </RequireRole>
  );
}
