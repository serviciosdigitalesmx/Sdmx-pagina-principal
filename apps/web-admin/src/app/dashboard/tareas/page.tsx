"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { OrderTimeline } from "@/components/dashboard/orders/order-timeline";
import { fixService } from "@/services/fixService";

type OrderRow = {
  id?: string;
  folio?: string;
  status?: string;
  device_model?: string;
  device_type?: string;
  problem_description?: string;
  receipt_url?: string | null;
  created_at?: string;
  updated_at?: string;
  estimated_cost?: number;
  final_cost?: number;
  device_info?: {
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    brand?: string;
    model?: string;
    type?: string;
  };
};

type OrderDetailData = {
  order?: {
    id?: string;
    folio?: string;
    status?: string;
    receipt_url?: string | null;
    device_type?: string;
    device_model?: string;
    problem_description?: string;
    received_at?: string | null;
    created_at?: string;
    updated_at?: string;
    device_info?: Record<string, unknown>;
    estimated_cost?: number;
    final_cost?: number;
  };
  documents?: Array<{
    id?: string;
    file_name?: string;
    file_type?: string;
    public_url?: string | null;
    mime_type?: string | null;
    created_at?: string;
  }>;
  events?: Array<{
    id?: string;
    event_type?: string;
    previous_status?: string | null;
    new_status?: string | null;
    note?: string | null;
    actor_name?: string | null;
    created_at?: string;
  }>;
};

type OrderStatus = "recibido" | "diagnostico" | "reparacion" | "listo" | "entregado";

const statusConfig: Record<OrderStatus, { label: string; tone: string; dot: string; helper: string }> = {
  recibido: {
    label: "Recibido",
    tone: "border-slate-200 bg-slate-50 text-slate-700",
    dot: "bg-slate-400",
    helper: "Entrada sin diagnóstico",
  },
  diagnostico: {
    label: "Diagnóstico",
    tone: "border-amber-200 bg-amber-50 text-amber-900",
    dot: "bg-amber-500",
    helper: "En manos del técnico",
  },
  reparacion: {
    label: "Reparación",
    tone: "border-orange-200 bg-orange-50 text-orange-900",
    dot: "bg-orange-500",
    helper: "Avance técnico en curso",
  },
  listo: {
    label: "Lista",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
    dot: "bg-emerald-500",
    helper: "Lista para entrega",
  },
  entregado: {
    label: "Entregada",
    tone: "border-slate-200 bg-slate-100 text-slate-700",
    dot: "bg-slate-700",
    helper: "Cerrada y firmada",
  },
};

const statusOrder: OrderStatus[] = ["recibido", "diagnostico", "reparacion", "listo", "entregado"];

function normalizeStatus(status?: string | null): OrderStatus {
  const value = String(status ?? "").toLowerCase();
  if (value.includes("diag")) return "diagnostico";
  if (value.includes("repar")) return "reparacion";
  if (value.includes("list")) return "listo";
  if (value.includes("entreg")) return "entregado";
  return "recibido";
}

function statusScore(status: OrderStatus, hasEvidence: boolean) {
  const scoreMap: Record<OrderStatus, number> = {
    recibido: 20,
    diagnostico: 45,
    reparacion: 70,
    listo: 90,
    entregado: 100,
  };
  return Math.min(100, scoreMap[status] + (hasEvidence ? 10 : 0));
}

function statusLabel(status?: string | null) {
  return statusConfig[normalizeStatus(status)].label;
}

function buildPortalUrl(baseUrl: string, tenantSlug: string, folio?: string | null) {
  const base = baseUrl.replace(/\/$/, "");
  if (!base || !tenantSlug) return "";
  const folioQuery = folio ? `?folio=${encodeURIComponent(folio)}` : "";
  return `${base}/t/${encodeURIComponent(tenantSlug)}/portal${folioQuery}`;
}

function whatsappLink(phone?: string | null, tenantSlug?: string | null, portalBaseUrl?: string | null, folio?: string | null) {
  if (!phone) return null;
  const normalized = phone.replace(/\D/g, "");
  if (!normalized) return null;
  const portalUrl = portalBaseUrl && tenantSlug ? buildPortalUrl(portalBaseUrl, tenantSlug, folio) : "";
  const message = encodeURIComponent(`Bienvenido a Marca Blanca. Aquí puedes consultar el estatus de tu equipo: ${portalUrl}`);
  return `https://wa.me/${normalized}?text=${message}`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.split(",").pop() ?? "" : result);
    };
    reader.readAsDataURL(file);
  });
}

