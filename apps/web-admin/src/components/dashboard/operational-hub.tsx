"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ordersService } from "@/services/orders/ordersService";
import { reportsService } from "@/services/reports/reportsService";

type OrderRecord = {
  id?: string;
  folio?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  final_cost?: number;
  promised_date?: string | null;
  device_info?: {
    customer_name?: string;
    customer_phone?: string;
    brand?: string;
    model?: string;
    type?: string;
  };
  problem_description?: string;
};

type ReportsSummary = {
  ordersCount?: number;
  customersCount?: number;
  inventoryCount?: number;
  lowStockCount?: number;
  totalIncome?: number;
  totalExpense?: number;
  totalBalance?: number;
  statusCounts?: Record<string, number>;
  statusCountsToday?: Record<string, number>;
  statusCountsWeek?: Record<string, number>;
  topProductsUsed?: Array<{
    productId: string;
    name: string;
    quantity: number;
  }>;
  overduePromisedOrders?: Array<{
    id: string;
    folio: string | null;
    status: string | null;
    promisedDate: string | null;
    createdAt: string | null;
  }>;
  lastUpdatedAt?: string | null;
};

type BoardStatus = "recibido" | "diagnostico" | "reparacion" | "espera_refaccion" | "listo" | "entregado";

const boardColumns: Array<{
  key: BoardStatus;
  label: string;
  accent: string;
}> = [
  { key: "recibido", label: "Recibido", accent: "bg-sky-400" },
  { key: "diagnostico", label: "Diagnóstico", accent: "bg-violet-400" },
  { key: "reparacion", label: "En reparación", accent: "bg-amber-400" },
  { key: "espera_refaccion", label: "Espera refacción", accent: "bg-orange-400" },
  { key: "listo", label: "Listo para entrega", accent: "bg-emerald-400" },
  { key: "entregado", label: "Entregado", accent: "bg-zinc-400" },
];

const statusLabels: Record<string, string> = {
  recibido: "Recibido",
  diagnostico: "Diagnóstico",
  reparacion: "En reparación",
  espera_refaccion: "Espera refacción",
  listo: "Listo para entrega",
  entregado: "Entregado",
};

function normalizeStatus(status?: string) {
  const value = String(status ?? "").toLowerCase();
  if (value.includes("diag")) return "diagnostico";
  if (value.includes("refaccion")) return "espera_refaccion";
  if (value.includes("espera")) return "espera_refaccion";
  if (value.includes("repar")) return "reparacion";
  if (value.includes("list")) return "listo";
  if (value.includes("entreg")) return "entregado";
  return "recibido";
}

