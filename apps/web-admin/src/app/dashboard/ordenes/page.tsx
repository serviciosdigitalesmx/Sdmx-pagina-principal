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

type OrderStatusOption = { key: string; label: string };

const defaultStatusOptions: OrderStatusOption[] = [
  { key: "recibido", label: "Recibido" },
  { key: "diagnostico", label: "Diagnóstico" },
  { key: "reparacion", label: "En reparación" },
  { key: "listo", label: "Listo" },
  { key: "entregado", label: "Entregado" },
];

const initialForm: OrderIntakeFormState = {
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  deviceType: "Smartphone",
  deviceModel: "",
  issue: "",
  includeIva: false,
};

const initialFiles: OrderIntakeFiles = {
  intakePhotos: [],
  documents: [],
};

function normalizeStatus(status?: string, allowedStatuses: string[] = defaultStatusOptions.map((item) => item.key)) {
  const value = (status ?? "").toLowerCase();
  if (allowedStatuses.includes(value)) return value;
  if (value.includes("diag")) return "diagnostico";
  if (value.includes("repar")) return "reparacion";
  if (value.includes("list")) return "listo";
  if (value.includes("entreg")) return "entregado";
  return "recibido";
}

function buildPortalUrl(baseUrl: string, tenantSlug: string, folio?: string | null) {
  const base = baseUrl.replace(/\/$/, "");
  if (!base || !tenantSlug) return "";
  const folioQuery = folio ? `?folio=${encodeURIComponent(folio)}` : "";
  return `${base}/t/${encodeURIComponent(tenantSlug)}/portal${folioQuery}`;
}

function isUuid(value: string | null | undefined) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function whatsappLink(phone?: string | null, tenantSlug?: string | null, portalBaseUrl?: string | null, folio?: string | null) {
  if (!phone) return null;
  const normalized = phone.replace(/\D/g, "");
  if (!normalized) return null;
  const portalUrl = portalBaseUrl && tenantSlug ? buildPortalUrl(portalBaseUrl, tenantSlug, folio) : "";
  const message = encodeURIComponent(
    `Bienvenido a Marca Blanca. Aquí puedes consultar el estatus de tu equipo: ${portalUrl}`
  );
  return `https://wa.me/${normalized}?text=${message}`;
}

function getDetailPhone(order?: OrderRow | null) {
  return order?.device_info?.customer_phone ?? null;
}

function compressImageFile(file: File, maxWidth = 1600, quality = 0.72): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la foto"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("No se pudo procesar la foto"));
      image.onload = () => {
        const scale = Math.min(1, maxWidth / image.width);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No se pudo crear el lienzo para comprimir"));
          return;
        }
        ctx.drawImage(image, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("No se pudo comprimir la foto"));
            return;
          }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressed);
        }, "image/jpeg", quality);
      };
      image.src = String(reader.result ?? "");
    };
    reader.readAsDataURL(file);
  });
}

async function compressImageFiles(files: File[]) {
  const limited = files.slice(0, 3);
  const compressed: File[] = [];
  for (const file of limited) {
    compressed.push(await compressImageFile(file));
  }
  return compressed;
}