export default function TareasPage() {
  const { role, tenantSlug } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrderDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const customerPortalBase =
    process.env.NEXT_PUBLIC_CUSTOMER_TRACKING_URL ||
    process.env.NEXT_PUBLIC_SAAS_DEMO_URL ||
    "https://clientes.serviciosdigitalesmx.online";

  useEffect(() => {
    setMounted(true);
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");
      const data = await fixService.getOrders();
      setOrders(data as OrderRow[]);
      if (!selectedOrderId && data.length > 0) {
        const firstOrder = data[0] as OrderRow | undefined;
        setSelectedOrderId(typeof firstOrder?.id === "string" ? firstOrder.id : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar tareas");
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(orderId: string) {
    try {
      setDetailLoading(true);
      const data = (await fixService.getOrderById(orderId)) as OrderDetailData;
      setDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar detalle");
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  useEffect(() => {
    if (!selectedOrderId) {
      setDetail(null);
      return;
    }
    void loadDetail(selectedOrderId);
  }, [selectedOrderId]);

  const rowsByStatus = useMemo(() => {
    return statusOrder.reduce<Record<OrderStatus, OrderRow[]>>((acc, status) => {
      acc[status] = orders.filter((order) => normalizeStatus(order.status) === status);
      return acc;
    }, {
      recibido: [],
      diagnostico: [],
      reparacion: [],
      listo: [],
      entregado: [],
    });
  }, [orders]);

  const totalEvidence = useMemo(() => {
    return orders.filter((order) => Boolean(order.receipt_url)).length;
  }, [orders]);

  const activeOrder = useMemo(() => orders.find((order) => order.id === selectedOrderId) ?? null, [orders, selectedOrderId]);
  const activeStatus = normalizeStatus(detail?.order?.status ?? activeOrder?.status ?? null);
  const activePhone = (detail?.order?.device_info as { customer_phone?: string } | undefined)?.customer_phone ?? activeOrder?.device_info?.customer_phone ?? null;
  const activeEmail = (detail?.order?.device_info as { customer_email?: string } | undefined)?.customer_email ?? activeOrder?.device_info?.customer_email ?? null;
  const activeCustomerName = (detail?.order?.device_info as { customer_name?: string } | undefined)?.customer_name ?? activeOrder?.device_info?.customer_name ?? null;
  const activePortalUrl = tenantSlug ? buildPortalUrl(customerPortalBase, tenantSlug, detail?.order?.folio ?? activeOrder?.folio ?? null) : "";
  const activeWhatsapp = whatsappLink(activePhone, tenantSlug, customerPortalBase, detail?.order?.folio ?? activeOrder?.folio ?? null);
  const hasEvidence = Boolean(detail?.order?.receipt_url ?? activeOrder?.receipt_url);
  const semaforo = statusScore(activeStatus, hasEvidence);
  const pdfUrl = detail?.order?.receipt_url ?? activeOrder?.receipt_url ?? null;

  const stats = [
    { label: "Recibidas", value: String(rowsByStatus.recibido.length), helper: statusConfig.recibido.helper },
    { label: "En proceso", value: String(rowsByStatus.diagnostico.length + rowsByStatus.reparacion.length), helper: "Diagnóstico y reparación activas." },
    { label: "Casi listas", value: String(rowsByStatus.listo.length), helper: statusConfig.listo.helper },
    { label: "Con evidencia", value: String(totalEvidence), helper: "Órdenes con PDF o fotos persistidas." },
    { label: "Cerradas", value: String(rowsByStatus.entregado.length), helper: statusConfig.entregado.helper },
  ];

  async function refreshAll() {
    setRefreshing(true);
    try {
      await loadOrders();
      if (selectedOrderId) {
        await loadDetail(selectedOrderId);
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function handleStatusChange(status: OrderStatus) {
    if (!selectedOrderId) return;
    try {
      setSaving(true);
      await fixService.updateOrderStatus(selectedOrderId, status);
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el estado");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote() {
    if (!selectedOrderId) return;
    const note = window.prompt("Nota técnica");
    if (!note || !note.trim()) return;
    try {
      setSaving(true);
      await fixService.addOrderNote(selectedOrderId, note.trim());
      await loadDetail(selectedOrderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la nota");
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadEvidence(fileList: FileList | null) {
    if (!selectedOrderId || !fileList?.length) return;
    try {
      setUploading(true);
      const files = Array.from(fileList).slice(0, 3);
      for (const file of files) {
        const prepared = file.type.startsWith("image/")
          ? file
          : new File([await file.arrayBuffer()], file.name, { type: file.type || "application/octet-stream" });
        await fixService.uploadOrderAttachment(selectedOrderId, prepared, prepared.type.startsWith("image/") ? "intake_photo" : "attachment_pdf");
      }
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la evidencia");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  if (!mounted) {
    return (
      <RequireRole allowed={["owner", "manager", "technician"]}>
        <div className="space-y-6 text-slate-950">
          <header className="flex flex-col justify-between gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_70px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 [font-family:var(--font-display)]">Panel técnico</h1>
              <p className="mt-1 text-sm text-slate-600">Semáforo operativo, evidencia y seguimiento técnico.</p>
            </div>
            <div className="h-11 w-36 rounded-full bg-slate-100" aria-busy="true" />
          </header>
          <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-[0_12px_50px_rgba(15,23,42,0.06)]">Cargando panel...</div>
        </div>
      </RequireRole>
    );
  }

  return (
    <RequireRole allowed={["owner", "manager", "technician"]}>
      <div className="space-y-6 text-slate-950">
        <header className="flex flex-col justify-between gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_70px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#245a82]">Panel técnico</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 [font-family:var(--font-display)]">Semáforo y evidencia por orden</h1>
            <p className="mt-1 text-sm text-slate-600">Operación real con estados, fotos, notas y PDF persistido por tenant.</p>
          </div>
          <button
            type="button"
            onClick={() => void refreshAll()}
            className="rounded-full bg-[#2c6e9f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245a82]"
          >
            {refreshing ? "Actualizando..." : "Refrescar"}
          </button>
        </header>

        {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_50px_rgba(15,23,42,0.06)]">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{stat.label}</div>
              <div className="mt-3 text-2xl font-semibold text-slate-950">{stat.value}</div>
              <div className="mt-2 text-sm text-slate-600">{stat.helper}</div>
            </div>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
          <section className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_70px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Lista técnica</h2>
                <p className="mt-1 text-sm text-slate-600">Selecciona una orden para ver estado, evidencia y timeline.</p>
              </div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">{role === "technician" ? "Solo lectura parcial" : "Operación completa"}</div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {statusOrder.map((status) => (
                <div key={status} className={`rounded-3xl border p-4 ${statusConfig[status].tone}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${statusConfig[status].dot}`} />
                      <h3 className="font-semibold">{statusConfig[status].label}</h3>
                    </div>
                    <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold">{rowsByStatus[status].length}</span>
                  </div>
                  <p className="mt-2 text-sm opacity-80">{statusConfig[status].helper}</p>
                  <div className="mt-4 space-y-3">
                    {rowsByStatus[status].length > 0 ? (
                      rowsByStatus[status].map((order) => {
                        const orderId = order.id ?? "";
                        const selected = orderId && orderId === selectedOrderId;
                        const evidenceActive = Boolean(order.receipt_url);
                        const orderScore = statusScore(normalizeStatus(order.status), evidenceActive);
                        return (
                          <article
                            key={orderId}
                            className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 ${selected ? "border-[#2c6e9f] ring-2 ring-[#2c6e9f]/15" : "border-slate-200"}`}
                          >
                            <button type="button" onClick={() => setSelectedOrderId(orderId)} className="w-full text-left">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#245a82]">{order.folio ?? "ORD-..."}</p>
                                  <p className="mt-1 text-sm font-semibold text-slate-950">{order.device_info?.customer_name ?? "Cliente sin nombre"}</p>
                                </div>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{orderScore}%</span>
                              </div>
                              <p className="mt-2 text-sm text-slate-600">{order.device_model ?? order.device_info?.model ?? "Equipo sin especificar"}</p>
                              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-700">{order.problem_description ?? "Sin descripción"}</p>
                            </button>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedOrderId(orderId)}
                                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                              >
                                Abrir
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOrderId(orderId);
                                  void handleAddNote();
                                }}
                                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                              >
                                <span className="mr-1">✎</span>Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOrderId(orderId);
                                  fileInputRef.current?.click();
                                }}
                                className="rounded-full bg-[#1b9e5e] px-3 py-1.5 text-xs font-semibold text-white"
                              >
                                Evidencia
                              </button>
                            </div>
                          </article>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-current/20 bg-white/70 px-4 py-6 text-sm text-slate-600">
                        Sin órdenes en esta columna.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_70px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#245a82]">Detalle técnico</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">{detail?.order?.folio ?? activeOrder?.folio ?? "Selecciona una orden"}</h2>
              </div>
              {pdfUrl ? (
                <a href={pdfUrl} target="_blank" rel="noreferrer" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                  PDF
                </a>
              ) : (
                <span className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500">Sin PDF</span>
              )}
            </div>

            {detailLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Cargando detalle...</div>
            ) : detail?.order || activeOrder ? (
              <>
                <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Semáforo</div>
                      <div className="mt-2 flex items-center gap-3">
                        <span className={`h-4 w-4 rounded-full ${statusConfig[activeStatus].dot}`} />
                        <div className="text-sm font-semibold text-slate-950">{statusLabel(detail?.order?.status ?? activeOrder?.status)}</div>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white px-3 py-2 text-right">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Progreso</div>
                      <div className="text-lg font-semibold text-slate-950">{semaforo}%</div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-400">
                        <span>Recepción</span>
                        <span>{activeStatus === "recibido" ? "Actual" : "OK"}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-slate-700" style={{ width: `${Math.min(100, semaforo)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-400">
                        <span>Diagnóstico</span>
                        <span>{["diagnostico", "reparacion", "listo", "entregado"].includes(activeStatus) ? "OK" : "Pendiente"}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: `${activeStatus === "recibido" ? 18 : 100}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-400">
                        <span>Reparación</span>
                        <span>{["reparacion", "listo", "entregado"].includes(activeStatus) ? "OK" : "Pendiente"}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-orange-500" style={{ width: `${["reparacion", "listo", "entregado"].includes(activeStatus) ? 100 : activeStatus === "diagnostico" ? 40 : 12}%` }} />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Cliente</div>
                    <div className="mt-2 text-sm font-semibold text-slate-950">{activeCustomerName ?? "Sin cliente"}</div>
                    <div className="mt-1 text-sm text-slate-600">{activePhone ?? "Sin teléfono"}</div>
                    <div className="mt-1 text-sm text-slate-600">{activeEmail ?? "Sin correo"}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Equipo</div>
                    <div className="mt-2 text-sm text-slate-700">{detail?.order?.device_model ?? activeOrder?.device_model ?? "Sin modelo"}</div>
                    <div className="mt-1 text-sm text-slate-700">{detail?.order?.problem_description ?? activeOrder?.problem_description ?? "Sin problema"}</div>
                    <div className="mt-1 text-sm text-slate-600">Portal: {activePortalUrl || "No disponible"}</div>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {statusOrder.map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={saving}
                        onClick={() => void handleStatusChange(status)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          activeStatus === status ? "border-[#2c6e9f] bg-[#2c6e9f] text-white" : "border-slate-300 text-slate-700"
                        }`}
                      >
                        {statusConfig[status].label}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleAddNote()}
                      className="rounded-full bg-[#2c6e9f] px-4 py-2 text-sm font-semibold text-white"
                    >
                      ✎ Nota
                    </button>
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-full bg-[#1b9e5e] px-4 py-2 text-sm font-semibold text-white"
                    >
                      {uploading ? "Subiendo..." : "Subir evidencia"}
                    </button>
                    {activeWhatsapp ? (
                      <a href={activeWhatsapp} target="_blank" rel="noreferrer" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                        WhatsApp
                      </a>
                    ) : null}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      void handleUploadEvidence(event.target.files);
                    }}
                  />
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#245a82]">Archivos y evidencia</h3>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{(detail?.documents ?? []).length} archivos</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {(detail?.documents ?? []).length > 0 ? (
                      detail?.documents?.map((document) => (
                        <a
                          key={document.id ?? document.file_name}
                          href={document.public_url ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition hover:border-[#2c6e9f]/30 hover:bg-slate-50"
                        >
                          <span>{document.file_name ?? "Documento"}</span>
                          <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{document.file_type ?? ""}</span>
                        </a>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">Todavía no hay archivos cargados.</p>
                    )}
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#245a82]">Timeline técnico</h3>
                  <div className="mt-4">
                    <OrderTimeline events={detail?.events ?? []} />
                  </div>
                </section>

                {detail?.order?.received_at || detail?.order?.created_at || detail?.order?.updated_at ? (
                  <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <div className="grid gap-2">
                      <div>Creada: {detail?.order?.created_at ? new Date(detail.order.created_at).toLocaleString("es-MX") : "-"}</div>
                      <div>Actualizada: {detail?.order?.updated_at ? new Date(detail.order.updated_at).toLocaleString("es-MX") : "-"}</div>
                      <div>Recepción: {detail?.order?.received_at ? new Date(detail.order.received_at).toLocaleString("es-MX") : "-"}</div>
                    </div>
                  </section>
                ) : null}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                Selecciona una orden para operar el flujo técnico.
              </div>
            )}
          </aside>
        </div>
      </div>
    </RequireRole>
  );
}
