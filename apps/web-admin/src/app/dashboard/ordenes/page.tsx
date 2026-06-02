"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { OrderDetailDrawer, type OrderDetailData } from "@/components/dashboard/orders/order-detail-drawer";
import { OrderIntakeModal, type OrderCreationSummary, type OrderIntakeFiles, type OrderIntakeFormState } from "@/components/dashboard/orders/order-intake-modal";
import { getActiveScope } from "@/lib/scope";
import { fixService } from "@/services/fixService";
import { type DynamicFieldDefinition } from "@white-label/ui";
import { ConfirmDialog } from "@white-label/ui";

type OrderRow = {
  id?: string;
  folio?: string;
  status?: string;
  device_model?: string;
  device_type?: string;
  problem_description?: string;
  created_at?: string;
  updated_at?: string;
  promised_date?: string | null;
  received_at?: string | null;
  completed_at?: string | null;
  delivered_at?: string | null;
  device_info?: {
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    brand?: string;
    model?: string;
    type?: string;
  };
  estimated_cost?: number;
  final_cost?: number;
  operational_risk?: {
    color?: TrafficLight;
    reason?: string;
    suggested_action?: string;
    elapsed_minutes?: number | null;
    rule_applied?: string | null;
    priority?: number;
  };
};

type OrderStatusOption = { key: string; label: string };
type TenantLabels = {
  asset: string;
  order: string;
  request: string;
};

const defaultStatusOptions: OrderStatusOption[] = [
  { key: "recibido", label: "Recibido" },
  { key: "en_espera_de_refaccion", label: "En espera de refacción" },
  { key: "diagnostico", label: "Diagnóstico" },
  { key: "cotizado", label: "Cotizado" },
  { key: "reparacion", label: "En reparación" },
  { key: "listo_para_entrega", label: "Listo para entrega" },
  { key: "listo", label: "Listo" },
  { key: "entregado", label: "Entregado" },
];

const defaultTenantLabels: TenantLabels = {
  asset: "Equipo",
  order: "Orden",
  request: "Solicitud",
};

type TrafficLight = "red" | "yellow" | "green" | "gray";

const initialForm: OrderIntakeFormState = {
  quoteFolio: "",
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  deviceType: "",
  deviceModel: "",
  issue: "",
  hasCharger: false,
  screenCondition: false,
  powersOn: false,
  backupRequired: false,
  intakeNotes: "",
  promisedDate: "",
  estimatedCost: "",
  includeIva: false,
};

const initialFiles: OrderIntakeFiles = {
  intakePhotos: [],
};

function coerceDynamicValue(definition: DynamicFieldDefinition, value: string | boolean | undefined) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (definition.field_type === "number" || definition.field_type === "money") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return value;
}

type OrderChecklist = {
  has_charger?: boolean;
  screen_condition?: string | null;
  powers_on?: boolean;
  backup_required?: boolean;
  notes?: string | null;
};

type PrioritizedOrder = OrderRow & {
  urgencyLevel: TrafficLight;
  urgencyLabel: string;
  urgencyScore: number;
  dueDateText: string;
  dueDateSort: number;
  pulse: boolean;
  isArchived: boolean;
};

type TrafficFilter = "all" | TrafficLight;

