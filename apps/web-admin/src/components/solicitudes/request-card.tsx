"use client";

import { Button } from "@/components/ui/button";
import type { ServiceRequest } from "@/types";

export function RequestCard({ request, onQuote, onArchive }: { request: ServiceRequest; onQuote: () => void; onArchive: () => void }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-srf-primary">{request.folio}</p>
          <p className="text-sm text-srf-text">{request.customer_name}</p>
          <p className="text-xs text-srf-muted">{request.device_type} · {request.device_model}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onQuote}>Cotizar</Button>
          <Button variant="secondary" onClick={onArchive}>Archivar</Button>
        </div>
      </div>
    </div>
  );
}

