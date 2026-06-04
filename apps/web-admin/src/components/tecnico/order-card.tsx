"use client";

import type { Order } from "@/types";

export function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const customerName = order.device_info?.customer_name || "Cliente sin nombre";
  const deviceName = `${order.device_info?.type || ""} ${order.device_info?.model || ""}`.trim() || "Equipo sin especificar";
  return (
    <button onClick={onClick} className="card w-full p-4 text-left transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-bold text-srf-primary">{order.folio}</span>
        <span className="text-xs text-srf-muted">{order.status}</span>
      </div>
      <p className="mt-2 font-semibold">{customerName}</p>
      <p className="text-sm text-srf-muted">{deviceName}</p>
      <p className="mt-3 truncate text-sm text-srf-muted">{order.problem_description?.slice(0, 60) || "Sin descripción"}</p>
    </button>
  );
}