function normalizeStatus(status?: string, allowedStatuses: string[] = defaultStatusOptions.map((item) => item.key)) {
  const value = (status ?? "").toLowerCase();
  if (allowedStatuses.includes(value)) return value;
  if (value.includes("diag")) return "diagnostico";
  if (value.includes("refaccion")) return "en_espera_de_refaccion";
  if (value.includes("cotiz")) return "cotizado";
  if (value.includes("repar")) return "reparacion";
  if (value.includes("list") && value.includes("entrega")) return "listo_para_entrega";
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

function whatsappLink(phone?: string | null, tenantSlug?: string | null, portalBaseUrl?: string | null, folio?: string | null, assetLabel = "equipo") {
  if (!phone) return null;
  const normalized = phone.replace(/\D/g, "");
  if (!normalized) return null;
  const portalUrl = portalBaseUrl && tenantSlug ? buildPortalUrl(portalBaseUrl, tenantSlug, folio) : "";
  const message = encodeURIComponent(
    `Bienvenido a Marca Blanca. Aquí puedes consultar el estatus de tu ${assetLabel.toLowerCase()}: ${portalUrl}`
  );
  return `https://wa.me/${normalized}?text=${message}`;
}

function getDetailPhone(order?: OrderRow | null) {
  return order?.device_info?.customer_phone ?? null;
}

function resolveDueDate(order: OrderRow) {
  const candidate = order.promised_date ?? order.completed_at ?? order.updated_at ?? order.created_at ?? null;
  if (!candidate) return null;
  const date = new Date(candidate);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function getTrafficLight(order: OrderRow): PrioritizedOrder {
  const risk = order.operational_risk;
  if (risk?.color) {
    const urgencyLevel = risk.color;
    return {
      ...order,
      urgencyLevel,
      urgencyLabel: risk.reason ?? (urgencyLevel === "red" ? "Urgente" : urgencyLevel === "yellow" ? "Próximo" : urgencyLevel === "gray" ? "Cerrado" : "Con margen"),
      urgencyScore: typeof risk.priority === "number" ? risk.priority : 0,
      dueDateText:
        typeof risk.elapsed_minutes === "number"
          ? `${risk.elapsed_minutes} min`
          : "Sin cálculo",
      dueDateSort: typeof risk.elapsed_minutes === "number" ? risk.elapsed_minutes : Number.MAX_SAFE_INTEGER,
      pulse: urgencyLevel === "red",
      isArchived: urgencyLevel === "gray" || normalizeStatus(order.status) === "entregado",
    };
  }
  const now = new Date();
  const dueDate = resolveDueDate(order);
  const status = normalizeStatus(order.status);
  const statusRank: Record<string, number> = {
    recibido: 3,
    diagnostico: 2,
    reparacion: 1,
    listo: 0,
    entregado: 0,
  };
  const diffDays = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / 86400000) : null;
  const isArchived = status === "entregado";
  const isCritical = !isArchived && (status === "listo" || (diffDays !== null && diffDays <= 1));
  const isWarning = !isArchived && !isCritical && (status === "reparacion" || (diffDays !== null && diffDays <= 3));
  const urgencyLevel: TrafficLight = isArchived ? "gray" : isCritical ? "red" : isWarning ? "yellow" : "green";

  const urgencyLabel =
    urgencyLevel === "red" ? "Urgente" : urgencyLevel === "yellow" ? "Próximo" : urgencyLevel === "gray" ? "Cerrado" : "Con margen";

  return {
    ...order,
    urgencyLevel,
    urgencyLabel,
    urgencyScore: (statusRank[status] ?? 4) * 10 + (diffDays ?? 99),
    dueDateText: dueDate
      ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(dueDate)
      : "Sin fecha límite",
    dueDateSort: dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER,
    pulse: urgencyLevel === "red",
    isArchived,
  };
}

function getTrafficLightTone(level: TrafficLight) {
  if (level === "red") return "border-rose-500/35 bg-rose-500/10 text-rose-100";
  if (level === "yellow") return "border-amber-500/35 bg-amber-500/10 text-amber-100";
  if (level === "gray") return "border-zinc-500/35 bg-zinc-500/10 text-zinc-100";
  return "border-emerald-500/35 bg-emerald-500/10 text-emerald-100";
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
  const { tenantSlug, sucursalId } = useAuth();
  const scope = getActiveScope();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteMessage, setQuoteMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<OrderDetailData | null>(null);
  const [detailChecklist, setDetailChecklist] = useState<OrderChecklist | null>(null);
  const [form, setForm] = useState<OrderIntakeFormState>(initialForm);
  const [files, setFiles] = useState<OrderIntakeFiles>(initialFiles);
  const [creationSummary, setCreationSummary] = useState<OrderCreationSummary | null>(null);
  const [statusOptions, setStatusOptions] = useState<OrderStatusOption[]>(defaultStatusOptions);
  const [tenantLabels, setTenantLabels] = useState<TenantLabels>(defaultTenantLabels);
  const [dynamicFieldDefinitions, setDynamicFieldDefinitions] = useState<DynamicFieldDefinition[]>([]);
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, string | boolean>>({});
  const [copiedText, setCopiedText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [trafficFilter, setTrafficFilter] = useState<TrafficFilter>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<"soonest" | "oldest">("soonest");
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);

  const customerPortalBase = process.env.NEXT_PUBLIC_CUSTOMER_TRACKING_URL ?? "";
  const customerPortalUrl = useMemo(() => {
    const base = customerPortalBase.trim().replace(/\/$/, "");
    if (!base || !tenantSlug) return null;
    return `${base}/t/${encodeURIComponent(tenantSlug)}/portal`;
  }, [customerPortalBase, tenantSlug]);

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
        const runtimeLabels = settings.data.tenant.labels ?? settings.data.config?.labels ?? {};
        const industry = settings.data.tenant.industry_profile as { asset_label?: string; order_label?: string; request_label?: string } | undefined;
        const fieldDefinitions = (settings.data.tenant.field_definitions ?? settings.data.config?.fieldDefinitions ?? []) as DynamicFieldDefinition[];
        const options = settings.data.tenant.status_options?.service_orders?.filter((item) => typeof item?.key === "string" && item.key.trim().length > 0).map((item) => ({
          key: String(item.key),
          label: String(item.label ?? item.key),
        })) ?? [];
        const operational = (settings.data.tenant.operational_settings as { orderStatuses?: Array<{ key?: string; label?: string }> } | undefined) ?? undefined;
        const fallbackOptions = operational?.orderStatuses?.filter((item) => typeof item?.key === "string" && item.key.trim().length > 0).map((item) => ({
          key: String(item.key),
          label: String(item.label ?? item.key),
        })) ?? [];
        if (!cancelled) {
          setStatusOptions(options.length > 0 ? options : fallbackOptions.length > 0 ? fallbackOptions : defaultStatusOptions);
          setTenantLabels({
            asset: String(runtimeLabels.asset ?? industry?.asset_label ?? defaultTenantLabels.asset),
            order: String(runtimeLabels.order ?? industry?.order_label ?? defaultTenantLabels.order),
            request: String(runtimeLabels.request ?? industry?.request_label ?? defaultTenantLabels.request),
          });
          setDynamicFieldDefinitions(fieldDefinitions.filter((item) => item.entity === "service_orders" && item.visible !== false));
        }
      } catch {
        if (!cancelled) setStatusOptions(defaultStatusOptions);
        if (!cancelled) setTenantLabels(defaultTenantLabels);
        if (!cancelled) setDynamicFieldDefinitions([]);
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
        const [data, checklist] = await Promise.all([
          fixService.getOrderById(orderId),
          fixService.getOrderChecklist(orderId).catch(() => null),
        ]);
        if (!cancelled) {
          setDetail(data as OrderDetailData);
          setDetailChecklist((checklist as OrderChecklist | null) ?? null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar detalle");
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }

    if (selectedOrderId) {
      void loadDetail(selectedOrderId);
    }

    return () => {
      cancelled = true;
    };
  }, [selectedOrderId]);

  const mappedRows = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        clientName: order.device_info?.customer_name ?? "",
        device_model: order.device_model ?? order.device_info?.model ?? order.device_info?.brand ?? "",
      })),
    [orders]
  );

  const prioritizedOrders = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return mappedRows
      .map((order) => getTrafficLight(order))
      .filter((order) => {
        if (trafficFilter !== "all" && order.urgencyLevel !== trafficFilter) return false;
        if (statusFilter !== "all" && normalizeStatus(order.status) !== statusFilter) return false;
        if (!normalizedQuery) return true;
        const haystack = [
          order.folio,
          order.device_info?.customer_name,
          order.device_info?.customer_phone,
          order.device_model,
          order.problem_description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => {
        const levelWeight = { red: 0, yellow: 1, green: 2, gray: 3 } as const;
        const levelDiff = levelWeight[a.urgencyLevel] - levelWeight[b.urgencyLevel];
        if (levelDiff !== 0) return levelDiff;
        if (sortMode === "oldest") {
          return b.dueDateSort - a.dueDateSort;
        }
        if (a.urgencyScore !== b.urgencyScore) return a.urgencyScore - b.urgencyScore;
        return a.dueDateSort - b.dueDateSort;
      });
  }, [mappedRows, searchQuery, trafficFilter, statusFilter, sortMode]);

  const redOrders = prioritizedOrders.filter((order) => order.urgencyLevel === "red");
  const yellowOrders = prioritizedOrders.filter((order) => order.urgencyLevel === "yellow");
  const greenOrders = prioritizedOrders.filter((order) => order.urgencyLevel === "green");
  const grayOrders = prioritizedOrders.filter((order) => order.urgencyLevel === "gray");
  const totalOpenOrders = prioritizedOrders.filter((order) => !order.isArchived).length;
  const activeRedCount = redOrders.length;
  const activeYellowCount = yellowOrders.length;
  const activeGreenCount = greenOrders.length;
  const archivedCount = grayOrders.length;
  const scopeLabel = scope?.mode === "consolidated" ? "Consolidado" : "Sucursal activa";

  const detailOrder = detail?.order ?? null;
  async function handleEditOrderDetails(payload: {
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
    deviceType?: string;
    deviceModel?: string;
    issue?: string;
    promisedDate?: string;
  }) {
    if (!detailOrder?.id) return;
    try {
      await fixService.updateOrderDetails(detailOrder.id, payload);
      await refreshOrders();
      const updated = (await fixService.getOrderById(detailOrder.id)) as OrderDetailData;
      setDetail(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar ficha");
    }
  }

  async function refreshOrders() {
    const data = await fixService.getOrders();
    setOrders(data as OrderRow[]);
  }

  async function copyToClipboard(text: string, label: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      window.setTimeout(() => setCopiedText(""), 1800);
    } catch {
      setError("No se pudo copiar al portapapeles");
    }
  }

  async function openOrder(orderId: string) {
    setSelectedOrderId(orderId);
  }

  async function handleSubmit() {
    try {
      setSaving(true);
      setError("");
      const selectedSucursalId = isUuid(scope?.sucursalId ?? sucursalId) ? (scope?.sucursalId ?? sucursalId) : undefined;
      for (const definition of dynamicFieldDefinitions) {
        if (!definition.required || definition.visible === false) continue;
        const value = dynamicFieldValues[definition.field_key];
        const missing =
          definition.field_type === "boolean"
            ? value === undefined || value === null
            : typeof value === "string"
              ? value.trim().length === 0
              : value === undefined || value === null;
        if (missing) {
          throw new Error(`Falta completar el campo requerido: ${definition.field_label}`);
        }
      }

      const metadata = dynamicFieldDefinitions.reduce<Record<string, string | boolean | number>>((acc, definition) => {
        const value = coerceDynamicValue(definition, dynamicFieldValues[definition.field_key]);
        if (value !== undefined) {
          acc[definition.field_key] = value;
        }
        return acc;
      }, {});

      const created = (await fixService.createOrder({
        clientName: form.clientName.trim(),
        clientPhone: form.clientPhone.trim(),
        clientEmail: form.clientEmail.trim(),
        deviceType: form.deviceType.trim(),
        deviceModel: form.deviceModel.trim(),
        issue: form.issue.trim(),
        quoteFolio: form.quoteFolio.trim() || undefined,
        promisedDate: form.promisedDate || undefined,
        estimatedCost: Number(form.estimatedCost || 0),
        includeIva: form.includeIva,
        checklist: {
          hasCharger: form.hasCharger,
          screenCondition: form.screenCondition ? "OK" : "",
          powersOn: form.powersOn,
          backupRequired: form.backupRequired,
          notes: form.intakeNotes.trim(),
        },
        metadata,
        receiptUrl: "",
        sucursalId: selectedSucursalId,
      })) as OrderRow;

      if (!created.id) {
        throw new Error("La API no devolvió el id de la orden creada");
      }

      for (const photo of files.intakePhotos) {
        await fixService.uploadOrderAttachment(created.id, photo, "intake_photo");
      }

      await refreshOrders();
      const createdDetail = (await fixService.getOrderById(created.id)) as OrderDetailData;
      const receiptUrl =
        createdDetail?.order?.receipt_url ??
        createdDetail?.documents?.find((document) => document.file_type === "receipt_pdf" && document.public_url)?.public_url ??
        null;
      const portalUrl = customerPortalUrl ? `${customerPortalUrl}?folio=${encodeURIComponent(created.folio ?? "ORD")}` : null;
      const whatsappUrl = created.folio
        ? whatsappLink(form.clientPhone.trim(), tenantSlug, customerPortalBase, created.folio, tenantLabels.asset) ?? null
        : null;
      setFiles(initialFiles);
      setDynamicFieldValues({});
      if (created.id) {
        setSelectedOrderId(created.id);
        setCreationSummary({
          folio: created.folio ?? "ORD",
          orderId: created.id,
          phone: form.clientPhone.trim(),
          portalUrl,
          pdfUrl: receiptUrl,
          whatsappUrl,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear orden");
    } finally {
      setSaving(false);
    }
  }

  async function handleLoadQuoteFolio() {
    const folio = form.quoteFolio.trim().toUpperCase();
    if (!folio) {
      setQuoteMessage("Ingresa un folio de cotización.");
      return;
    }

    try {
      setQuoteLoading(true);
      setQuoteMessage("Buscando solicitud...");
      const requests = await fixService.getServiceRequests();
      const request = requests.find((item) => String(item.folio ?? "").trim().toUpperCase() === folio);

      if (!request) {
        throw new Error("No se encontró la solicitud");
      }

      const deviceType = String(request.device_type ?? "").trim();
      const deviceModel = String(request.device_model ?? "").trim();
      const issue = String(request.issue_description ?? "").trim();

      setForm((current) => ({
        ...current,
        clientName: String(request.customer_name ?? "").trim(),
        clientPhone: String(request.customer_phone ?? "").trim(),
        clientEmail: String(request.customer_email ?? "").trim(),
        deviceType: deviceType || current.deviceType,
        deviceModel: deviceModel || current.deviceModel,
        issue: issue || current.issue,
        quoteFolio: folio,
        intakeNotes: current.intakeNotes.trim() ? current.intakeNotes : `Origen solicitud: ${folio}`,
      }));

      setQuoteMessage(`Solicitud ${folio} cargada. Puedes editar todo antes de guardar.`);
    } catch (err) {
      setQuoteMessage(err instanceof Error ? err.message : "No se pudo cargar la solicitud");
    } finally {
      setQuoteLoading(false);
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

  async function handleUpdateFinancials() {
    if (!detailOrder?.id) return;
    const estimated = window.prompt("Costo estimado", String(detailOrder.estimated_cost ?? 0));
    if (estimated === null) return;
    const finalValue = window.prompt("Costo final", String(detailOrder.final_cost ?? detailOrder.estimated_cost ?? 0));
    if (finalValue === null) return;
    const note = window.prompt("Nota financiera opcional") ?? "";

    try {
      await fixService.updateOrderFinancials(detailOrder.id, {
        estimatedCost: Number(estimated),
        finalCost: Number(finalValue),
        note: note.trim() || undefined,
      });
      const updated = (await fixService.getOrderById(detailOrder.id)) as OrderDetailData;
      setDetail(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar costos");
    }
  }

  async function handleUpdateChecklist() {
    if (!detailOrder?.id) return;
    const hasCharger = window.confirm("¿El equipo viene con cargador?");
    const screenCondition = window.prompt("Estado de pantalla", detailChecklist?.screen_condition ?? "Pantalla bien");
    if (screenCondition === null) return;
    const powersOn = window.confirm("¿El equipo enciende?");
    const backupRequired = window.confirm("¿Requiere respaldo?");
    const notes = window.prompt("Notas del checklist", detailChecklist?.notes ?? "") ?? "";

    try {
      await fixService.updateOrderChecklist(detailOrder.id, {
        hasCharger,
        screenCondition: screenCondition.trim(),
        powersOn,
        backupRequired,
        notes: notes.trim(),
      });
      const updated = (await fixService.getOrderById(detailOrder.id)) as OrderDetailData;
      setDetail(updated);
      const checklist = await fixService.getOrderChecklist(detailOrder.id).catch(() => null);
      setDetailChecklist((checklist as OrderChecklist | null) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar checklist");
    }
  }

  async function handleArchiveOrder(orderId: string) {
    setPendingArchiveId(orderId);
  }

  function openReceiptPdf() {
    const receiptUrl =
      detailOrder?.receipt_url ??
      detail?.documents?.find((document) => document.file_type === "receipt_pdf" && document.public_url)?.public_url ??
      null;
    if (!receiptUrl) return;
    window.open(receiptUrl, "_blank", "noopener,noreferrer");
  }

  function printReceipt() {
    const receiptUrl =
      detailOrder?.receipt_url ??
      detail?.documents?.find((document) => document.file_type === "receipt_pdf" && document.public_url)?.public_url ??
      null;
    if (receiptUrl) {
      const win = window.open(receiptUrl, "_blank", "noopener,noreferrer");
      if (!win) return;
      win.addEventListener("load", () => win.print(), { once: true });
      return;
    }
    window.print();
  }

  return (
    <RequireRole allowed={["owner", "manager", "technician"]}>
      <div className="space-y-6 text-slate-950">
        <header className="flex flex-col justify-between gap-4 rounded-[28px] border border-zinc-800 bg-zinc-950/85 p-6 shadow-[0_16px_70px_rgba(0,0,0,0.24)] sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50 [font-family:var(--font-display)]">Nueva {tenantLabels.order}</h1>
            <p className="mt-1 text-sm text-zinc-400">Panel técnico · semáforo operativo · detalle real · {scopeLabel}.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void refreshOrders()}
              className="min-h-11 rounded-full border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/5 active:scale-95"
            >
              Actualizar
            </button>
            <button onClick={() => setIsModalOpen(true)} className="min-h-11 rounded-full bg-amber-50 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-100 active:scale-95">
              Nueva recepción
            </button>
          </div>
        </header>

        {error ? <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
        {copiedText ? <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{copiedText} copiado</p> : null}

        <section className="rounded-[28px] border border-amber-700/15 bg-[linear-gradient(180deg,rgba(16,14,12,0.96),rgba(22,18,14,0.98))] p-5 shadow-[0_12px_50px_rgba(0,0,0,0.24)]">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-400">
            <span>Modo: {scopeLabel}</span>
            <span>•</span>
            <span>Sucursal: {scope?.sucursalId ?? sucursalId ?? "No disponible"}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="rounded-[22px] border border-rose-500/25 bg-[linear-gradient(180deg,rgba(127,29,29,0.92),rgba(69,10,10,0.95))] p-4 shadow-[0_0_0_1px_rgba(248,113,113,0.12)]">
              <div className="text-xs uppercase tracking-[0.24em] text-rose-100/70">Críticos (&lt;2 días)</div>
              <div className="mt-2 text-3xl font-black text-rose-50">{activeRedCount}</div>
              <div className="mt-2 text-sm text-rose-100/80">Tienen prioridad de entrega o reparación inmediata.</div>
            </div>
            <div className="rounded-[22px] border border-amber-500/25 bg-[linear-gradient(180deg,rgba(120,53,15,0.92),rgba(69,26,3,0.95))] p-4 shadow-[0_0_0_1px_rgba(251,191,36,0.12)]">
              <div className="text-xs uppercase tracking-[0.24em] text-amber-100/70">Atención (3-4 días)</div>
              <div className="mt-2 text-3xl font-black text-amber-50">{activeYellowCount}</div>
              <div className="mt-2 text-sm text-amber-100/80">Ya requieren seguimiento para no cruzar a rojo.</div>
            </div>
            <div className="rounded-[22px] border border-emerald-500/25 bg-[linear-gradient(180deg,rgba(20,83,45,0.92),rgba(6,78,59,0.95))] p-4 shadow-[0_0_0_1px_rgba(74,222,128,0.12)]">
              <div className="text-xs uppercase tracking-[0.24em] text-emerald-100/70">A tiempo (5+ días)</div>
              <div className="mt-2 text-3xl font-black text-emerald-50">{activeGreenCount}</div>
              <div className="mt-2 text-sm text-emerald-100/80">Pueden esperar, pero siguen visibles.</div>
            </div>
            <div className="rounded-[22px] border border-sky-500/25 bg-[linear-gradient(180deg,rgba(30,41,59,0.92),rgba(15,23,42,0.95))] p-4 shadow-[0_0_0_1px_rgba(125,211,252,0.12)]">
              <div className="text-xs uppercase tracking-[0.24em] text-sky-100/70">Total en taller</div>
              <div className="mt-2 text-3xl font-black text-sky-50">{totalOpenOrders}</div>
              <div className="mt-2 text-sm text-sky-100/80">Órdenes activas visibles en el semáforo.</div>
            </div>
            <div className="rounded-[22px] border border-zinc-500/25 bg-[linear-gradient(180deg,rgba(39,39,42,0.92),rgba(24,24,27,0.95))] p-4 shadow-[0_0_0_1px_rgba(161,161,170,0.12)]">
              <div className="text-xs uppercase tracking-[0.24em] text-zinc-100/70">Cerradas</div>
              <div className="mt-2 text-3xl font-black text-zinc-50">{archivedCount}</div>
              <div className="mt-2 text-sm text-zinc-100/80">Órdenes completadas o archivadas.</div>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-sky-500/20 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.98))] p-4 shadow-[0_0_0_1px_rgba(56,189,248,0.09)]">
            <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto]">
              <label className="flex items-center gap-3 rounded-2xl border border-sky-400/40 bg-slate-950/80 px-4 py-3 text-sky-50 shadow-[0_0_0_1px_rgba(125,211,252,0.1)]">
                <span className="text-sky-300">⌕</span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Buscar por folio, cliente o ${tenantLabels.asset.toLowerCase()}...`}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-sky-100/40"
                />
              </label>
              <select
                value={trafficFilter}
                onChange={(e) => setTrafficFilter(e.target.value as TrafficFilter)}
                className="rounded-2xl border border-sky-400/30 bg-slate-950/80 px-4 py-3 text-sm text-sky-50 outline-none"
              >
                <option value="all">Todos los colores</option>
                <option value="red">Rojo</option>
                <option value="yellow">Amarillo</option>
                <option value="green">Verde</option>
                <option value="gray">Cerrado</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-sky-400/30 bg-slate-950/80 px-4 py-3 text-sm text-sky-50 outline-none"
              >
                <option value="all">Todos los estados</option>
                {statusOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as "soonest" | "oldest")}
                className="rounded-2xl border border-sky-400/30 bg-slate-950/80 px-4 py-3 text-sm text-sky-50 outline-none"
              >
                <option value="soonest">Días (menor primero)</option>
                <option value="oldest">Días (mayor primero)</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setTrafficFilter("all");
                  setStatusFilter("all");
                  setSortMode("soonest");
                }}
                className="rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
              >
                Limpiar
              </button>
            </div>
            <div className="mt-3 text-right text-xs text-sky-100/60">
              {new Date().toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" })}
            </div>
          </div>

          <div className="mt-5 space-y-5">
              {[
              { key: "red", title: "Urgentes", helper: "Entregar o reparar hoy", rows: redOrders },
              { key: "yellow", title: "Próximas", helper: "Ya requieren seguimiento", rows: yellowOrders },
              { key: "green", title: "Con margen", helper: "Todavía tienen tiempo", rows: greenOrders },
              { key: "gray", title: "Cerradas", helper: "Históricas o ya finalizadas", rows: grayOrders },
            ].map((group) => (
              <div key={group.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-sm font-semibold uppercase tracking-[0.22em] ${group.key === "red" ? "text-rose-100" : group.key === "yellow" ? "text-amber-100" : group.key === "gray" ? "text-zinc-100" : "text-emerald-100"}`}>
                      {group.title}
                    </h2>
                    <p className="mt-1 text-xs text-zinc-400">{group.helper}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${group.key === "red" ? "border-rose-500/30 bg-rose-500/10 text-rose-100" : group.key === "yellow" ? "border-amber-500/30 bg-amber-500/10 text-amber-100" : group.key === "gray" ? "border-zinc-500/30 bg-zinc-500/10 text-zinc-100" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"}`}>
                    {group.rows.length}
                  </span>
                </div>

                <div className="grid gap-3">
                  {group.rows.map((order) => {
                    const phone = getDetailPhone(order);
                    const contactLink = whatsappLink(phone, tenantSlug, customerPortalBase, order.folio, tenantLabels.asset);
                    const tone = getTrafficLightTone(order.urgencyLevel);
                    return (
                      <article
                        key={order.id}
                        className={`cursor-pointer rounded-[24px] border p-4 shadow-sm transition hover:-translate-y-0.5 ${tone} ${order.pulse ? "animate-pulse shadow-[0_0_0_1px_rgba(244,63,94,0.35),0_0_28px_rgba(244,63,94,0.18)]" : ""}`}
                        onClick={() => order.id && void openOrder(order.id)}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-90">{order.folio ?? "ORD-..."}</p>
                            <p className="mt-1 text-sm font-semibold text-zinc-50">{order.device_info?.customer_name ?? "Cliente sin nombre"}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] opacity-80">
                              {order.status ?? "Sin estado"} · {order.urgencyLabel}
                            </p>
                            {order.operational_risk?.reason ? <p className="mt-2 text-xs text-zinc-500">{order.operational_risk.reason}</p> : null}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-100">
                              {order.dueDateText}
                            </span>
                            {order.urgencyLevel === "red" ? (
                              <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white">
                                ¡Atención ya!
                              </span>
                            ) : order.urgencyLevel === "gray" ? (
                              <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white">
                                Cerrada
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <p className="mt-3 text-sm text-zinc-50/90">{order.device_model ?? order.device_info?.model ?? `${tenantLabels.asset} sin detallar`}</p>
                        <p className="mt-2 text-sm leading-6 text-zinc-50/80">{order.problem_description ?? "Sin descripción"}</p>
                        <div className="mt-3 inline-flex rounded-full border border-black/10 bg-black/20 px-3 py-1 text-xs font-semibold text-zinc-50">
                          Estimado ${Number(order.estimated_cost ?? 0).toFixed(2)} · Final ${Number(order.final_cost ?? 0).toFixed(2)}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {contactLink ? (
                            <a
                              href={contactLink}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full bg-zinc-950/90 px-3 py-1 text-xs font-semibold text-white"
                              onClick={(e) => e.stopPropagation()}
                            >
                              WhatsApp
                            </a>
                          ) : null}
                          <button
                            type="button"
                            className="rounded-full border border-black/20 bg-black/10 px-3 py-1 text-xs font-semibold text-zinc-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              void copyToClipboard(order.folio ?? "", `Folio ${order.folio ?? ""}`);
                            }}
                          >
                            Copiar folio
                          </button>
                          {order.status !== "entregado" ? (
                            <button
                              type="button"
                              className="rounded-full border border-black/20 bg-black/10 px-3 py-1 text-xs font-semibold text-zinc-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (order.id) void handleArchiveOrder(order.id);
                              }}
                            >
                              Enviar a archivo
                            </button>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                  {!loading && group.rows.length === 0 ? <p className="rounded-2xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">Sin órdenes en este nivel.</p> : null}
                </div>
              </div>
            ))}
            {loading ? <p className="px-2 py-8 text-center text-sm text-slate-500">Cargando órdenes…</p> : null}
          </div>
        </section>

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
                {creationSummary?.whatsappUrl ? (
                  <a
                    href={creationSummary.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-[#475569] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Compartir por WhatsApp
                  </a>
                ) : (
                  <span className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500">WhatsApp pendiente</span>
                )}
                {creationSummary?.pdfUrl ? (
                  <a
                    href={creationSummary.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Ver PDF
                  </a>
                ) : (
                  <span className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500">PDF en proceso</span>
                )}
                <button
                  type="button"
                  onClick={() => void copyToClipboard(creationSummary.portalUrl ?? creationSummary.folio, `Portal ${creationSummary.folio}`)}
                  className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-800"
                >
                  Copiar folio
                </button>
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

        <OrderIntakeModal
          open={isModalOpen}
          saving={saving}
          error={error}
          quoteLoading={quoteLoading}
          quoteMessage={quoteMessage}
          form={form}
          files={files}
          successSummary={creationSummary}
          customerPortalBase={customerPortalBase}
          tenantSlug={tenantSlug}
          dynamicFieldDefinitions={dynamicFieldDefinitions}
          dynamicFieldValues={dynamicFieldValues}
          onClose={() => {
            setIsModalOpen(false);
            setCreationSummary(null);
          }}
          onResetFlow={() => {
            setCreationSummary(null);
            setForm(initialForm);
            setIsModalOpen(false);
            setDynamicFieldValues({});
          }}
          onChange={(name, value) => setForm((current) => ({ ...current, [name]: value }))}
          onDynamicFieldChange={(fieldKey, value) => setDynamicFieldValues((current) => ({ ...current, [fieldKey]: value }))}
          onPhotoChange={(photos) => {
            void compressImageFiles(photos).then((compressed) => {
              setFiles((current) => ({ ...current, intakePhotos: compressed.slice(0, 3) }));
            }).catch((err) => {
              setError(err instanceof Error ? err.message : "Error al comprimir fotos");
            });
          }}
          onLoadQuoteFolio={() => void handleLoadQuoteFolio()}
          onSubmit={() => void handleSubmit()}
          onCopy={(value, label) => void copyToClipboard(value, label)}
        />

        <OrderDetailDrawer
          open={Boolean(selectedOrderId)}
          loading={detailLoading}
          data={detail ? { ...detail, checklist: detailChecklist ?? detail.checklist ?? null } : null}
          customerPortalUrl={customerPortalUrl}
          statusOptions={statusOptions}
          onClose={() => setSelectedOrderId(null)}
          onStatusChange={(status) => handleStatusChange(status)}
          onAddNote={() => handleAddNote()}
          onCopyFolio={() => void copyToClipboard(detailOrder?.folio ?? "", `Folio ${detailOrder?.folio ?? ""}`)}
          onOpenPdf={openReceiptPdf}
          onPrintReceipt={printReceipt}
          onEditFinancials={() => void handleUpdateFinancials()}
          onEditDetails={(payload) => handleEditOrderDetails(payload)}
          onEditChecklist={() => void handleUpdateChecklist()}
          onArchive={() => void handleArchiveOrder(detailOrder?.id ?? "")}
        />
        <ConfirmDialog
          open={Boolean(pendingArchiveId)}
          title="Enviar al archivo"
          description="Esta acción marcará la orden como entregada y la moverá al archivo."
          confirmLabel="Enviar"
          danger
          onConfirm={async () => {
            if (!pendingArchiveId) return;
            try {
              await fixService.updateOrderStatus(pendingArchiveId, "entregado", "Movida a archivo desde el panel de órdenes");
              await refreshOrders();
              if (selectedOrderId === pendingArchiveId) {
                const updated = (await fixService.getOrderById(pendingArchiveId)) as OrderDetailData;
                setDetail(updated);
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : "Error al enviar al archivo");
            } finally {
              setPendingArchiveId(null);
            }
          }}
          onCancel={() => setPendingArchiveId(null)}
        />
      </div>
    </RequireRole>
  );
}
