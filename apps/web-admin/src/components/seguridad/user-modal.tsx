"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { getApiOptions, getActiveSucursalId } from "@/lib/tenant";
import type { SecurityUser } from "@/types";

export function UserModal({ open, onOpenChange, user, onUserSaved }: { open: boolean; onOpenChange: (open: boolean) => void; user: SecurityUser | null; onUserSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", role: "technician", password: "", notas: "", activo: true });

  useEffect(() => {
    setFormData(user ? { name: user.name, email: user.email, role: user.role, password: "", notas: "", activo: user.activo } : { name: "", email: "", role: "technician", password: "", notas: "", activo: true });
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      alert("Nombre y email son requeridos");
      return;
    }
    if (!user && !formData.password.trim()) {
      alert("La contraseña es requerida para nuevos usuarios");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...formData, password: formData.password || undefined, notas: formData.notas || null, sucursalId: getActiveSucursalId() };
      if (user) {
        await apiClient.patch(`/users/${user.id}`, payload, getApiOptions());
      } else {
        await apiClient.post("/users", payload, getApiOptions());
      }
      onUserSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar el usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-srf-surface border-srf-primary/40">
        <div className="w-full rounded-xl border border-srf-primary/30 bg-srf-bg p-5">
          <DialogHeader><DialogTitle>{user ? "Editar usuario" : "Nuevo usuario"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Label>Nombre</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            <div><Label>Role</Label><Input value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} /></div>
            <div><Label>Contraseña</Label><Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></div>
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

