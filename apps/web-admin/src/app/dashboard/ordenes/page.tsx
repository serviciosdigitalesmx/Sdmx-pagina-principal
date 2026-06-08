'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, Filter, Grid2X2, List, Clock3, MessageSquare, Eye, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fixService } from '@/services/fixService';
import type { Order } from '@/types';
import { OrderCard } from '@/components/tecnico/order-card';
import { OrderModal } from '@/components/tecnico/order-modal';
import { LoadingState, ErrorState } from '@/components/base/states';
import { EmptyState, MoneyCard } from '@/components/base/cards';
import { StatusBadge } from '@/components/base/badges';
import { Button } from '@/components/ui/button';

type ViewMode = 'kanban' | 'list';

const STATUS_ORDER = [
  'recibido',
  'diagnostico',
  'cotizado',
  'en_espera_de_refaccion',
  'reparacion',
  'listo_para_entrega',
  'listo',
  'entregado',
  'cancelado',
];

const STATUS_LABELS: Record<string, string> = {
  recibido: 'Recibido',
  diagnostico: 'Diagnóstico',
  cotizado: 'Cotizado',
  en_espera_de_refaccion: 'En espera de refacción',
  reparacion: 'Reparación',
  listo_para_entrega: 'Listo para entrega',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

const STATUS_TONES: Record<string, 'primary' | 'warning' | 'success' | 'danger' | 'neutral'> = {
  recibido: 'primary',
  diagnostico: 'warning',
  cotizado: 'warning',
  en_espera_de_refaccion: 'warning',
  reparacion: 'primary',
  listo_para_entrega: 'success',
  listo: 'success',
  entregado: 'neutral',
  cancelado: 'danger',
};

function normalizeOrderStatus(status: string) {
  return String(status || '').toLowerCase().trim();
}

function getCustomerLabel(order: Order) {
  return order.device_info?.customer_name?.trim() || 'Cliente sin nombre';
}

function getDeviceLabel(order: Order) {
  const type = order.device_info?.type?.trim() || '';
  const model = order.device_info?.model?.trim() || '';
  return [type, model].filter(Boolean).join(' ') || 'Equipo sin especificar';
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Number(value ?? 0) || 0);
}

