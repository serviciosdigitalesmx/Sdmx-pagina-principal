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
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMounted(true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

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
        setError(loadError instanceof Error ? loadError.message : "No pudimos cargar el panel");
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
    if (!mounted) {
      return [];
    }

    return orders
      .filter((order) => {
        const status = normalizeStatus(order.status);
        return status !== "delivered" && status !== "archived";
      })
      .slice(0, 5);
  }, [mounted, orders]);

  const recentActivity = useMemo(() => {
    if (!mounted) {
      return [];
    }

    return orders.slice(0, 5).map((order) => ({
      time: formatDate(order.created_at),
      title: order.folio ?? "Sin folio",
      note: `${statusLabels[normalizeStatus(order.status)] ?? "Pendiente"} · ${order.device_info?.brand ?? order.device_info?.type ?? "Equipo sin tipo"}`,
    }));
  }, [mounted, orders]);

  const metrics = useMemo(() => {
    if (!mounted) {
      return [
        { label: "Órdenes activas", value: "—", helper: "Trabajo vivo en recepción." },
        { label: "Pendientes hoy", value: "—", helper: "Requieren atención inmediata." },
        { label: "En diagnóstico", value: "—", helper: "Equipo en revisión técnica." },
        { label: "Listos para entregar", value: "—", helper: "Esperando cobro o salida." },
        { label: "Stock crítico", value: "—", helper: "Revisión de abasto y compras." },
        { label: "Balance", value: "—", helper: "Lectura financiera del tenant." },
      ];
    }

    return [
    { label: "Órdenes activas", value: summary?.ordersCount ?? orders.length, helper: "Trabajo vivo en recepción." },
    { label: "Pendientes hoy", value: summary?.statusCounts?.pending ?? 0, helper: "Requieren atención inmediata." },
    { label: "En diagnóstico", value: summary?.statusCounts?.diagnosis ?? 0, helper: "Equipo en revisión técnica." },
    { label: "Listos para entregar", value: summary?.statusCounts?.ready ?? 0, helper: "Esperando cobro o salida." },
    { label: "Stock crítico", value: summary?.lowStockCount ?? 0, helper: "Revisión de abasto y compras." },
    { label: "Balance", value: formatMoney(summary?.totalBalance), helper: "Lectura financiera del tenant." },
    ];
  }, [mounted, orders.length, summary?.lowStockCount, summary?.ordersCount, summary?.statusCounts?.diagnosis, summary?.statusCounts?.pending, summary?.statusCounts?.ready, summary?.totalBalance]);

  const shortcuts = [
    { label: "Operativo", href: "/dashboard", role: "owner" },
    { label: "Órdenes", href: "/dashboard/ordenes", role: "owner" },
    { label: "Clientes", href: "/dashboard/clientes", role: "owner" },
    { label: "Solicitudes", href: "/dashboard/solicitudes", role: "manager" },
    { label: "Stock", href: "/dashboard/stock", role: "manager" },
    { label: "Compras", href: "/dashboard/compras", role: "manager" },
    { label: "Gastos", href: "/dashboard/gastos", role: "manager" },
    { label: "Finanzas", href: "/dashboard/finanzas", role: "manager" },
    { label: "Reportes", href: "/dashboard/reportes", role: "manager" },
    { label: "Sucursales", href: "/dashboard/sucursales", role: "manager" },
    { label: "Seguridad", href: "/dashboard/seguridad", role: "manager" },
  ];

  if (!mounted) {
    return (
      <div className="space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top,rgba(44,110,159,0.08),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#1f2937]">Hoy</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl [font-family:var(--font-display)]">
                Mesa de control operativa
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Lo urgente primero: órdenes activas, pendientes de acción y lectura inmediata de cobro, stock y movimiento del día.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="h-11 w-32 rounded-full bg-slate-200/70" />
              <div className="h-11 w-36 rounded-full bg-slate-200/70" />
              <div className="h-11 w-28 rounded-full bg-slate-200/70" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <article key={index} className="rounded-[24px] border border-slate-200 bg-white p-5">
              <div className="h-3 w-24 rounded-full bg-slate-200" />
              <div className="mt-3 h-8 w-16 rounded-full bg-slate-200" />
              <div className="mt-2 h-4 w-40 rounded-full bg-slate-100" />
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_70px_rgba(15,23,42,0.08)]">
            <div className="h-3 w-48 rounded-full bg-slate-200" />
            <div className="mt-4 space-y-3">
              <div className="h-24 rounded-2xl bg-slate-100" />
              <div className="h-24 rounded-2xl bg-slate-100" />
            </div>
          </article>
          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_70px_rgba(15,23,42,0.08)]">
            <div className="h-3 w-40 rounded-full bg-slate-200" />
            <div className="mt-4 space-y-3">
              <div className="h-20 rounded-2xl bg-slate-100" />
              <div className="h-20 rounded-2xl bg-slate-100" />
            </div>
          </article>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-amber-700/15 bg-black/20 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.14)]">
        <div className="flex flex-wrap gap-2">
          {shortcuts.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-full border border-stone-700 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-amber-700/30 hover:bg-white/5"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-amber-700/15 bg-[linear-gradient(180deg,rgba(16,14,12,0.96),rgba(22,18,14,0.98))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-100/70">Centro de control live</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-50 sm:text-4xl [font-family:var(--font-display)]">
              Mesa de control operativa
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-300">
              Lo urgente primero: órdenes activas, pendientes de acción y lectura inmediata de cobro, stock y movimiento del día.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/ordenes" className="rounded-full bg-amber-50 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-100">
              Nueva recepción
            </Link>
            <Link href="/dashboard/finanzas" className="rounded-full border border-stone-700 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/5">
              Finanzas
            </Link>
            <Link href="/dashboard/clientes" className="rounded-full border border-stone-700 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/5">
              Clientes
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="rounded-[24px] border border-amber-700/15 bg-white/4 p-6 text-sm text-zinc-300 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
          Cargando operaciones reales del tenant...
        </section>
      ) : null}

      {error ? (
        <section className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-200">
          No pudimos cargar el panel. {error}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-[24px] border border-stone-700/70 bg-white/4 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-amber-700/30">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-100/60">{metric.label}</p>
            <p className="mt-3 text-3xl font-black tracking-tight text-zinc-50">{metric.value}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{metric.helper}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[28px] border border-amber-700/15 bg-[linear-gradient(180deg,rgba(16,14,12,0.96),rgba(22,18,14,0.98))] p-6 shadow-[0_16px_70px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-100/70">Órdenes que requieren acción</p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-zinc-50">Lo urgente primero</h3>
            </div>
            <p className="text-sm text-zinc-400">
              {actionableOrders.length > 0 ? `${actionableOrders.length} por revisar` : "Sin pendientes visibles"}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {actionableOrders.length === 0 ? (
              <div className="rounded-2xl border border-stone-700/70 bg-black/20 p-5 text-sm text-zinc-300">
                No hay órdenes registradas todavía. Crea la primera orden para empezar a operar.
              </div>
            ) : (
              actionableOrders.map((order) => {
                const normalized = normalizeStatus(order.status);
                const phone = order.device_info?.customer_phone;
                const whatsappHref = phone ? `https://wa.me/${phone.replace(/\D/g, "")}` : undefined;
                return (
                  <div key={order.folio ?? `${order.created_at}-${order.problem_description}`} className="grid gap-3 rounded-2xl border border-stone-700/70 bg-zinc-950/60 p-4 lg:grid-cols-[1.1fr_0.9fr_0.8fr] lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-zinc-50">{order.folio ?? "Sin folio"}</p>
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100/80">
                          {statusLabels[normalized] ?? "Pendiente"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-zinc-300">
                        {order.device_info?.customer_name ?? "Cliente sin nombre"} ·{" "}
                        {order.device_info?.brand ?? order.device_info?.type ?? "Equipo sin tipo"}
                        {order.device_info?.model ? ` · ${order.device_info.model}` : ""}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-zinc-400">
                        {order.problem_description ?? "Sin descripción de falla"}
                      </p>
                    </div>
                    <div className="text-sm text-zinc-300">
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Ingreso</p>
                      <p className="mt-1 font-medium text-zinc-50">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Link href="/dashboard/ordenes" className="rounded-full border border-stone-700 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-white/5">
                        Abrir
                      </Link>
                      {whatsappHref ? (
                        <a href={whatsappHref} className="rounded-full border border-stone-700 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-white/5">
                          WhatsApp
                        </a>
                      ) : (
                        <span className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-400">
                          Sin WhatsApp
                        </span>
                      )}
                      <Link href="/dashboard/finanzas" className="rounded-full bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/15">
                        Cobrar
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-amber-700/15 bg-[linear-gradient(180deg,rgba(16,14,12,0.96),rgba(22,18,14,0.98))] p-6 shadow-[0_16px_70px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-100/70">Actividad reciente</p>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-zinc-50">Últimas señales del día</h3>
          <div className="mt-5 space-y-3">
            {recentActivity.length === 0 ? (
              <div className="rounded-2xl border border-stone-700/70 bg-black/20 p-5 text-sm text-zinc-300">
                No hay actividad todavía. Las órdenes nuevas aparecerán aquí.
              </div>
            ) : (
              recentActivity.map((item) => (
                <div key={`${item.title}-${item.time}`} className="rounded-2xl border border-stone-700/70 bg-zinc-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{item.time}</p>
                  <p className="mt-1 text-base font-semibold text-zinc-50">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-300">{item.note}</p>
                </div>
              ))
            )}
          </div>
          <div className="mt-6 rounded-2xl border border-stone-700/70 bg-black/20 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-100/70">Acción rápida</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link href="/dashboard/ordenes" className="rounded-full bg-amber-50 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-100">
                Crear orden
              </Link>
              <Link href="/dashboard/stock" className="rounded-full border border-stone-700 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition hover:bg-white/5">
                Revisar stock
              </Link>
              <Link href="/dashboard/reportes" className="rounded-full border border-stone-700 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition hover:bg-white/5">
                Ver reportes
              </Link>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
