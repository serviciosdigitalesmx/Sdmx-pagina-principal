'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Plus, Search, RefreshCw, Edit2, Trash2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { getApiOptions } from '@/lib/tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskModal } from '@/components/tareas/task-modal';
import type { Task } from '@/types';

type TaskStatus = 'pendiente' | 'en_proceso' | 'bloqueada' | 'hecha';
type TaskPriority = 'baja' | 'media' | 'alta';

const statusLabels: Record<TaskStatus, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-400' },
  en_proceso: { label: 'En proceso', color: 'bg-blue-500/20 text-blue-400' },
  bloqueada: { label: 'Bloqueada', color: 'bg-red-500/20 text-red-400' },
  hecha: { label: 'Hecha', color: 'bg-green-500/20 text-green-400' },
};

const priorityLabels: Record<TaskPriority, { label: string; icon: ReactNode }> = {
  baja: { label: 'Baja', icon: <span className="text-green-500">●</span> },
  media: { label: 'Media', icon: <span className="text-yellow-500">●</span> },
  alta: { label: 'Alta', icon: <span className="text-red-500">●</span> },
};

export default function TareasPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'todas'>('todas');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ data: Task[] }>('/tasks', getApiOptions());
      setTasks(data.data || []);
      setFilteredTasks(data.data || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
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
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          (t.description && t.description.toLowerCase().includes(term))
      );
    }

    if (statusFilter !== 'todas') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Ordenar: urgentes primero, luego por fecha
    filtered.sort((a, b) => {
      const priorityOrder = { alta: 3, media: 2, baja: 1 };
      const priorityDiff = (priorityOrder[b.priority as TaskPriority] || 0) - (priorityOrder[a.priority as TaskPriority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
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
      console.error('Failed to delete task:', error);
      alert('No se pudo eliminar la tarea');
    }
  };

  const getKPI = () => {
    const pendientes = tasks.filter((t) => t.status === 'pendiente' || t.status === 'en_proceso').length;
    const urgentes = tasks.filter((t) => t.priority === 'alta' && t.status !== 'hecha').length;
    const completadas = tasks.filter((t) => t.status === 'hecha').length;
    return { pendientes, urgentes, completadas };
  };

  const kpi = getKPI();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Tareas</h1>
          <p className="text-srf-muted text-sm mt-1">
            {kpi.pendientes} pendientes · {kpi.urgentes} urgentes · {kpi.completadas} completadas
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedTask(null);
            setModalOpen(true);
          }}
          className="btn-primary gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva tarea
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{kpi.pendientes}</div>
          <div className="text-xs text-yellow-300">Pendientes / En proceso</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{kpi.urgentes}</div>
          <div className="text-xs text-red-300">Urgentes</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{kpi.completadas}</div>
          <div className="text-xs text-green-300">Completadas</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-srf-muted" />
          <Input
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'todas')}
          className="input w-40"
        >
          <option value="todas">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_proceso">En proceso</option>
          <option value="bloqueada">Bloqueada</option>
          <option value="hecha">Hecha</option>
        </select>
        <Button
          onClick={() => loadTasks()}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      {/* Tasks grid */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-srf-muted">No hay tareas con esos filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {priorityLabels[task.priority as TaskPriority]?.icon}
                    <span className="text-xs text-srf-muted">
                      {priorityLabels[task.priority as TaskPriority]?.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusLabels[task.status as TaskStatus]?.color}`}>
                      {statusLabels[task.status as TaskStatus]?.label}
                    </span>
                  </div>
                  <h3 className="font-semibold mt-1">{task.title}</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setModalOpen(true);
                    }}
                    className="p-1 rounded hover:bg-srf-primary/20 text-srf-primary"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(task)}
                    className="p-1 rounded hover:bg-red-500/20 text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {task.description && (
                <p className="text-sm text-srf-muted line-clamp-2">{task.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-srf-muted pt-2 border-t border-srf-primary/20">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Vence: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Sin fecha'}</span>
                </div>
                {task.assigned_user_id && (
                  <div className="flex items-center gap-1">
                    <span>Asignada</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        task={selectedTask}
        onTaskSaved={() => loadTasks()}
      />
    </div>
  );
}