function formatDate(value: string | null) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function getRiskTone(order: Order) {
  const color = order.color ?? 'gris';
  if (color === 'rojo') return 'danger';
  if (color === 'amarillo') return 'warning';
  if (color === 'verde') return 'success';
  return 'neutral';
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  async function loadOrders(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    try {
      setError(null);
      const rows = await fixService.getOrders();
      setOrders(rows as unknown as Order[]);
    } catch (loadError) {
      setOrders([]);
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las órdenes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  const visibleOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const status = normalizeOrderStatus(order.status);
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (!term) return true;
      const haystack = [
        order.folio,
        order.problem_description,
        order.device_info?.customer_name,
        order.device_info?.customer_phone,
        order.device_info?.customer_email,
        order.device_info?.type,
        order.device_info?.model,
        order.assigned_user_id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [orders, search, statusFilter]);

  const groupedOrders = useMemo(() => {
    const groups = new Map<string, Order[]>();
    for (const order of visibleOrders) {
      const status = normalizeOrderStatus(order.status) || 'recibido';
      if (!groups.has(status)) groups.set(status, []);
      groups.get(status)?.push(order);
    }

    for (const order of visibleOrders) {
      const status = normalizeOrderStatus(order.status) || 'recibido';
      if (!STATUS_ORDER.includes(status) && !groups.has('otros')) {
        groups.set('otros', []);
      }
      if (!STATUS_ORDER.includes(status)) {
        groups.get('otros')?.push(order);
      }
    }

    return groups;
  }, [visibleOrders]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const order of orders) {
      const status = normalizeOrderStatus(order.status) || 'recibido';
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  }, [orders]);

  const totalBalance = useMemo(() => orders.reduce((sum, order) => sum + Number(order.final_cost || order.estimated_cost || 0), 0), [orders]);
  const activeCount = useMemo(
    () => orders.filter((order) => !['entregado', 'cancelado'].includes(normalizeOrderStatus(order.status))).length,
    [orders],
  );

  const orderedStatusKeys = useMemo(() => {
    const present = new Set(visibleOrders.map((order) => normalizeOrderStatus(order.status) || 'recibido'));
    return [
      ...STATUS_ORDER.filter((status) => present.has(status)),
      ...Array.from(present).filter((status) => !STATUS_ORDER.includes(status)),
    ];
  }, [visibleOrders]);

  function openDetail(order: Order) {
    setSelectedOrder(order);
    setDetailOpen(true);
  }

  if (loading) {
    return <LoadingState label="Cargando órdenes reales..." />;
  }

  if (error && orders.length === 0) {
    return (
      <ErrorState
        message={error}
        action={
          <Button variant="outline" onClick={() => void loadOrders(true)} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        <MoneyCard label="Órdenes activas" value={String(activeCount)} helper="No entregadas o canceladas" />
        <MoneyCard label="Órdenes visibles" value={String(visibleOrders.length)} helper="Filtradas en la vista actual" />
        <MoneyCard label="Estados activos" value={String(orderedStatusKeys.length)} helper="Estados reales detectados" />
        <MoneyCard label="Valor estimado" value={formatMoney(totalBalance)} helper="Suma de coste estimado/final" accent />
      </div>

      <div className="card-base space-y-4 p-4 lg:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-srf-text">Órdenes</h1>
            <p className="mt-1 text-sm text-srf-muted">Lista, búsqueda, kanban y detalle con API real.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void loadOrders(true)} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button variant="outline" onClick={() => setViewMode((current) => (current === 'kanban' ? 'list' : 'kanban'))} className="gap-2">
              {viewMode === 'kanban' ? <List className="h-4 w-4" /> : <Grid2X2 className="h-4 w-4" />}
              {viewMode === 'kanban' ? 'Ver lista' : 'Ver kanban'}
            </Button>
            <Button onClick={() => router.push('/dashboard/operativo')} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva orden
            </Button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_260px_200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-srf-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar folio, cliente, equipo o teléfono..."
              className="input pl-9"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-srf-muted" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input pl-9">
              <option value="all">Todos los estados</option>
              {orderedStatusKeys.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status] ?? status}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-xs text-srf-muted">
            <div className="flex items-center gap-2 font-semibold text-srf-text">
              <Clock3 className="h-4 w-4 text-srf-primary" />
              Estados reales
            </div>
            <div className="mt-1">Se muestran solo estados detectados en los datos.</div>
          </div>
        </div>

        {error ? <ErrorState message={error} /> : null}
      </div>

      {visibleOrders.length === 0 ? (
        <EmptyState
          title="No hay órdenes para mostrar"
          description="No encontramos órdenes con los filtros actuales. Ajusta la búsqueda o revisa si la API respondió sin datos."
          action={
            <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter('all'); }} className="gap-2">
              Limpiar filtros
            </Button>
          }
        />
      ) : null}

      {viewMode === 'kanban' ? (
        <div className="space-y-4">
          {orderedStatusKeys.map((status) => {
            const items = groupedOrders.get(status) ?? [];
            if (items.length === 0) return null;
            return (
              <section key={status} className="card-base p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge tone={STATUS_TONES[status] ?? 'neutral'}>{STATUS_LABELS[status] ?? status}</StatusBadge>
                    <span className="text-xs text-srf-muted">{items.length} órdenes</span>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                  {items.map((order) => (
                    <div key={order.id} className="relative">
                      <OrderCard order={order} onClick={() => openDetail(order)} />
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => openDetail(order)} className="gap-2">
                          <Eye className="h-4 w-4" />
                          Detalle
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/operativo?order=${encodeURIComponent(order.id)}`)}
                          className="gap-2"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Operativo
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {visibleOrders.map((order) => (
            <div key={order.id} className="space-y-2">
              <OrderCard order={order} onClick={() => openDetail(order)} />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => openDetail(order)} className="gap-2">
                  <Eye className="h-4 w-4" />
                  Abrir
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/dashboard/operativo?order=${encodeURIComponent(order.id)}`)}
                  className="gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Operativo
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder ? (
        <OrderModal
          open={detailOpen}
          onOpenChange={setDetailOpen}
          order={selectedOrder}
          onOrderUpdated={() => void loadOrders(true)}
        />
      ) : null}
    </div>
  );
}
