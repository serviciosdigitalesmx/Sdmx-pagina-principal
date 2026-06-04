"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { getApiOptions } from "@/lib/tenant";
import type { Sucursal } from "@/types";

export function SucursalModal({ open, onOpenChange, sucursal, onSucursalSaved }: { open: boolean; onOpenChange: (open: boolean) => void; sucursal: Sucursal | null; onSucursalSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "", address: "", city: "", state: "", phone: "" });
  useEffect(() => {
    setFormData(sucursal ? { name: sucursal.name, code: sucursal.code || "", address: sucursal.address || "", city: sucursal.city || "", state: sucursal.state || "", phone: sucursal.phone || "" } : { name: "", code: "", address: "", city: "", state: "", phone: "" });
  }, [sucursal, open]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (sucursal) {
        await apiClient.put(`/sucursales/${sucursal.id}`, formData, getApiOptions());
      } else {
        await apiClient.post("/sucursales", formData, getApiOptions());
      }
      onSucursalSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar la sucursal");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-srf-surface border-srf-primary/40">
        <div className="w-full rounded-xl border border-srf-primary/30 bg-srf-bg p-5">
          <DialogHeader><DialogTitle>{sucursal ? "Editar sucursal" : "Nueva sucursal"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Label>Nombre</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><Label>Código</Label><Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} /></div>
            <div><Label>Dirección</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
            <div><Label>Ciudad</Label><Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></div>
            <div><Label>Estado</Label><Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} /></div>
            <div><Label>Teléfono</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
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

