"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { fixService } from "@/services/fixService";

type TaskRow = {
  id?: string;
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  branch_id?: string | null;
  service_order_id?: string | null;
  service_request_id?: string | null;
  assigned_user_id?: string | null;
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
};

type StatusOption = { key: string; label: string; tone?: string };

const defaultStatuses: StatusOption[] = [
  { key: "pendiente", label: "Pendiente", tone: "border-zinc-800 bg-zinc-900/70 text-zinc-200" },
  { key: "en_proceso", label: "En proceso", tone: "border-amber-400/20 bg-amber-400/10 text-amber-200" },
  { key: "bloqueada", label: "Bloqueada", tone: "border-rose-400/20 bg-rose-400/10 text-rose-200" },
  { key: "hecha", label: "Hecha", tone: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" },
];

const defaultForm = {
  title: "",
  description: "",
  status: "pendiente",
  priority: "media",
  serviceOrderId: "",
  serviceRequestId: "",
  dueDate: "",
};

export default function TareasPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [orders, setOrders] = useState<Array<{ id?: string; folio?: string }>>([]);
  const [statuses, setStatuses] = useState<StatusOption[]>(defaultStatuses);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ task?: TaskRow; history?: Array<{ event_type?: string; comment?: string | null; created_at?: string }> } | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [copied, setCopied] = useState("");

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setError("No se pudo copiar el texto.");
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const [taskRows, orderRows, tenantSettings] = await Promise.all([
          fixService.getTasks(),
          fixService.getOrders(),
          fixService.getTenantSettings(),
        ]);
        if (cancelled) return;
        setTasks(taskRows as TaskRow[]);
        setOrders(orderRows as Array<{ id?: string; folio?: string }>);
        const operational = (tenantSettings.data.tenant.operational_settings as { taskStatuses?: Array<{ key?: string; label?: string; tone?: string }> } | null | undefined) ?? undefined;
        const nextStatuses = operational?.taskStatuses?.filter((item) => typeof item?.key === "string" && item.key.trim().length > 0).map((item) => ({
          key: String(item.key),
          label: String(item.label ?? item.key),
          tone: String(item.tone ?? "zinc"),
        }));
        if (nextStatuses && nextStatuses.length > 0) {
          setStatuses(nextStatuses);
          setForm((current) => ({ ...current, status: nextStatuses[0].key }));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar tareas");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refresh() {
    const [taskRows] = await Promise.all([fixService.getTasks()]);
    setTasks(taskRows as TaskRow[]);
  }

  async function loadDetail(id: string) {
    const data = await fixService.getTaskById(id);
    setDetail(data as { task?: TaskRow; history?: Array<{ event_type?: string; comment?: string | null; created_at?: string }> });
  }

  async function handleCreate() {
    try {
      setSaving(true);
      setError("");
      const created = await fixService.createTask({
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        serviceOrderId: form.serviceOrderId || undefined,
        serviceRequestId: form.serviceRequestId || undefined,
        dueDate: form.dueDate || undefined,
      });
      const createdId = typeof created?.id === "string" ? created.id : "";
      if (createdId) {
        await refresh();
        setSelectedId(createdId);
        await loadDetail(createdId);
      }
      setForm(defaultForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear tarea");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await fixService.updateTaskStatus(id, status);
      await refresh();
      await loadDetail(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar tarea");
    }
  }

  const grouped = useMemo(() => {
    return statuses.reduce<Record<string, TaskRow[]>>((acc, item) => {
      acc[item.key] = tasks.filter((task) => String(task.status ?? "").toLowerCase() === item.key);
      return acc;
    }, {});
  }, [statuses, tasks]);

  return (
    <RequireRole allowed={["owner", "manager", "technician"]}>
      <ModuleShell
        title="Tareas"
        subtitle="Tareas operativas con historial real, vinculadas a órdenes o solicitudes."
        icon="ri-task-line"
        actionLabel="Crear tarea"
        onAction={() => setSelectedId(null)}
        secondaryActionLabel="Actualizar"
        secondaryOnAction={() => void refresh()}
        stats={[]}
        columns={[]}
        rows={[]}
        emptyTitle="Sin tareas"
        emptyCopy="Crea la primera tarea operativa."
      >
        <div className="space-y-6">
          {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

          <section className="grid gap-4 rounded-[24px] border border-zinc-800 bg-zinc-950/85 p-5 shadow-[0_16px_70px_rgba(0,0,0,0.24)] md:grid-cols-2 xl:grid-cols-3">
            <input className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100" placeholder="Título" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            <select className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
              {statuses.map((status) => <option key={status.key} value={status.key}>{status.label}</option>)}
            </select>
            <select className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
            <select className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100" value={form.serviceOrderId} onChange={(event) => setForm((current) => ({ ...current, serviceOrderId: event.target.value }))}>
              <option value="">Sin orden</option>
              {orders.map((order) => <option key={order.id} value={order.id ?? ""}>{order.folio ?? order.id}</option>)}
            </select>
            <input className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100" placeholder="Fecha límite ISO" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} />
            <button disabled={saving || !form.title.trim()} onClick={() => void handleCreate()} className="rounded-2xl bg-slate-400 px-4 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-50">
              {saving ? "Guardando..." : "Crear tarea"}
            </button>
            <textarea className="min-h-28 rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 md:col-span-2 xl:col-span-3" placeholder="Descripción" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </section>

          <section className="grid gap-4 xl:grid-cols-4">
            {statuses.map((status) => (
              <article key={status.key} className={`rounded-[24px] border p-4 shadow-[0_16px_70px_rgba(0,0,0,0.24)] ${status.tone ?? "border-zinc-800 bg-zinc-950/85 text-zinc-100"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em]">{status.label}</h3>
                  <span className="rounded-full bg-black/20 px-2.5 py-1 text-xs font-semibold">{grouped[status.key]?.length ?? 0}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {(grouped[status.key] ?? []).map((task) => (
                    <button
                      key={task.id}
                      onClick={() => {
                        if (task.id) {
                          setSelectedId(task.id);
                          void loadDetail(task.id);
                        }
                      }}
                      className="block w-full rounded-2xl border border-black/10 bg-black/10 p-4 text-left transition hover:bg-black/20"
                    >
                      <div className="text-sm font-semibold">{task.title ?? "Tarea"}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] opacity-70">{task.priority ?? "media"}</div>
                    </button>
                  ))}
                  {grouped[status.key]?.length ? null : <p className="text-sm opacity-70">Sin tareas</p>}
                </div>
              </article>
            ))}
          </section>

          <section className="rounded-[24px] border border-zinc-800 bg-zinc-950/85 p-5 shadow-[0_16px_70px_rgba(0,0,0,0.24)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-zinc-50">Detalle</h2>
              {selectedId ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void refresh()}
                    className="rounded-full border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200"
                  >
                    Recargar
                  </button>
                  {detail?.task?.title ? (
                    <button
                      type="button"
                      onClick={() => void copyText(detail.task?.title ?? "", "Título copiado")}
                      className="rounded-full border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200"
                    >
                      Copiar título
                    </button>
                  ) : null}
                  {statuses.map((status) => (
                    <button key={status.key} onClick={() => void handleStatusChange(selectedId, status.key)} className="rounded-full border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200">
                      {status.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {detail?.task ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2 text-sm text-zinc-300">
                  <div><span className="text-zinc-500">Título:</span> {detail.task.title ?? "-"}</div>
                  <div><span className="text-zinc-500">Estado:</span> {detail.task.status ?? "-"}</div>
                  <div><span className="text-zinc-500">Prioridad:</span> {detail.task.priority ?? "-"}</div>
                  <div><span className="text-zinc-500">Orden:</span> {detail.task.service_order_id ?? "-"}</div>
                  <div><span className="text-zinc-500">Solicitud:</span> {detail.task.service_request_id ?? "-"}</div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Historial</h3>
                  <div className="mt-3 space-y-2">
                    {(detail.history ?? []).length > 0 ? (detail.history ?? []).map((entry, index) => (
                      <div key={`${entry.event_type ?? "event"}-${index}`} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3 text-sm text-zinc-300">
                        <div className="font-semibold text-zinc-100">{entry.event_type ?? "evento"}</div>
                        <div>{entry.comment ?? "Sin comentario"}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">{entry.created_at ? new Date(entry.created_at).toLocaleString("es-MX") : "Sin fecha"}</div>
                      </div>
                    )) : <p className="text-sm text-zinc-500">Sin historial.</p>}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">{loading ? "Cargando..." : "Selecciona una tarea para ver el detalle."}</p>
            )}
            {copied ? <p className="mt-3 text-xs uppercase tracking-[0.18em] text-emerald-300">{copied}</p> : null}
          </section>
        </div>
      </ModuleShell>
    </RequireRole>
  );
}
