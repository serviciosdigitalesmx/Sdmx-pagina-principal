import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getTenantClient, supabaseAdmin } from '@white-label/database';

type TaskStatusOption = { key?: string; label?: string; tone?: string };

const taskBaseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().or(z.literal('')),
  status: z.string().optional().or(z.literal('')),
  priority: z.string().optional().or(z.literal('')),
  branchId: z.string().optional().or(z.literal('')),
  serviceOrderId: z.string().optional().or(z.literal('')),
  serviceRequestId: z.string().optional().or(z.literal('')),
  assignedUserId: z.string().optional().or(z.literal('')),
  dueDate: z.string().datetime().optional().or(z.literal('')),
});

const taskStatusSchema = z.object({
  status: z.string().min(1),
  note: z.string().optional().or(z.literal('')),
});

const taskHistorySchema = z.object({
  note: z.string().min(1),
});

async function getTaskStatuses(tenantId: string) {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('operational_settings')
    .eq('id', tenantId)
    .single();

  if (error || !data) {
    return [
      { key: 'pendiente', label: 'Pendiente', tone: 'gray' },
      { key: 'en_proceso', label: 'En proceso', tone: 'amber' },
      { key: 'bloqueada', label: 'Bloqueada', tone: 'red' },
      { key: 'hecha', label: 'Hecha', tone: 'emerald' },
    ];
  }

  const settings = data.operational_settings as { taskStatuses?: TaskStatusOption[] } | null;
  const statuses = settings?.taskStatuses?.filter((item) => typeof item?.key === 'string' && item.key.trim().length > 0) ?? [];
  if (statuses.length > 0) {
    return statuses.map((status) => ({
      key: String(status.key),
      label: String(status.label ?? status.key),
      tone: String(status.tone ?? 'gray'),
    }));
  }

  return [
    { key: 'pendiente', label: 'Pendiente', tone: 'gray' },
    { key: 'en_proceso', label: 'En proceso', tone: 'amber' },
    { key: 'bloqueada', label: 'Bloqueada', tone: 'red' },
    { key: 'hecha', label: 'Hecha', tone: 'emerald' },
  ];
}

