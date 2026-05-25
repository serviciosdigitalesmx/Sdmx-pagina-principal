"use client";

type OrderTimelineEvent = {
  id?: string;
  event_type?: string;
  previous_status?: string | null;
  new_status?: string | null;
  note?: string | null;
  actor_name?: string | null;
  created_at?: string;
};

type Props = {
  events: OrderTimelineEvent[];
  statusLabels?: Record<string, string>;
};

const defaultStatusLabels: Record<string, string> = {
  recibido: "Recibida",
  diagnostico: "Diagnóstico",
  reparacion: "En reparación",
  listo: "Lista",
  entregado: "Entregada",
};

export function OrderTimeline({ events, statusLabels }: Props) {
  const labels = { ...defaultStatusLabels, ...(statusLabels ?? {}) };

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        Aún no hay eventos registrados.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <article key={event.id ?? `${event.event_type}-${event.created_at}`} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-slate-950">
              {labels[event.new_status ?? ""] ?? event.event_type ?? "Evento"}
            </div>
            <time className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {event.created_at ? new Date(event.created_at).toLocaleString("es-MX") : "Sin fecha"}
            </time>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {event.note || "Sin nota"}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
            {event.actor_name || "Sistema"}
          </p>
        </article>
      ))}
    </div>
  );
}
