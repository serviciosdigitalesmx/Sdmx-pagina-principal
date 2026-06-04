"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { getApiOptions } from "@/lib/tenant";
import type { Order, OrderChecklist, OrderDocument, OrderEvent } from "@/types";

export function OrderModal({ open, onOpenChange, order, onOrderUpdated }: { open: boolean; onOpenChange: (open: boolean) => void; order: Order | null; onOrderUpdated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [costo, setCosto] = useState("");
  const [estado, setEstado] = useState("");
  const [notas, setNotas] = useState("");
  useEffect(() => {
    if (order) {
      setCosto(String(order.estimated_cost ?? 0));
      setEstado(order.status || "recibido");
      setNotas(order.internal_notes || "");
    }
  }, [order, open]);
  const handleSave = async () => {
    if (!order) return;
    setLoading(true);
    try {
      await apiClient.patch(`/orders/${order.id}/details`, { metadata: { internal_notes: notas } }, getApiOptions());
      await apiClient.patch(`/orders/${order.id}/financials`, { estimatedCost: Number(costo) }, getApiOptions());
      if (estado !== order.status) {
        await apiClient.patch(`/orders/${order.id}/status`, { status: estado, note: `Estado cambiado a ${estado}` }, getApiOptions());
      }
      onOrderUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar la orden");
    } finally {
      setLoading(false);
    }
  };
  if (!order) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto bg-srf-surface border-srf-primary/40">
        <div className="w-full rounded-xl border border-srf-primary/30 bg-srf-bg p-5">
          <DialogHeader><DialogTitle>Orden {order.folio}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={estado} onChange={(e) => setEstado(e.target.value)} />
            <Input value={costo} onChange={(e) => setCosto(e.target.value)} />
            <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

