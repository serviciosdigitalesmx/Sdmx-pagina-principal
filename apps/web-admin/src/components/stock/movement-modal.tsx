"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { getApiOptions } from "@/lib/tenant";
import type { Product } from "@/types";

export function MovementModal({ open, onOpenChange, product, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; product: Product | null; onSaved: () => void }) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const handleSubmit = async () => {
    if (!product) return;
    try {
      await apiClient.post(`/inventory/${product.id}/movements`, { quantity, note }, getApiOptions());
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar el movimiento");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-srf-surface border-srf-primary/40">
        <div className="w-full rounded-xl border border-srf-primary/30 bg-srf-bg p-5">
          <DialogHeader><DialogTitle>Movimiento de stock</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Cantidad</Label><Input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /></div>
            <div><Label>Nota</Label><Input value={note} onChange={(e) => setNote(e.target.value)} /></div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSubmit}>Guardar</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

