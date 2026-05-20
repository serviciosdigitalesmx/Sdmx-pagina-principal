"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fixService } from "@/services/fixService";

type OrderRecord = {
  folio?: string;
  status?: string;
  created_at?: string;
  total_cost?: number;
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
  lastUpdatedAt?: string | null;
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  diagnosis: "Diagnóstico",
  in_repair: "En reparación",
  ready: "Listo",
  delivered: "Entregado",
  archived: "Archivado",
};

function normalizeStatus(status?: string) {
  const value = String(status ?? "").toLowerCase();
  if (value.includes("diag")) return "diagnosis";
  if (value.includes("repar")) return "in_repair";
  if (value.includes("list")) return "ready";
  if (value.includes("entreg")) return "delivered";
  if (value.includes("archiv")) return "archived";
  return "pending";
}

function formatMoney(value?: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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
        const [ordersResult, reportsResult] = await Promise.all([
          fixService.getOrders(),
          fixService.getReportsSummary(),
        ]);

        if (cancelled) return;

        setOrders(ordersResult as OrderRecord[]);
        setSummary(reportsResult as ReportsSummary);
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "No pudimos cargar el hub operativo");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const actionableOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const status = normalizeStatus(order.status);
        return status !== "delivered" && status !== "archived";
      })
      .slice(0, 5);
  }, [orders]);

  const recentActivity = useMemo(() => {
    return orders.slice(0, 5).map((order) => ({
      time: formatDate(order.created_at),
      title: order.folio ?? "Sin folio",
      note: `${statusLabels[normalizeStatus(order.status)] ?? "Pendiente"} · ${order.device_info?.brand ?? order.device_info?.type ?? "Equipo sin tipo"}`,
    }));
  }, [orders]);

  const metrics = [
    { label: "Órdenes activas", value: summary?.ordersCount ?? orders.length, helper: "Trabajo vivo en recepción." },
    { label: "Pendientes hoy", value: summary?.statusCounts?.pending ?? 0, helper: "Requieren atención inmediata." },
    { label: "En diagnóstico", value: summary?.statusCounts?.diagnosis ?? 0, helper: "Equipo en revisión técnica." },
    { label: "Listos para entregar", value: summary?.statusCounts?.ready ?? 0, helper: "Esperando cobro o salida." },
    { label: "Stock crítico", value: summary?.lowStockCount ?? 0, helper: "Revisión de abasto y compras." },
    { label: "Balance", value: formatMoney(summary?.totalBalance), helper: "Lectura financiera del tenant." },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top,rgba(44,110,159,0.08),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#245a82]">Hoy</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl [font-family:var(--font-display)]">
              Mesa de control operativa
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Lo urgente primero: órdenes activas, pendientes de acción y lectura inmediata de cobro, stock y movimiento del día.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/ordenes" className="rounded-full bg-[#2c6e9f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#245a82]">
              + Nueva orden
            </Link>
            <Link href="/dashboard/finanzas" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50">
              Cobrar / Finanzas
            </Link>
            <Link href="/dashboard/clientes" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50">
              Abrir cliente
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
          Cargando operaciones reales del tenant...
        </section>
      ) : null}

      {error ? (
        <section className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          No pudimos cargar el hub operativo. {error}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-[24px] border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#2c6e9f]/30">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{metric.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{metric.helper}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_70px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#245a82]">Órdenes que requieren acción</p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Lo urgente primero</h3>
            </div>
            <p className="text-sm text-slate-500">
              {actionableOrders.length > 0 ? `${actionableOrders.length} por revisar` : "Sin pendientes visibles"}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {actionableOrders.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                No hay órdenes registradas todavía. Crea la primera orden para empezar a operar.
              </div>
            ) : (
              actionableOrders.map((order) => {
                const normalized = normalizeStatus(order.status);
                const phone = order.device_info?.customer_phone;
                const whatsappHref = phone ? `https://wa.me/${phone.replace(/\D/g, "")}` : undefined;
                return (
                  <div key={order.folio ?? `${order.created_at}-${order.problem_description}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.1fr_0.9fr_0.8fr] lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-950">{order.folio ?? "Sin folio"}</p>
                        <span className="rounded-full bg-[#2c6e9f]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#245a82]">
                          {statusLabels[normalized] ?? "Pendiente"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {order.device_info?.customer_name ?? "Cliente sin nombre"} ·{" "}
                        {order.device_info?.brand ?? order.device_info?.type ?? "Equipo sin tipo"}
                        {order.device_info?.model ? ` · ${order.device_info.model}` : ""}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {order.problem_description ?? "Sin descripción de falla"}
                      </p>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Ingreso</p>
                      <p className="mt-1 font-medium text-slate-900">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Link href="/dashboard/ordenes" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white">
                        Abrir
                      </Link>
                      {whatsappHref ? (
                        <a href={whatsappHref} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white">
                          WhatsApp
                        </a>
                      ) : (
                        <span className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-400">
                          Sin WhatsApp
                        </span>
                      )}
                      <Link href="/dashboard/finanzas" className="rounded-full bg-[#1b9e5e]/10 px-4 py-2 text-sm font-semibold text-[#1b9e5e] transition hover:bg-[#1b9e5e]/15">
                        Cobrar
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_70px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#245a82]">Actividad reciente</p>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Últimas señales del día</h3>
          <div className="mt-5 space-y-3">
            {recentActivity.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                No hay actividad todavía. Las órdenes nuevas aparecerán aquí.
              </div>
            ) : (
              recentActivity.map((item) => (
                <div key={`${item.title}-${item.time}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{item.time}</p>
                  <p className="mt-1 text-base font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.note}</p>
                </div>
              ))
            )}
          </div>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.08),_transparent_34%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#245a82]">Acción rápida</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link href="/dashboard/ordenes" className="rounded-full bg-[#2c6e9f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245a82]">
                Crear orden
              </Link>
              <Link href="/dashboard/stock" className="rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-white">
                Revisar stock
              </Link>
              <Link href="/dashboard/reportes" className="rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-white">
                Ver reportes
              </Link>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
