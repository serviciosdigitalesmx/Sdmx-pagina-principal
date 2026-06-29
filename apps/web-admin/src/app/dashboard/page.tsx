'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  DollarSign,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { apiClient } from '@/lib/api-client';
import { getApiOptions } from '@/lib/tenant';
import { getCustomerLabel, getOrderLabel, getTechnicianLabel } from '@/lib/labels';
import { useTenantIdentity } from '@/providers/TenantIdentityProvider';
import type { ReportsSummary } from '@/types';
import { SurfaceCard } from '@white-label/ui';

// Colores para gráficos
const CHART_COLORS = {
  primary: '#1F7EDC',
  accent: '#FF6A2A',
  success: '#22c55e',
  warning: '#eab308',
  danger: '#ef4444',
  muted: '#8A8F95',
  gradient: ['#1F7EDC', '#2FA4FF', '#FF6A2A'],
};

const STATUS_COLORS = {
  recibido: '#1F7EDC',
  diagnostico: '#eab308',
  reparacion: '#FF6A2A',
  listo: '#22c55e',
  entregado: '#8A8F95',
};

export default function DashboardPage() {
  const router = useRouter();
  const orderLabel = getOrderLabel();
  const ordersLabel = getOrderLabel({ plural: true });
  const customersLabel = getCustomerLabel({ plural: true });
  const technicianLabel = getTechnicianLabel();
  const { identity, isLoading: identityLoading } = useTenantIdentity();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const data = await apiClient.get<{ data: ReportsSummary }>('/reports/summary', getApiOptions());
      setSummary(data.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      if (showRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (identityLoading) return;
    if (identity?.role === 'technician') {
      router.replace('/dashboard/tecnico');
      return;
    }
    loadData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => loadData(), 60000);
    return () => clearInterval(interval);
  }, [identity, identityLoading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500/25 border-t-sky-400" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-400">No se pudieron cargar los datos del dashboard</p>
        <button onClick={() => loadData()} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-400/30 hover:bg-slate-800/80">
          Reintentar
        </button>
      </div>
    );
  }

  // Preparar datos para gráficos
  const statusData = Object.entries(summary.statusCounts || {}).map(([name, value]) => ({
    name: name === 'entregado' ? 'Entregado' : name === 'listo' ? 'Listo' : name,
    value,
    color: STATUS_COLORS[name as keyof typeof STATUS_COLORS] || CHART_COLORS.muted,
  }));

  // Datos de actividad reciente (órdenes atrasadas)
  const overdueOrders = summary.overduePromisedOrders || [];

  // Productos más usados
  const topProducts = (summary.topProductsUsed || []).slice(0, 5);

  // Órdenes por técnico
  const technicianData = Object.entries(summary.ordersByTechnician || {})
    .map(([name, count]) => ({ name: name.split(' ')[0] || name.slice(0, 10), count }))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-sky-400/70">Hub operativo</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-50">
            Panel de Control
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Resumen operativo del taller en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-400">
              Última actualización: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-400/30 hover:bg-slate-800/80 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Ingresos del mes"
          value={`$${summary.totalIncome.toFixed(2)}`}
          icon={<TrendingUp className="w-6 h-6" />}
          trend="up"
          color="success"
        />
        <KPICard
          title="Egresos del mes"
          value={`$${summary.totalExpense.toFixed(2)}`}
          icon={<TrendingDown className="w-6 h-6" />}
          trend="down"
          color="danger"
        />
        <KPICard
          title="Utilidad bruta"
          value={`$${summary.totalBalance.toFixed(2)}`}
          icon={<DollarSign className="w-6 h-6" />}
          trend={summary.totalBalance > 0 ? 'up' : 'down'}
          color={summary.totalBalance > 0 ? 'success' : 'danger'}
        />
        <KPICard
          title="Productividad"
          value={`${summary.productivity}%`}
          icon={<CheckCircle className="w-6 h-6" />}
          color={summary.productivity >= 70 ? 'success' : summary.productivity >= 50 ? 'warning' : 'danger'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SimpleCard
          title={`${ordersLabel} activas`}
          value={summary.ordersCount}
          icon={<ClipboardList className="w-5 h-5" />}
          onClick={() => router.push('/dashboard/tecnico')}
        />
        <SimpleCard
          title={customersLabel}
          value={summary.customersCount}
          icon={<Users className="w-5 h-5" />}
          onClick={() => router.push('/dashboard/clientes')}
        />
        <SimpleCard
          title="Stock bajo"
          value={summary.lowStockCount}
          icon={<Package className="w-5 h-5" />}
          variant={summary.lowStockCount > 0 ? 'warning' : 'default'}
          onClick={() => router.push('/dashboard/stock')}
        />
        <SimpleCard
          title="Cuentas por cobrar"
          value={`$${summary.accountsReceivable.toFixed(2)}`}
          icon={<Truck className="w-5 h-5" />}
          onClick={() => router.push('/dashboard/finanzas')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SurfaceCard elevated className="p-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Distribución por estado
          </h3>
          <div className="h-64 min-h-64 min-w-0">
            {mounted ? (
              <ResponsiveContainer width="100%" height={256} minWidth={0} minHeight={256}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(((percent ?? 0) * 100)).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#2B2B2B', border: '1px solid #1F7EDC', borderRadius: '8px' }}
                    labelStyle={{ color: '#F2F2F2' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Cargando gráfico...
              </div>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard elevated className="p-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            {ordersLabel} por {technicianLabel.toLowerCase()}
          </h3>
          <div className="h-64 min-h-64 min-w-0">
            {mounted ? (
              <ResponsiveContainer width="100%" height={256} minWidth={0} minHeight={256}>
                <BarChart data={technicianData} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                  <XAxis type="number" stroke="#8A8F95" />
                  <YAxis type="category" dataKey="name" stroke="#8A8F95" width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#2B2B2B', border: '1px solid #1F7EDC', borderRadius: '8px' }}
                    labelStyle={{ color: '#F2F2F2' }}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Cargando gráfico...
              </div>
            )}
          </div>
        </SurfaceCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Used */}
        <SurfaceCard elevated className="p-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Productos más utilizados
          </h3>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={product.productId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-sm font-medium text-slate-400">{index + 1}.</span>
                  <span className="text-sm truncate max-w-[200px]">{product.name}</span>
                </div>
                <span className="text-sm font-semibold text-sky-300">{product.quantity} uds</span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">Sin datos suficientes</p>
            )}
          </div>
        </SurfaceCard>

        {/* Inventory Valuation */}
        <SurfaceCard elevated className="p-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Valor del inventario
          </h3>
          <div className="text-center py-6">
            <p className="text-4xl font-bold text-sky-300">
              ${summary.inventoryValuation.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {summary.inventoryCount} productos activos
            </p>
          </div>
          <div className="mt-4 border-t border-slate-800 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Stock crítico</span>
              <span className="font-semibold text-rose-400">{summary.lowStockCount}</span>
            </div>
          </div>
        </SurfaceCard>
      </div>

      {/* Overdue Orders */}
      {overdueOrders.length > 0 && (
        <SurfaceCard elevated className="border-rose-400/20 bg-rose-500/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
            <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-300">
              Órdenes atrasadas ({overdueOrders.length})
            </h3>
          </div>
          <div className="space-y-2">
            {overdueOrders.map((order) => (
              <div
                key={order.id}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-rose-500/15 bg-rose-500/10 p-3 transition-colors hover:bg-rose-500/15"
                onClick={() => router.push(`/dashboard/tecnico?order=${order.id}`)}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-100">{order.folio || order.id.slice(0, 8)}</p>
                  <p className="text-xs text-slate-400">Prometido: {order.promisedDate}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
            ))}
          </div>
        </SurfaceCard>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <QuickActionButton
          label={`Nueva ${orderLabel.toLowerCase()}`}
          icon={<ClipboardList className="w-5 h-5" />}
          onClick={() => router.push('/dashboard/operativo')}
        />
        <QuickActionButton
          label="Semáforo"
          icon={<Clock className="w-5 h-5" />}
          onClick={() => router.push('/dashboard/tecnico')}
        />
        <QuickActionButton
          label="Cotizar"
          icon={<DollarSign className="w-5 h-5" />}
          onClick={() => router.push('/dashboard/solicitudes')}
        />
        <QuickActionButton
          label="Compras"
          icon={<ShoppingCart className="w-5 h-5" />}
          onClick={() => router.push('/dashboard/compras')}
        />
        <QuickActionButton
          label="Stock"
          icon={<Package className="w-5 h-5" />}
          onClick={() => router.push('/dashboard/stock')}
        />
        <QuickActionButton
          label="Reportes"
          icon={<BarChart3 className="w-5 h-5" />}
          onClick={() => router.push('/dashboard/reportes')}
        />
      </div>
    </div>
  );
}

// Subcomponentes del Dashboard

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  color?: 'success' | 'danger' | 'warning' | 'default';
}

function KPICard({ title, value, icon, trend, color = 'default' }: KPICardProps) {
  const colorClasses = {
    success: 'text-green-400',
    danger: 'text-red-400',
    warning: 'text-yellow-400',
    default: 'text-sky-300',
  };

  return (
    <SurfaceCard elevated className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${colorClasses[color]}`}>{value}</p>
        </div>
        <div className={`rounded-xl border border-white/10 bg-white/5 p-2 ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {trend === 'up' ? (
            <TrendingUp className="w-3 h-3 text-green-400" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-400" />
          )}
          <span className="text-slate-400">vs mes anterior</span>
        </div>
      )}
    </SurfaceCard>
  );
}

interface SimpleCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: 'default' | 'warning';
  onClick?: () => void;
}

function SimpleCard({ title, value, icon, variant = 'default', onClick }: SimpleCardProps) {
  const variantClasses = {
    default: 'border-slate-800',
    warning: 'border-yellow-500/50 bg-yellow-500/10',
  };

  return (
    <SurfaceCard
      elevated
      className={`p-5 transition-transform hover:scale-[1.01] ${variantClasses[variant]}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${variant === 'warning' ? 'text-yellow-400' : ''}`}>
            {value}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-sky-300">{icon}</div>
      </div>
    </SurfaceCard>
  );
}

interface QuickActionButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function QuickActionButton({ label, icon, onClick }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-[1.25rem] border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10"
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

// Importar íconos que faltan
import { ShoppingCart, BarChart3 } from 'lucide-react';
import { isModuleEnabled } from '@/lib/module-access';
