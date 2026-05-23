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
  status?: string;
  quoted_total?: number;
  deposit_amount?: number;
  balance_amount?: number;
  solicitud_origen_ip?: string | null;
  created_at?: string;
  updated_at?: string;
  normalized_status?: string;
};

const statusLabel: Record<string, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  convertida: "Convertida",
  rechazada: "Rechazada",
};

export default function SolicitudesPage() {
  const { role } = useAuth();
  const [rows, setRows] = useState<ServiceRequestRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ServiceRequestRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("0");

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
      setDetail(null);
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
        subtitle="Buzón real de solicitudes públicas del tenant."
        icon="fas fa-envelope-open-text"
        actionLabel={loading ? "Cargando..." : "Refrescar"}
        onAction={refresh}
        stats={[
          { label: "Pendientes", value: String(pendingCount), helper: "Solicitudes sin convertir." },
          { label: "Convertidas", value: String(convertedCount), helper: "Ya pasaron a órdenes." },
          { label: "Total", value: String(rows.length), helper: "Cargadas desde `service_requests`." },
        ]}
        columns={[
          { label: "Folio", key: "folio" },
          { label: "Cliente", key: "customer_name" },
          { label: "Equipo", key: "device_model" },
          { label: "Estado", key: "statusLabel" },
        ]}
        rows={mappedRows}
        emptyTitle={loading ? "Cargando solicitudes…" : "Buzón operativo sin datos"}
        emptyCopy="Las solicitudes públicas llegarán desde la landing y se podrán convertir a orden sin salir del panel."
      >
        {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_70px_rgba(15,23,42,0.08)]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#245a82]">Inbox</h3>
            <div className="mt-4 space-y-3">
              {mappedRows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedId(row.id ?? null)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    selectedId === row.id ? "border-[#2c6e9f]/40 bg-[#2c6e9f]/10" : "border-slate-200 bg-slate-50 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#245a82]">{row.folio}</p>
                      <p className="mt-1 font-semibold text-slate-950">{row.customer_name}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                      {row.statusLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{row.device_model ?? "Sin equipo"}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_70px_rgba(15,23,42,0.08)]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#245a82]">Detalle</h3>
            {!selectedId ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                Selecciona una solicitud para ver el detalle y convertirla a orden.
              </div>
            ) : detailLoading ? (
              <div className="mt-4 text-sm text-slate-500">Cargando detalle...</div>
            ) : detail ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Cliente</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">{detail.customer_name}</div>
                  <div className="mt-1 text-sm text-slate-600">{detail.customer_phone ?? "Sin teléfono"}</div>
                  <div className="mt-1 text-sm text-slate-600">{detail.customer_email ?? "Sin correo"}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Equipo</div>
                  <div className="mt-2 text-sm text-slate-700">{detail.device_type ?? "Sin tipo"}</div>
                  <div className="mt-1 text-sm text-slate-700">{detail.device_model ?? "Sin modelo"}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Problema</div>
                  <div className="mt-2 text-sm text-slate-700">{detail.issue_description ?? "Sin descripción"}</div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Costo estimado</span>
                    <input
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                      type="number"
                      min={0}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
                    />
                  </label>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <div>Estado: {detail.normalized_status ?? detail.status ?? "pendiente"}</div>
                    <div className="mt-1">Folio: {detail.folio}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={converting}
                  className="rounded-full bg-[#2c6e9f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#245a82] disabled:opacity-60"
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
