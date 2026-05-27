"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { fixService } from "@/services/fixService";

type ServiceRequestRow = {
  id?: string;
  folio?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string | null;
  device_type?: string | null;
  device_model?: string | null;
  issue_description?: string | null;
  metadata?: Record<string, unknown> | null;
  status?: string;
  quoted_total?: number;
  deposit_amount?: number;
  balance_amount?: number;
  solicitud_origen_ip?: string | null;
  created_at?: string;
  updated_at?: string;
  normalized_status?: string;
};

type TenantLabels = {
  asset: string;
  request: string;
};

const statusLabel: Record<string, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  convertida: "Convertida",
  rechazada: "Rechazada",
};

const defaultTenantLabels: TenantLabels = {
  asset: "Equipo",
  request: "Solicitud",
};

export default function SolicitudesPage() {
  useAuth();
  const [rows, setRows] = useState<ServiceRequestRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ServiceRequestRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("0");
  const [copied, setCopied] = useState("");
  const [tenantLabels, setTenantLabels] = useState<TenantLabels>(defaultTenantLabels);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await fixService.getServiceRequests();
        if (!cancelled) {
          setRows(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar solicitudes");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadSettings() {
      try {
        const settings = await fixService.getTenantSettings();
        const runtimeLabels = settings.data.tenant.labels ?? settings.data.config?.labels ?? {};
        const industry = settings.data.tenant.industry_profile as { asset_label?: string; request_label?: string } | undefined;
        if (!cancelled) {
          setTenantLabels({
            asset: String(runtimeLabels.asset ?? industry?.asset_label ?? defaultTenantLabels.asset),
            request: String(runtimeLabels.request ?? industry?.request_label ?? defaultTenantLabels.request),
          });
        }
      } catch {
        if (!cancelled) setTenantLabels(defaultTenantLabels);
      }
    }
    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail(id: string) {
      try {
        setDetailLoading(true);
        setError("");
        const data = await fixService.getServiceRequestById(id);
        if (!cancelled) {
          setDetail(data);
          setEstimatedCost(String(data.quoted_total ?? 0));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar detalle");
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    }

    if (selectedId) {
      void loadDetail(selectedId);
    } else {
      const timer = window.setTimeout(() => {
        setDetail(null);
      }, 0);

      return () => {
        window.clearTimeout(timer);
        cancelled = true;
      };
    }

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const mappedRows = useMemo(
    () =>
      rows.map((row) => ({
        id: row.id ?? "",
        folio: row.folio ?? "",
        customer_name: row.customer_name ?? "",
        device_model: row.device_model ?? "",
        statusLabel: statusLabel[row.normalized_status ?? row.status ?? "pendiente"] ?? row.status ?? "Pendiente",
      })),
    [rows]
  );

  const pendingCount = rows.filter((row) => (row.normalized_status ?? row.status) !== "convertida").length;
  const convertedCount = rows.filter((row) => (row.normalized_status ?? row.status) === "convertida").length;

  async function refresh() {
    const data = await fixService.getServiceRequests();
    setRows(data);
  }

  async function copyText(text: string, label: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1600);
    } catch {
      setError("No se pudo copiar al portapapeles");
    }
  }

  async function handleConvert() {
    if (!selectedId) return;
    setConverting(true);
    setError("");
    setSuccess("");

    try {
      const result = await fixService.convertServiceRequestToOrder(selectedId, {
        estimatedCost: Number(estimatedCost || 0),
        deviceType: detail?.device_type ?? undefined,
        deviceModel: detail?.device_model ?? undefined,
        issue: detail?.issue_description ?? undefined,
        createCustomer: true,
      });

      setSuccess(`Solicitud convertida a orden ${String(result.data.order?.folio ?? "")}.`);
      await refresh();
      setSelectedId(null);
      setDetail(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al convertir solicitud");
    } finally {
      setConverting(false);
    }
  }

  return (
    <RequireRole allowed={["owner", "manager", "technician"]}>
      <ModuleShell
        title="Solicitudes"
        subtitle="Buzón público de cotizaciones y entrada a órdenes."
        icon="fas fa-envelope-open-text"
        actionLabel={loading ? "Cargando..." : "Refrescar"}
        onAction={refresh}
        secondaryActionLabel="Limpiar selección"
        secondaryOnAction={() => {
          setSelectedId(null);
          setDetail(null);
        }}
        stats={[
          { label: "Pendientes", value: String(pendingCount), helper: "Solicitudes sin convertir." },
          { label: "Convertidas", value: String(convertedCount), helper: "Ya pasaron a órdenes reales." },
          { label: "Total", value: String(rows.length), helper: "Registro real del tenant." },
        ]}
        columns={[
          { label: "Folio", key: "folio" },
          { label: "Cliente", key: "customer_name" },
          { label: tenantLabels.asset, key: "device_model" },
          { label: "Estado", key: "statusLabel" },
        ]}
        rows={mappedRows}
        emptyTitle={loading ? "Cargando solicitudes…" : "Buzón sin datos"}
        emptyCopy="Las solicitudes públicas llegan desde la landing y se convierten sin salir del integrador."
      >
        {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}
        {copied ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{copied} copiado.</p> : null}

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[28px] border border-amber-700/15 bg-[linear-gradient(180deg,rgba(16,14,12,0.96),rgba(22,18,14,0.98))] p-5 shadow-[0_16px_70px_rgba(15,23,42,0.08)]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100/70">Inbox</h3>
            <div className="mt-4 space-y-3">
              {mappedRows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedId(row.id ?? null)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    selectedId === row.id ? "border-amber-700/30 bg-amber-500/10" : "border-stone-700/70 bg-zinc-950/60 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-amber-100/70">{row.folio}</p>
                      <p className="mt-1 font-semibold text-zinc-50">{row.customer_name}</p>
                    </div>
                    <span className="rounded-full border border-stone-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
                      {row.statusLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-300">{row.device_model ?? `Sin ${tenantLabels.asset.toLowerCase()}`}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-amber-700/15 bg-[linear-gradient(180deg,rgba(16,14,12,0.96),rgba(22,18,14,0.98))] p-5 shadow-[0_16px_70px_rgba(15,23,42,0.08)]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100/70">Detalle</h3>
            {!selectedId ? (
              <div className="mt-4 rounded-2xl border border-dashed border-stone-700/70 bg-black/20 p-6 text-sm text-zinc-300">
                Selecciona una solicitud para ver el detalle y convertirla a orden.
              </div>
            ) : detailLoading ? (
              <div className="mt-4 text-sm text-zinc-400">Cargando detalle...</div>
            ) : detail ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-stone-700/70 bg-zinc-950/60 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Cliente</div>
                  <div className="mt-2 text-lg font-semibold text-zinc-50">{detail.customer_name}</div>
                  <div className="mt-1 text-sm text-zinc-300">{detail.customer_phone ?? "Sin teléfono"}</div>
                  <div className="mt-1 text-sm text-zinc-300">{detail.customer_email ?? "Sin correo"}</div>
                </div>
                <div className="rounded-2xl border border-stone-700/70 bg-zinc-950/60 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">{tenantLabels.asset}</div>
                  <div className="mt-2 text-sm text-zinc-300">{detail.device_type ?? "Sin tipo"}</div>
                  <div className="mt-1 text-sm text-zinc-300">{detail.device_model ?? "Sin modelo"}</div>
                </div>
                <div className="rounded-2xl border border-stone-700/70 bg-zinc-950/60 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Problema</div>
                  <div className="mt-2 text-sm text-zinc-300">{detail.issue_description ?? "Sin descripción"}</div>
                </div>
                {detail.metadata && Object.keys(detail.metadata).length > 0 ? (
                  <div className="rounded-2xl border border-stone-700/70 bg-zinc-950/60 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Campos dinámicos</div>
                    <pre className="mt-2 overflow-x-auto text-xs leading-6 text-zinc-300">{JSON.stringify(detail.metadata, null, 2)}</pre>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void copyText(detail.folio ?? "", `Folio ${detail.folio ?? ""}`)}
                    className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200"
                  >
                    Copiar folio
                  </button>
                  <a
                    href={detail.customer_phone ? `https://wa.me/${detail.customer_phone.replace(/\D/g, "")}` : "#"}
                    target="_blank"
                    rel="noreferrer"
                    aria-disabled={!detail.customer_phone}
                    className="rounded-full border border-green-400/30 px-4 py-2 text-sm font-semibold text-green-200"
                  >
                    WhatsApp
                  </a>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Costo estimado</span>
                    <input
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                      type="number"
                      min={0}
                    className="w-full rounded-xl border border-stone-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none"
                    />
                  </label>
                  <div className="rounded-2xl border border-stone-700/70 bg-zinc-950/60 p-4 text-sm text-zinc-300">
                    <div>Estado: {detail.normalized_status ?? detail.status ?? "pendiente"}</div>
                    <div className="mt-1">Folio: {detail.folio}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={converting}
                  className="rounded-full bg-amber-50 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-100 disabled:opacity-60"
                >
                  {converting ? "Convirtiendo..." : "Convertir a orden"}
                </button>
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-500">No se pudo cargar la solicitud.</div>
            )}
          </section>
        </div>
      </ModuleShell>
    </RequireRole>
  );
}