async function ensureTaskOwnership(supabase: ReturnType<typeof getTenantClient>, tenantId: string, taskId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('id', taskId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function insertTaskHistory(supabase: ReturnType<typeof getTenantClient>, row: {
  tenant_id: string;
  task_id: string;
  event_type: string;
  comment?: string | null;
  changed_by?: string | null;
}) {
  const { error } = await supabase.from('task_history').insert([{
    id: randomUUID(),
    tenant_id: row.tenant_id,
    task_id: row.task_id,
    event_type: row.event_type,
    comment: row.comment ?? null,
    changed_by: row.changed_by ?? null,
  }]);

  if (error) {
    throw error;
  }
}

export const listTasks = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const branchId = typeof req.query.branchId === 'string' ? req.query.branchId.trim() : '';
    const supabase = getTenantClient(tenantId);
    let query = supabase.from('tasks').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(100);
    if (branchId) {
      query = query.eq('branch_id', branchId);
    } else if (req.user?.role === 'manager' && req.user.sucursalId) {
      query = query.eq('branch_id', req.user.sucursalId);
    }
    const { data, error } = await query;
    if (error) return res.status(502).json({ error: 'Failed to fetch tasks', details: error.message });
    return res.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error('Error listing tasks:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const taskId = req.params.id;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const supabase = getTenantClient(tenantId);
    const [taskResult, historyResult] = await Promise.all([
      supabase.from('tasks').select('*').eq('tenant_id', tenantId).eq('id', taskId).maybeSingle(),
      supabase.from('task_history').select('*').eq('tenant_id', tenantId).eq('task_id', taskId).order('created_at', { ascending: false }),
    ]);
    if (taskResult.error) return res.status(502).json({ error: 'Failed to fetch task', details: taskResult.error.message });
    if (!taskResult.data) return res.status(404).json({ error: 'Task not found' });
    if (historyResult.error) return res.status(502).json({ error: 'Failed to fetch task history', details: historyResult.error.message });
    return res.json({ success: true, data: { task: taskResult.data, history: historyResult.data ?? [], statuses: await getTaskStatuses(tenantId) } });
  } catch (error) {
    console.error('Error getting task:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const body = taskBaseSchema.parse(req.body);
    const supabase = getTenantClient(tenantId);
    const allowedStatuses = new Set((await getTaskStatuses(tenantId)).map((item) => String(item.key ?? '')));
    const nextStatus = body.status?.trim() || 'pendiente';
    if (!allowedStatuses.has(nextStatus)) {
      return res.status(400).json({ error: 'Invalid status', details: { allowedStatuses: [...allowedStatuses] } });
    }

    const { data, error } = await supabase.from('tasks').insert([{
      tenant_id: tenantId,
      branch_id: body.branchId || null,
      service_order_id: body.serviceOrderId || null,
      service_request_id: body.serviceRequestId || null,
      title: body.title,
      description: body.description || null,
      status: nextStatus,
      priority: body.priority || 'media',
      assigned_user_id: body.assignedUserId || null,
      due_date: body.dueDate || null,
      created_by: null,
      updated_by: null,
    }]).select('*').single();

    if (error || !data) {
      return res.status(502).json({ error: 'Failed to create task', details: error?.message ?? 'Unknown error' });
    }

    await insertTaskHistory(supabase, {
      tenant_id: tenantId,
      task_id: data.id,
      event_type: 'created',
      comment: body.description || body.title,
      changed_by: null,
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error creating task:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const taskId = req.params.id;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const body = taskBaseSchema.partial().parse(req.body);
    const supabase = getTenantClient(tenantId);
    if (!(await ensureTaskOwnership(supabase, tenantId, taskId))) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const payload: Record<string, unknown> = {};
    if (body.title !== undefined) payload.title = body.title;
    if (body.description !== undefined) payload.description = body.description || null;
    if (body.branchId !== undefined) payload.branch_id = body.branchId || null;
    if (body.serviceOrderId !== undefined) payload.service_order_id = body.serviceOrderId || null;
    if (body.serviceRequestId !== undefined) payload.service_request_id = body.serviceRequestId || null;
    if (body.priority !== undefined) payload.priority = body.priority || 'media';
    if (body.assignedUserId !== undefined) payload.assigned_user_id = body.assignedUserId || null;
    if (body.dueDate !== undefined) payload.due_date = body.dueDate || null;
    payload.updated_by = null;

    const { data, error } = await supabase.from('tasks').update(payload).eq('tenant_id', tenantId).eq('id', taskId).select('*').single();
    if (error || !data) {
      return res.status(502).json({ error: 'Failed to update task', details: error?.message ?? 'Unknown error' });
    }
    await insertTaskHistory(supabase, { tenant_id: tenantId, task_id: taskId, event_type: 'updated', comment: body.description || body.title || null, changed_by: null });
    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error updating task:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const taskId = req.params.id;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const body = taskStatusSchema.parse(req.body);
    const supabase = getTenantClient(tenantId);
    if (!(await ensureTaskOwnership(supabase, tenantId, taskId))) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const allowedStatuses = new Set((await getTaskStatuses(tenantId)).map((item) => String(item.key ?? '')));
    if (!allowedStatuses.has(body.status)) {
      return res.status(400).json({ error: 'Invalid status', details: { allowedStatuses: [...allowedStatuses] } });
    }

    const { data: current, error: currentError } = await supabase.from('tasks').select('status').eq('tenant_id', tenantId).eq('id', taskId).single();
    if (currentError || !current) {
      return res.status(404).json({ error: 'Task not found', details: currentError?.message ?? 'Not found' });
    }

    const { data, error } = await supabase.from('tasks').update({ status: body.status, updated_by: null }).eq('tenant_id', tenantId).eq('id', taskId).select('*').single();
    if (error || !data) {
      return res.status(502).json({ error: 'Failed to update task status', details: error?.message ?? 'Unknown error' });
    }

    await insertTaskHistory(supabase, {
      tenant_id: tenantId,
      task_id: taskId,
      event_type: 'status_changed',
      comment: body.note || null,
      changed_by: null,
    });

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error updating task status:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const taskId = req.params.id;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const supabase = getTenantClient(tenantId);
    if (!(await ensureTaskOwnership(supabase, tenantId, taskId))) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const { error } = await supabase.from('tasks').delete().eq('tenant_id', tenantId).eq('id', taskId);
    if (error) {
      return res.status(502).json({ error: 'Failed to delete task', details: error.message });
    }
    await insertTaskHistory(supabase, { tenant_id: tenantId, task_id: taskId, event_type: 'deleted', comment: null, changed_by: null }).catch(() => null);
    return res.json({ success: true, data: { id: taskId, deleted: true } });
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getTaskHistory = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const taskId = req.params.id;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const supabase = getTenantClient(tenantId);
    const { data, error } = await supabase
      .from('task_history')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
    if (error) {
      return res.status(502).json({ error: 'Failed to fetch task history', details: error.message });
    }
    return res.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error('Error getting task history:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