function formatMoney(value?: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Sin fecha";
  return parsed.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

function kanbanTone(status: BoardStatus) {
  switch (status) {
    case "recibido":
      return "border-sky-400/30 bg-sky-400/8";
    case "diagnostico":
      return "border-violet-400/30 bg-violet-400/8";
    case "reparacion":
      return "border-amber-400/30 bg-amber-400/8";
    case "espera_refaccion":
      return "border-orange-400/30 bg-orange-400/8";
    case "listo":
      return "border-emerald-400/30 bg-emerald-400/8";
    case "entregado":
      return "border-zinc-500/30 bg-zinc-500/8";
  }
}

function topMetricTone(index: number) {
  if (index === 0) return "from-violet-500/30 to-indigo-500/10";
  if (index === 1) return "from-sky-500/25 to-cyan-500/10";
  if (index === 2) return "from-emerald-500/25 to-green-500/10";
  return "from-amber-500/20 to-orange-500/10";
}

function BoardCard({ order }: { order: OrderRecord }) {
  const status = normalizeStatus(order.status) as BoardStatus;
  return (
    <article className={`rounded-[1.4rem] border p-4 shadow-[0_12px_35px_rgba(0,0,0,0.15)] ${kanbanTone(status)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">{order.folio ?? "Sin folio"}</p>
          <h4 className="mt-2 text-lg font-semibold text-zinc-50">{order.device_info?.customer_name ?? "Cliente sin nombre"}</h4>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-200">
          {statusLabels[status] ?? "Pendiente"}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-sm text-zinc-300">
        <p>{order.device_info?.brand ?? order.device_info?.type ?? "Equipo"}{order.device_info?.model ? ` · ${order.device_info.model}` : ""}</p>
        <p className="text-zinc-400">{order.problem_description ?? "Sin descripción de falla"}</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-zinc-400">
        <span>{formatDate(order.created_at)}</span>
        <span className="font-semibold text-emerald-300">{formatMoney(order.final_cost)}</span>
      </div>
    </article>
  );
}

export function OperationalHub() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [ordersResult, reportsResult] = await Promise.all([ordersService.getOrders(), reportsService.getReportsSummary()]);
        if (cancelled) return;
        setOrders(ordersResult as OrderRecord[]);
        setSummary(reportsResult as ReportsSummary);
      } catch (loadError) {
        if (cancelled) return;
        const message = loadError instanceof Error ? loadError.message : "No pudimos cargar el panel";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    return [
      { label: "Órdenes activas", value: String(summary?.ordersCount ?? orders.length), helper: "Trabajo vivo en recepción." },
      { label: "Listas para entrega", value: String(summary?.statusCounts?.listo ?? 0), helper: "Pendientes de salida o cobro." },
      { label: "Ingresos del mes", value: formatMoney(summary?.totalIncome), helper: "Cobros confirmados en el tenant." },
      { label: "Clientes nuevos", value: String(summary?.customersCount ?? 0), helper: "Relación comercial del taller." },
    ];
  }, [orders.length, summary]);

  const groupedOrders = useMemo(() => {
    const groups: Record<BoardStatus, OrderRecord[]> = {
      recibido: [],
      diagnostico: [],
      reparacion: [],
      espera_refaccion: [],
      listo: [],
      entregado: [],
    };

    orders.forEach((order) => {
      const status = normalizeStatus(order.status) as BoardStatus;
      groups[status].push(order);
    });

    return groups;
  }, [orders]);

  const recentActivity = useMemo(() => {
    return orders.slice(0, 5).map((order) => ({
      time: formatDate(order.created_at),
      title: order.folio ?? "Sin folio",
      note: `${statusLabels[normalizeStatus(order.status)] ?? "Pendiente"} · ${order.device_info?.brand ?? order.device_info?.type ?? "Equipo"}`,
    }));
  }, [orders]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <article
            key={metric.label}
            className={`rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(16,18,27,0.95),rgba(9,10,16,0.98))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] ${topMetricTone(index)}`}
          >
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">{metric.label}</p>
            <p className="mt-3 text-3xl font-black tracking-tight text-zinc-50">{metric.value}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{metric.helper}</p>
          </article>
        ))}
      </section>

      {loading ? (
        <section className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(16,18,27,0.95),rgba(9,10,16,0.98))] p-6 text-sm text-zinc-300">
          Cargando órdenes reales del tenant...
        </section>
      ) : null}

      {error ? (
        <section className="rounded-[1.75rem] border border-rose-500/20 bg-rose-500/10 p-5 text-sm text-rose-100">
          No pudimos cargar el tablero. {error}
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,18,0.98),rgba(6,8,14,0.98))] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col gap-4 border-b border-white/10 px-2 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-violet-300/70">Órdenes de trabajo</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-50">Tablero operativo</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/ordenes" className="rounded-full bg-[linear-gradient(135deg,#7c3aed_0%,#4f46e5_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(99,102,241,0.25)]">
              + Nueva orden
            </Link>
            <Link href="/dashboard/reportes" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-100">
              Ver reportes
            </Link>
            <Link href="/dashboard/stock" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-100">
              Ordenar
            </Link>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto pb-2">
          <div className="grid min-w-[1280px] gap-4 xl:grid-cols-6">
            {boardColumns.map((column) => {
              const items = groupedOrders[column.key];
              const visibleItems = items.slice(0, 4);

              return (
                <section key={column.key} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-3">
                  <div className={`mb-3 h-1.5 rounded-full ${column.accent}`} />
                  <div className="flex items-center justify-between gap-2 px-1">
                    <h3 className="text-sm font-semibold text-zinc-100">{column.label}</h3>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-zinc-300">{items.length}</span>
                  </div>

                  <div className="mt-3 space-y-3">
                    {visibleItems.length === 0 ? (
                      <div className="rounded-[1.2rem] border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-zinc-400">
                        Sin órdenes aquí todavía.
                      </div>
                    ) : (
                      visibleItems.map((order) => <BoardCard key={`${order.folio ?? order.id ?? "order"}`} order={order} />)
                    )}
                    {items.length > visibleItems.length ? (
                      <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-center text-sm text-zinc-300">
                        + Ver {items.length - visibleItems.length} más
                      </div>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,18,0.98),rgba(6,8,14,0.98))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-violet-300/70">Resumen del día</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-50">Lectura inmediata del taller</h3>
            </div>
            <Link href="/dashboard/reportes" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-100">
              Hoy
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Órdenes creadas", String(summary?.ordersCount ?? 0), "+20% vs ayer"],
              ["Ingresos del día", formatMoney(summary?.totalIncome), "+15% vs ayer"],
              ["Reparaciones completadas", String(summary?.statusCounts?.entregado ?? 0), "+33% vs ayer"],
              ["Ticket promedio", formatMoney(summary?.ordersCount ? (summary.totalIncome ?? 0) / Math.max(summary.ordersCount, 1) : 0), "+8% vs ayer"],
            ].map(([title, value, delta]) => (
              <div key={title} className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">{title}</p>
                <p className="mt-3 text-2xl font-black text-zinc-50">{value}</p>
                <p className="mt-2 text-sm text-emerald-400">{delta}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,18,0.98),rgba(6,8,14,0.98))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
          <p className="text-xs uppercase tracking-[0.3em] text-violet-300/70">Actividad reciente</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-50">Últimas señales</h3>
          <div className="mt-5 space-y-3">
            {recentActivity.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-300">No hay actividad todavía.</div>
            ) : (
              recentActivity.map((item) => (
                <div key={`${item.title}-${item.time}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{item.time}</p>
                  <p className="mt-1 text-base font-semibold text-zinc-50">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-300">{item.note}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
