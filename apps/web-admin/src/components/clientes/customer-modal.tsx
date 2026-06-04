"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { getApiOptions } from "@/lib/tenant";
import type { Customer } from "@/types";

export function CustomerModal({ open, onOpenChange, customer, onCustomerSaved }: { open: boolean; onOpenChange: (open: boolean) => void; customer: Customer | null; onCustomerSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });

  useEffect(() => {
    setFormData(customer ? { name: customer.name, phone: customer.phone, email: customer.email || "" } : { name: "", phone: "", email: "" });
  }, [customer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert("Nombre y teléfono son requeridos");
      return;
    }
    setLoading(true);
    try {
      if (customer) {
        await apiClient.patch(`/customers/${customer.id}`, formData, getApiOptions());
      } else {
        await apiClient.post("/customers", formData, getApiOptions());
      }
      onCustomerSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save customer:", error);
      alert("No se pudo guardar el cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-srf-surface border-srf-primary/40">
        <div className="w-full rounded-xl border border-srf-primary/30 bg-srf-bg p-5">
          <DialogHeader>
            <DialogTitle>{customer ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

