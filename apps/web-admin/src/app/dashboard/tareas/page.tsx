"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw, Edit2, Trash2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { getApiOptions } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskModal } from "@/components/tareas/task-modal";
import type { Task } from "@/types";

type TaskStatus = "pendiente" | "en_proceso" | "bloqueada" | "hecha";

const statusLabels: Record<TaskStatus, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "bg-yellow-500/20 text-yellow-400" },
  en_proceso: { label: "En proceso", color: "bg-blue-500/20 text-blue-400" },
  bloqueada: { label: "Bloqueada", color: "bg-red-500/20 text-red-400" },
  hecha: { label: "Hecha", color: "bg-green-500/20 text-green-400" },
};

export default function TareasPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "todas">("todas");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ data: Task[] }>("/tasks", getApiOptions());
      setTasks(data.data || []);
      setFilteredTasks(data.data || []);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    let filtered = [...tasks];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((t) => t.title.toLowerCase().includes(term) || (t.description && t.description.toLowerCase().includes(term)));
    }
    if (statusFilter !== "todas") filtered = filtered.filter((t) => t.status === statusFilter);
    filtered.sort((a, b) => {
      const priorityOrder = { alta: 3, media: 2, baja: 1 } as const;
      const diff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      if (diff !== 0) return diff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setFilteredTasks(filtered);
  }, [searchTerm, statusFilter, tasks]);

  const handleDelete = async (task: Task) => {
    if (!confirm(`¿Eliminar la tarea "${task.title}"?`)) return;
    try {
      await apiClient.delete(`/tasks/${task.id}`, getApiOptions());
      loadTasks();
    } catch (error) {
      console.error("Failed to delete task:", error);
      alert("No se pudo eliminar la tarea");
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="spinner h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Tareas</h1>
          <p className="mt-1 text-sm text-srf-muted">{filteredTasks.length} tareas visibles</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => loadTasks()} variant="outline" className="gap-2"><RefreshCw className="h-4 w-4" /> Actualizar</Button>
          <Button onClick={() => { setSelectedTask(null); setModalOpen(true); }} className="btn-primary gap-2"><Plus className="h-4 w-4" /> Nueva tarea</Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Input placeholder="Buscar tarea..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "todas")} className="input w-48">
          <option value="todas">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_proceso">En proceso</option>
          <option value="bloqueada">Bloqueada</option>
          <option value="hecha">Hecha</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredTasks.map((task) => (
          <div key={task.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-srf-primary">{task.title}</p>
                <p className="text-sm text-srf-muted">{task.description || "Sin descripción"}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusLabels[task.status as TaskStatus]?.color || "bg-slate-500/20 text-slate-300"}`}>{statusLabels[task.status as TaskStatus]?.label || task.status}</span>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-srf-muted pt-2 border-t border-srf-primary/20">
              <span>{task.priority}</span>
              <div className="flex gap-2">
                <button onClick={() => { setSelectedTask(task); setModalOpen(true); }} className="rounded p-1 text-srf-primary hover:bg-srf-primary/20"><Edit2 className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(task)} className="rounded p-1 text-red-400 hover:bg-red-500/20"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 ? <div className="py-12 text-center"><p className="text-srf-muted">No hay tareas con esos filtros</p></div> : null}

      <TaskModal open={modalOpen} onOpenChange={setModalOpen} task={selectedTask} onTaskSaved={() => loadTasks()} />
    </div>
  );
}

