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
import type { ReportsSummary } from '@/types';

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
    loadData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => loadData(), 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-12">
        <p className="text-srf-muted">No se pudieron cargar los datos del dashboard</p>
        <button onClick={() => loadData()} className="btn-secondary mt-4">
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
          <h1 className="text-2xl font-orbitron font-bold text-srf-primary">
            Panel de Control
          </h1>
          <p className="text-srf-muted text-sm mt-1">
            Resumen operativo del taller en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-srf-muted">
              Última actualización: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="btn-outline py-2"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
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
          title="Órdenes activas"
          value={summary.ordersCount}
          icon={<ClipboardList className="w-5 h-5" />}
          onClick={() => router.push('/dashboard/tecnico')}
        />
        <SimpleCard
          title="Clientes"
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
        {/* Status Distribution */}
        <div className="card">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-srf-muted mb-4">
            Distribución por estado
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
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
          </div>
        </div>

        {/* Orders by Technician */}
        <div className="card">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-srf-muted mb-4">
            Órdenes por técnico
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
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
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Used */}
        <div className="card">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-srf-muted mb-4">
            Productos más utilizados
          </h3>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={product.productId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-srf-muted w-6">{index + 1}.</span>
                  <span className="text-sm truncate max-w-[200px]">{product.name}</span>
                </div>
                <span className="text-sm font-semibold text-srf-primary">{product.quantity} uds</span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-sm text-srf-muted text-center py-4">Sin datos suficientes</p>
            )}
          </div>
        </div>

        {/* Inventory Valuation */}
        <div className="card">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-srf-muted mb-4">
            Valor del inventario
          </h3>
          <div className="text-center py-6">
            <p className="text-4xl font-bold text-srf-primary">
              ${summary.inventoryValuation.toLocaleString()}
            </p>
            <p className="text-sm text-srf-muted mt-2">
              {summary.inventoryCount} productos activos
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-srf-primary/20">
            <div className="flex justify-between text-sm">
              <span className="text-srf-muted">Stock crítico</span>
              <span className="font-semibold text-srf-red">{summary.lowStockCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Orders */}
      {overdueOrders.length > 0 && (
        <div className="card border-l-4 border-l-srf-red">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-srf-red" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-srf-red">
              Órdenes atrasadas ({overdueOrders.length})
            </h3>
          </div>
          <div className="space-y-2">
            {overdueOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-lg bg-srf-red/10 hover:bg-srf-red/20 cursor-pointer transition-colors"
                onClick={() => router.push(`/dashboard/tecnico?order=${order.id}`)}
              >
                <div>
                  <p className="text-sm font-semibold">{order.folio || order.id.slice(0, 8)}</p>
                  <p className="text-xs text-srf-muted">Prometido: {order.promisedDate}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-srf-muted" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <QuickActionButton
          label="Nueva orden"
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
    default: 'text-srf-primary',
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-srf-muted">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${colorClasses[color]}`}>{value}</p>
        </div>
        <div className={`p-2 rounded-lg bg-srf-primary/10 ${colorClasses[color]}`}>
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
          <span className="text-srf-muted">vs mes anterior</span>
        </div>
      )}
    </div>
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
    default: 'border-srf-primary/30',
    warning: 'border-yellow-500/50 bg-yellow-500/10',
  };

  return (
    <div
      className={`card ${variantClasses[variant]} cursor-pointer hover:scale-[1.02] transition-transform`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-srf-muted">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${variant === 'warning' ? 'text-yellow-400' : ''}`}>
            {value}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-srf-primary/10 text-srf-primary">{icon}</div>
      </div>
    </div>
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
      className="flex flex-col items-center gap-2 p-3 rounded-lg bg-srf-surface/50 hover:bg-srf-surface transition-colors border border-srf-primary/20"
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

// Importar íconos que faltan
import { ShoppingCart, BarChart3 } from 'lucide-react';
