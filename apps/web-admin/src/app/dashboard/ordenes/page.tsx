"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { OrderDetailDrawer, type OrderDetailData } from "@/components/dashboard/orders/order-detail-drawer";
import { OrderIntakeModal, type OrderIntakeFiles, type OrderIntakeFormState } from "@/components/dashboard/orders/order-intake-modal";
import { fixService } from "@/services/fixService";
import { Table } from "@white-label/ui";

type OrderRow = {
  id?: string;
  folio?: string;
  status?: string;
  device_model?: string;
  device_type?: string;
  problem_description?: string;
  created_at?: string;
  device_info?: {
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    brand?: string;
    model?: string;
    type?: string;
  };
};

type OrderColumn = "recibido" | "diagnostico" | "reparacion" | "listo" | "entregado";

const columnLabels: Record<OrderColumn, string> = {
  recibido: "Recibido",
  diagnostico: "Diagnóstico",
  reparacion: "En reparación",
  listo: "Listo",
  entregado: "Entregado",
};

const initialForm: OrderIntakeFormState = {
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  deviceType: "Smartphone",
  deviceModel: "",
  issue: "",
};

const initialFiles: OrderIntakeFiles = {
  intakePhoto: null,
  documents: [],
};

function normalizeStatus(status?: string) {
  const value = (status ?? "").toLowerCase();
  if (value.includes("diag")) return "diagnostico";
  if (value.includes("repar")) return "reparacion";
  if (value.includes("list")) return "listo";
  if (value.includes("entreg")) return "entregado";
  return "recibido";
}

function whatsappLink(phone?: string | null, folio?: string | null) {
  if (!phone) return null;
  const normalized = phone.replace(/\D/g, "");
  if (!normalized) return null;
  const message = encodeURIComponent(`Hola, te contacto desde Sr. Fix sobre tu orden ${folio ?? ""}.`);
  return `https://wa.me/${normalized}?text=${message}`;
}

function getDetailPhone(order?: OrderRow | null) {
  return order?.device_info?.customer_phone ?? null;
}

