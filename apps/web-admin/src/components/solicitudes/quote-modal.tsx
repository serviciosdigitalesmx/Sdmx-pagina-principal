"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { getApiOptions } from "@/lib/tenant";
import type { ServiceRequest } from "@/types";

export function QuoteModal({ open, onOpenChange, request, onQuoted }: { open: boolean; onOpenChange: (open: boolean) => void; request: ServiceRequest | null; onQuoted: () => void }) {
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const handleSubmit = async () => {
    if (!request) return;
    setLoading(true);
    try {
      await apiClient.post(`/requests/${request.id}/convert`, { estimatedCost: total }, getApiOptions());
      onQuoted();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      alert("No se pudo cotizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-srf-surface border-srf-primary/40">
        <div className="w-full rounded-xl border border-srf-primary/30 bg-srf-bg p-5">
          <DialogHeader>
            <DialogTitle>Cotizar {request?.folio}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input type="number" value={total} onChange={(e) => setTotal(Number(e.target.value))} placeholder="Total estimado" />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={loading}>{loading ? "Guardando..." : "Cotizar"}</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

