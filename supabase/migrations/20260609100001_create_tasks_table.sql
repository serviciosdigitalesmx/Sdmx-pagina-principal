CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    sucursal_id UUID REFERENCES public.sucursales(id) ON DELETE CASCADE,
    service_order_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE,
    service_request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pendiente',
    priority TEXT NOT NULL DEFAULT 'media',
    assigned_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    comment TEXT,
    changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies for tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in their tenant" ON public.tasks FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "Users can insert tasks in their tenant" ON public.tasks FOR INSERT WITH CHECK (tenant_id = auth.uid());
CREATE POLICY "Users can update tasks in their tenant" ON public.tasks FOR UPDATE USING (tenant_id = auth.uid());
CREATE POLICY "Users can delete tasks in their tenant" ON public.tasks FOR DELETE USING (tenant_id = auth.uid());

CREATE POLICY "Users can view task_history in their tenant" ON public.task_history FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "Users can insert task_history in their tenant" ON public.task_history FOR INSERT WITH CHECK (tenant_id = auth.uid());