export default function OrdenesKanbanPage() {
  const { role } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<OrderDetailData | null>(null);
  const [form, setForm] = useState<OrderIntakeFormState>(initialForm);
  const [files, setFiles] = useState<OrderIntakeFiles>(initialFiles);

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

  useEffect(() => {
    let cancelled = false;

    async function loadDetail(orderId: string) {
      try {
        setDetailLoading(true);
        const data = (await fixService.getOrderById(orderId)) as OrderDetailData;
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar detalle");
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }

    if (selectedOrderId) {
      void loadDetail(selectedOrderId);
    } else {
      setDetail(null);
    }

    return () => {
      cancelled = true;
    };
  }, [selectedOrderId]);

  const columns = useMemo(
    () =>
      (["recibido", "diagnostico", "reparacion", "listo", "entregado"] as OrderColumn[]).map((id) => ({
        id,
        title: columnLabels[id],
      })),
    []
  );

  const mappedRows = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        clientName: order.device_info?.customer_name ?? "",
        device_model: order.device_model ?? order.device_info?.model ?? order.device_info?.brand ?? "",
      })),
    [orders]
  );

  const detailOrder = detail?.order ?? null;
  const detailPhone = getDetailPhone(detailOrder as OrderRow | null);
  const detailWaLink = whatsappLink(detailPhone, detailOrder?.folio);

  async function refreshOrders() {
    const data = await fixService.getOrders();
    setOrders(data as OrderRow[]);
  }

  async function openOrder(orderId: string) {
    setSelectedOrderId(orderId);
  }

  async function handleSubmit() {
    try {
      setSaving(true);
      setError("");

      const created = (await fixService.createOrder({
        clientName: form.clientName.trim(),
        clientPhone: form.clientPhone.trim(),
        clientEmail: form.clientEmail.trim(),
        deviceType: form.deviceType.trim(),
        deviceModel: form.deviceModel.trim(),
        issue: form.issue.trim(),
      })) as OrderRow;

      if (!created.id) {
        throw new Error("La API no devolvió el id de la orden creada");
      }

      if (files.intakePhoto) {
        await fixService.uploadOrderAttachment(created.id, files.intakePhoto, "intake_photo");
      }

      for (const document of files.documents) {
        await fixService.uploadOrderAttachment(created.id, document, "attachment_pdf");
      }

      await refreshOrders();
      setIsModalOpen(false);
      setForm(initialForm);
      setFiles(initialFiles);
      if (created.id) {
        setSelectedOrderId(created.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear orden");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(status: string) {
    if (!detailOrder?.id) return;
    try {
      await fixService.updateOrderStatus(detailOrder.id, status);
      await refreshOrders();
      const updated = (await fixService.getOrderById(detailOrder.id)) as OrderDetailData;
      setDetail(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar estado");
    }
  }

  async function handleAddNote() {
    if (!detailOrder?.id) return;
    const note = window.prompt("Nota para la orden");
    if (!note || !note.trim()) return;
    try {
      await fixService.addOrderNote(detailOrder.id, note.trim());
      const updated = (await fixService.getOrderById(detailOrder.id)) as OrderDetailData;
      setDetail(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al agregar nota");
    }
  }

  if (!mounted) {
    return (
      <RequireRole allowed={["owner", "manager", "technician"]}>
        <div className="space-y-6 text-slate-950">
          <header className="flex flex-col justify-between gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_70px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 [font-family:var(--font-display)]">Tablero de Órdenes</h1>
              <p className="mt-1 text-sm text-slate-600">Gestiona el flujo de trabajo del taller con datos reales del API.</p>
            </div>
            <div className="h-11 w-36 rounded-full bg-slate-100" aria-busy="true" />
          </header>
          <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-[0_12px_50px_rgba(15,23,42,0.06)]">Cargando órdenes...</div>
        </div>
      </RequireRole>
    );
  }

  return (
    <RequireRole allowed={["owner", "manager", "technician"]}>
      <div className="space-y-6 text-slate-950">
        <header className="flex flex-col justify-between gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_70px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 [font-family:var(--font-display)]">Tablero de Órdenes</h1>
            <p className="mt-1 text-sm text-slate-600">Recepción, adjuntos, timeline y detalle operativo con persistencia real.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="rounded-full bg-[#2c6e9f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245a82]">
            Nueva Orden
          </button>
        </header>

        {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {columns.map((column) => {
            const columnOrders = mappedRows.filter((order) => normalizeStatus(order.status) === column.id);
            return (
              <div key={column.id} className="min-w-[260px] rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_50px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#245a82]">{column.title}</h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{columnOrders.length}</span>
                </div>
                <div className="space-y-3 p-3">
                  {columnOrders.map((order) => (
                    <article key={order.id} className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#2c6e9f]/30" onClick={() => order.id && void openOrder(order.id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#245a82]">{order.folio ?? "ORD-..."}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">{order.device_info?.customer_name ?? "Cliente sin nombre"}</p>
                        </div>
                        <span className="rounded-full bg-[#1b9e5e]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1b9e5e]">Activo</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{order.device_model ?? order.device_info?.model ?? "Equipo sin detallar"}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-700">{order.problem_description ?? "Sin descripción"}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {whatsappLink(getDetailPhone(order), order.folio) ? (
                          <a
                            href={whatsappLink(getDetailPhone(order), order.folio) ?? "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full bg-[#1b9e5e] px-3 py-1 text-xs font-semibold text-white"
                            onClick={(e) => e.stopPropagation()}
                          >
                            WhatsApp
                          </a>
                        ) : null}
                      </div>
                    </article>
                  ))}
                  {loading ? <p className="px-2 py-8 text-center text-sm text-slate-500">Cargando órdenes…</p> : null}
                  {!loading && columnOrders.length === 0 ? <p className="px-2 py-8 text-center text-sm text-slate-500">Sin órdenes en esta columna</p> : null}
                </div>
              </div>
            );
          })}
        </div>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_70px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#245a82]">Tabla real</p>
          <Table<OrderRow>
            columns={[
              { label: "Folio", key: "folio" },
              { label: "Cliente", key: "clientName" },
              { label: "Equipo", key: "device_model" },
              { label: "Estado", key: "status" },
            ]}
            rows={mappedRows.map((row) => ({
              ...row,
              clientName: row.device_info?.customer_name ?? "",
            }))}
            emptyMessage={loading ? "Cargando órdenes…" : "No hay órdenes para mostrar"}
          />
        </section>

        <OrderIntakeModal
          open={isModalOpen}
          saving={saving}
          error={error}
          form={form}
          files={files}
          onClose={() => setIsModalOpen(false)}
          onChange={(name, value) => setForm((current) => ({ ...current, [name]: value }))}
          onPhotoChange={(file) => setFiles((current) => ({ ...current, intakePhoto: file }))}
          onDocumentsChange={(documents) => setFiles((current) => ({ ...current, documents }))}
          onSubmit={() => void handleSubmit()}
        />

        <OrderDetailDrawer
          open={Boolean(selectedOrderId)}
          loading={detailLoading}
          data={detail}
          onClose={() => setSelectedOrderId(null)}
          onStatusChange={(status) => handleStatusChange(status)}
          onAddNote={() => handleAddNote()}
        />
      </div>
    </RequireRole>
  );
}
