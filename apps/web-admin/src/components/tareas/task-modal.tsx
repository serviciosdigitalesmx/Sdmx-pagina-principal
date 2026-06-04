"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { getApiOptions } from "@/lib/tenant";
import type { Task } from "@/types";

export function TaskModal({ open, onOpenChange, task, onTaskSaved }: { open: boolean; onOpenChange: (open: boolean) => void; task: Task | null; onTaskSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", status: "pendiente", priority: "media" });

  useEffect(() => {
    setFormData(task ? { title: task.title, description: task.description || "", status: task.status, priority: task.priority } : { title: "", description: "", status: "pendiente", priority: "media" });
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (task) {
        await apiClient.put(`/tasks/${task.id}`, formData, getApiOptions());
      } else {
        await apiClient.post("/tasks", formData, getApiOptions());
      }
      onTaskSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar la tarea");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-srf-surface border-srf-primary/40">
        <div className="w-full rounded-xl border border-srf-primary/30 bg-srf-bg p-5">
          <DialogHeader><DialogTitle>{task ? "Editar tarea" : "Nueva tarea"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Título" /></div>
            <div><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción" /></div>
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

