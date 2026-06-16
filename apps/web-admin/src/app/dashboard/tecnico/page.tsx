'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, RefreshCw, Eye } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { getApiOptions } from '@/lib/tenant';
import { OrderCard } from '@/components/tecnico/order-card';
import { OrderModal } from '@/components/tecnico/order-modal';
import type { Order } from '@/types';

type FilterColor = 'todos' | 'rojo' | 'amarillo' | 'verde';
type FilterStatus = 'todos' | 'recibido' | 'diagnostico' | 'reparacion' | 'listo' | 'entregado';
type SortOrder = 'dias_asc' | 'dias_desc' | 'folio_asc' | 'folio_desc';

interface KPI {
  urgentes: number;
  atencion: number;
  aTiempo: number;
  total: number;
}

export default function TecnicoPage() {
  const searchParams = useSearchParams();
  const orderIdFromUrl = searchParams.get('order');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [kpis, setKpis] = useState<KPI>({ urgentes: 0, atencion: 0, aTiempo: 0, total: 0 });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColor, setFilterColor] = useState<FilterColor>('todos');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [sortOrder, setSortOrder] = useState<SortOrder>('dias_asc');

  const loadOrders = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const data = await apiClient.get<{ data: Order[] }>('/orders', getApiOptions());
      const ordersList = data.data || [];

      // Calcular días restantes y color si no vienen del backend
      const enrichedOrders = ordersList.map((order) => {
        let diasRestantes = order.diasRestantes;
        let color = order.color;

        if (diasRestantes === undefined && order.promised_date) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const promise = new Date(order.promised_date);
          promise.setHours(0, 0, 0, 0);
          diasRestantes = Math.ceil((promise.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        }

        if (order.operational_risk) {
          color = order.operational_risk.color === 'red' ? 'rojo' : order.operational_risk.color === 'yellow' ? 'amarillo' : order.operational_risk.color === 'green' ? 'verde' : 'gris';
        }

        if (!color) {
          if (order.status === 'entregado') color = 'gris';
          else if (diasRestantes !== undefined && diasRestantes <= 2) color = 'rojo';
          else if (diasRestantes !== undefined && diasRestantes <= 4) color = 'amarillo';
          else color = 'verde';
        }

        return { ...order, diasRestantes, color };
      });

      setOrders(enrichedOrders);
      applyFilters(enrichedOrders, searchTerm, filterColor, filterStatus, sortOrder);

      // Calcular KPIs
      const activeOrders = enrichedOrders.filter((o) => o.status !== 'entregado');
      const urgentes = activeOrders.filter((o) => o.color === 'rojo').length;
      const atencion = activeOrders.filter((o) => o.color === 'amarillo').length;
      const aTiempo = activeOrders.filter((o) => o.color === 'verde').length;

      setKpis({ urgentes, atencion, aTiempo, total: activeOrders.length });
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
      if (showRefresh) setRefreshing(false);
    }
  };

  const applyFilters = (
    ordersList: Order[],
    search: string,
    color: FilterColor,
    status: FilterStatus,
    sort: SortOrder
  ) => {
    let filtered = [...ordersList];

    // Búsqueda
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.folio?.toLowerCase().includes(term) ||
          o.customers?.name?.toLowerCase().includes(term) ||
          o.device_info?.customer_name?.toLowerCase().includes(term) ||
          o.device_info?.type?.toLowerCase().includes(term) ||
          o.device_info?.model?.toLowerCase().includes(term)
      );
    }

    // Filtro por color
    if (color !== 'todos') {
      filtered = filtered.filter((o) => o.color === color);
    }

    // Filtro por estado
    if (status !== 'todos') {
      filtered = filtered.filter((o) => o.status === status);
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (sort) {
        case 'dias_asc':
          return (a.diasRestantes ?? 999) - (b.diasRestantes ?? 999);
        case 'dias_desc':
          return (b.diasRestantes ?? -999) - (a.diasRestantes ?? -999);
        case 'folio_asc':
          return (a.folio || '').localeCompare(b.folio || '');
        case 'folio_desc':
          return (b.folio || '').localeCompare(a.folio || '');
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  };

  const handleFilterChange = useCallback(() => {
    applyFilters(orders, searchTerm, filterColor, filterStatus, sortOrder);
  }, [orders, searchTerm, filterColor, filterStatus, sortOrder]);

  useEffect(() => {
    handleFilterChange();
  }, [handleFilterChange]);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (orderIdFromUrl && orders.length > 0) {
      const order = orders.find((o) => o.id === orderIdFromUrl || o.folio === orderIdFromUrl);
      if (order) {
        setSelectedOrder(order);
        setModalOpen(true);
      }
    }
  }, [orderIdFromUrl, orders]);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleOrderUpdated = () => {
    loadOrders();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500/25 border-t-sky-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-sky-400/70">Operación técnica</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-50">Panel Técnico</h1>
        <p className="mt-1 text-sm text-slate-400">Seguimiento y gestión de órdenes activas</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPIBox label="Críticos (≤2 días)" value={kpis.urgentes} color="red" />
        <KPIBox label="Atención (3-4 días)" value={kpis.atencion} color="yellow" />
        <KPIBox label="A tiempo (≥5 días)" value={kpis.aTiempo} color="green" />
        <KPIBox label="Total en taller" value={kpis.total} color="blue" />
      </div>

      {/* Toolbar */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 shadow-[0_24px_70px_rgba(2,6,23,0.32)]">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por folio, cliente o equipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full pl-9"
            />
          </div>

          {/* Filter by color */}
          <select
            value={filterColor}
            onChange={(e) => setFilterColor(e.target.value as FilterColor)}
            className="input"
          >
            <option value="todos">Todos los colores</option>
            <option value="rojo">🔴 Urgente</option>
            <option value="amarillo">🟡 Atención</option>
            <option value="verde">🟢 A tiempo</option>
          </select>

          {/* Filter by status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="input"
          >
            <option value="todos">Todos los estados</option>
            <option value="recibido">📦 Recibido</option>
            <option value="diagnostico">🔍 Diagnóstico</option>
            <option value="reparacion">🔧 Reparación</option>
            <option value="listo">✅ Listo</option>
            <option value="entregado">📦 Entregado</option>
          </select>

          {/* Sort */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="input"
          >
            <option value="dias_asc">Días (menor primero)</option>
            <option value="dias_desc">Días (mayor primero)</option>
            <option value="folio_asc">Folio A-Z</option>
            <option value="folio_desc">Folio Z-A</option>
          </select>

          {/* Refresh button */}
          <button
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            className="btn-secondary px-4 py-2"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Last update time */}
        <div className="mt-3 text-right text-xs text-slate-400">
          Última actualización: {new Date().toLocaleTimeString()}
          {refreshing && <span className="ml-2 text-sky-400">Actualizando...</span>}
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">No hay órdenes con esos filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => handleOrderClick(order)}
            />
          ))}
        </div>
      )}

      {/* Order Modal */}
      <OrderModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        order={selectedOrder}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  );
}

function KPIBox({ label, value, color }: { label: string; value: number; color: 'red' | 'yellow' | 'green' | 'blue' }) {
  const colorClasses = {
    red: 'border-red-500/30 bg-red-500/10',
    yellow: 'border-yellow-500/30 bg-yellow-500/10',
    green: 'border-green-500/30 bg-green-500/10',
    blue: 'border-sky-400/30 bg-sky-500/10',
  };

  const textColors = {
    red: 'text-red-500',
    yellow: 'text-yellow-500',
    green: 'text-green-500',
    blue: 'text-sky-300',
  };

  return (
    <div className={`rounded-3xl border p-5 text-center shadow-[0_24px_70px_rgba(2,6,23,0.32)] ${colorClasses[color]}`}>
      <div className={`text-3xl font-bold ${textColors[color]}`}>{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">{label}</div>
    </div>
  );
}
