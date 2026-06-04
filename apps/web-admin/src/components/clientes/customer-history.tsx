"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import { getApiOptions } from "@/lib/tenant";
import type { Customer, CustomerHistory } from "@/types";

export function CustomerHistory({ open, onOpenChange, customer }: { open: boolean; onOpenChange: (open: boolean) => void; customer: Customer | null }) {
  const [history, setHistory] = useState<CustomerHistory | null>(null);
  useEffect(() => {
    if (!customer || !open) return;
    void (async () => {
      try {
        const data = await apiClient.get<{ data: CustomerHistory }>(`/customers/${customer.id}/history`, getApiOptions());
        setHistory(data.data);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [customer, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-srf-surface border-srf-primary/40">
        <div className="w-full rounded-xl border border-srf-primary/30 bg-srf-bg p-5">
          <DialogHeader>
            <DialogTitle>Historial de {customer?.name}</DialogTitle>
          </DialogHeader>
          {history ? <pre className="text-xs whitespace-pre-wrap text-srf-muted">{JSON.stringify(history, null, 2)}</pre> : <p className="text-srf-muted">Cargando...</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