export default function OrdenesKanbanPage() {
  const { role, tenantSlug, sucursalId } = useAuth();
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
  const [creationSummary, setCreationSummary] = useState<{ folio: string; orderId: string; phone: string; portalUrl: string | null } | null>(null);
  const [statusOptions, setStatusOptions] = useState<OrderStatusOption[]>(defaultStatusOptions);

  const customerPortalBase =
    process.env.NEXT_PUBLIC_CUSTOMER_TRACKING_URL ||
    process.env.NEXT_PUBLIC_SAAS_DEMO_URL ||
    "https://clientes.serviciosdigitalesmx.online";
  const customerPortalUrl = useMemo(() => {
    const base = customerPortalBase.replace(/\/$/, "");
    if (!base || !tenantSlug) return null;
    return `${base}/t/${encodeURIComponent(tenantSlug)}/portal`;
  }, [customerPortalBase, tenantSlug]);

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

    async function loadSettings() {
      try {
        const settings = await fixService.getTenantSettings();
        const operational = (settings.data.tenant.operational_settings as { orderStatuses?: Array<{ key?: string; label?: string }> } | undefined) ?? undefined;
        const options = operational?.orderStatuses?.filter((item) => typeof item?.key === "string" && item.key.trim().length > 0).map((item) => ({
          key: String(item.key),
          label: String(item.label ?? item.key),
        }));
        if (!cancelled && options && options.length > 0) {
          setStatusOptions(options);
        }
      } catch {
        if (!cancelled) setStatusOptions(defaultStatusOptions);
      }
    }

    void loadSettings();
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
      statusOptions.map((item) => ({
        id: item.key,
        title: item.label,
      })),
    [statusOptions]
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
  const detailWaLink = whatsappLink(detailPhone, tenantSlug, customerPortalBase, detailOrder?.folio);

  const creationShareLink = creationSummary?.phone
    ? whatsappLink(creationSummary.phone, tenantSlug, customerPortalBase, creationSummary.folio)
    : null;

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
      const branchId = isUuid(sucursalId) ? sucursalId : undefined;

      const created = (await fixService.createOrder({
        clientName: form.clientName.trim(),
        clientPhone: form.clientPhone.trim(),
        clientEmail: form.clientEmail.trim(),
        deviceType: form.deviceType.trim(),
        deviceModel: form.deviceModel.trim(),
        issue: form.issue.trim(),
        includeIva: form.includeIva,
        branchId,
      })) as OrderRow;

      if (!created.id) {
        throw new Error("La API no devolvió el id de la orden creada");
      }

      for (const photo of files.intakePhotos) {
        await fixService.uploadOrderAttachment(created.id, photo, "intake_photo");
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
        setCreationSummary({
          folio: created.folio ?? "ORD",
          orderId: created.id,
          phone: form.clientPhone.trim(),
          portalUrl: customerPortalUrl,
        });
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
          <header className="flex flex-col justify-between gap-4 rounded-[28px] border border-zinc-800 bg-zinc-950/85 p-6 shadow-[0_16px_70px_rgba(0,0,0,0.24)] sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 [font-family:var(--font-display)]">Tablero de Órdenes</h1>
              <p className="mt-1 text-sm text-zinc-400">Gestiona el flujo de trabajo del taller con datos reales del API.</p>
            </div>
            <div className="h-11 w-36 rounded-full bg-slate-100" aria-busy="true" />
          </header>
          <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/85 px-4 py-8 text-center text-sm text-zinc-400 shadow-[0_12px_50px_rgba(0,0,0,0.24)]">Cargando órdenes...</div>
        </div>
      </RequireRole>
    );
  }

  return (
    <RequireRole allowed={["owner", "manager", "technician"]}>
      <div className="space-y-6 text-slate-950">
        <header className="flex flex-col justify-between gap-4 rounded-[28px] border border-zinc-800 bg-zinc-950/85 p-6 shadow-[0_16px_70px_rgba(0,0,0,0.24)] sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 [font-family:var(--font-display)]">Tablero de Órdenes</h1>
            <p className="mt-1 text-sm text-zinc-400">Recepción, adjuntos, timeline y detalle operativo con persistencia real.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="rounded-full bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-300">
            Nueva Orden
          </button>
        </header>

        {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {columns.map((column) => {
            const columnOrders = mappedRows.filter((order) => normalizeStatus(order.status, statusOptions.map((option) => option.key)) === column.id);
            return (
              <div key={column.id} className="min-w-[260px] rounded-[24px] border border-zinc-800 bg-zinc-950/85 shadow-[0_12px_50px_rgba(0,0,0,0.24)]">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#245a82]">{column.title}</h2>
                  <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-zinc-300">{columnOrders.length}</span>
                </div>
                <div className="space-y-3 p-3">
                  {columnOrders.map((order) => (
                    <article key={order.id} className="cursor-pointer rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-400/30" onClick={() => order.id && void openOrder(order.id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#245a82]">{order.folio ?? "ORD-..."}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">{order.device_info?.customer_name ?? "Cliente sin nombre"}</p>
                        </div>
                        <span className="rounded-full bg-[#1b9e5e]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1b9e5e]">Activo</span>
                      </div>
                      <p className="mt-2 text-sm text-zinc-400">{order.device_model ?? order.device_info?.model ?? "Equipo sin detallar"}</p>
                      <p className="mt-3 text-sm leading-6 text-zinc-300">{order.problem_description ?? "Sin descripción"}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {whatsappLink(getDetailPhone(order), tenantSlug, customerPortalBase, order.folio) ? (
                          <a
                            href={whatsappLink(getDetailPhone(order), tenantSlug, customerPortalBase, order.folio) ?? "#"}
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

        {creationSummary ? (
          <section className="rounded-[28px] border border-emerald-400/20 bg-emerald-400/10 p-5 shadow-[0_16px_70px_rgba(0,0,0,0.24)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400 text-zinc-950">✓</div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-emerald-700">Orden lista</p>
                  <h2 className="text-lg font-semibold text-emerald-950">{creationSummary.folio}</h2>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {creationShareLink ? (
                  <a
                    href={creationShareLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-[#1b9e5e] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Compartir por WhatsApp
                  </a>
                ) : (
                  <span className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500">WhatsApp pendiente</span>
                )}
                {detailOrder?.receipt_url ? (
                  <a
                    href={detailOrder.receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Generar PDF
                  </a>
                ) : (
                  <span className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500">PDF en proceso</span>
                )}
                <button
                  type="button"
                  onClick={() => setCreationSummary(null)}
                  className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-800"
                >
                  Finalizar
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm text-emerald-800">
              Se abrió el detalle de la orden y la evidencia queda persistida para el tenant actual.
            </p>
          </section>
        ) : null}

        <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/85 p-6 shadow-[0_16px_70px_rgba(0,0,0,0.24)]">
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
          onToggleIva={(checked) => setForm((current) => ({ ...current, includeIva: checked }))}
          onPhotoChange={(photos) => {
            void compressImageFiles(photos).then((compressed) => {
              setFiles((current) => ({ ...current, intakePhotos: compressed.slice(0, 3) }));
            }).catch((err) => {
              setError(err instanceof Error ? err.message : "Error al comprimir fotos");
            });
          }}
          onDocumentsChange={(documents) => setFiles((current) => ({ ...current, documents }))}
          onSubmit={() => void handleSubmit()}
        />

        <OrderDetailDrawer
          open={Boolean(selectedOrderId)}
          loading={detailLoading}
          data={detail}
          customerPortalUrl={customerPortalUrl}
          statusOptions={statusOptions}
          onClose={() => setSelectedOrderId(null)}
          onStatusChange={(status) => handleStatusChange(status)}
          onAddNote={() => handleAddNote()}
        />
      </div>
    </RequireRole>
  );
}
