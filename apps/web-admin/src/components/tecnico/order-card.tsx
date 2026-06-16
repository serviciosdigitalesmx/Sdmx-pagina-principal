'use client';

import { Eye, Calendar, User, Package, DollarSign } from 'lucide-react';
import type { Order } from '@/types';

interface OrderCardProps {
  order: Order;
  onClick: () => void;
}

const statusBadgeClasses: Record<string, string> = {
  recibido: 'badge-recibido',
  diagnostico: 'badge-diagnostico',
  reparacion: 'badge-reparacion',
  listo: 'badge-listo',
  entregado: 'badge-entregado',
  cancelado: 'badge-cancelado',
};

export function OrderCard({ order, onClick }: OrderCardProps) {
  const { color, diasRestantes, status } = order;
  const cardClass = color === 'rojo' ? 'card-rojo' : color === 'amarillo' ? 'card-amarillo' : color === 'verde' ? 'card-verde' : 'card-gris';

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Sin fecha';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const customerName = order.customers?.name || order.device_info?.customer_name || 'Cliente sin nombre';
  const deviceName = `${order.device_info?.type || ''} ${order.device_info?.model || ''}`.trim() || 'Equipo sin especificar';
  const hasPromiseDate = !!order.promised_date;
  const daysLeft = diasRestantes !== undefined && diasRestantes !== null ? diasRestantes : null;

  return (
    <div
      className={`rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-[0_24px_70px_rgba(2,6,23,0.32)] cursor-pointer transition-all duration-200 hover:scale-[1.02] ${cardClass}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-sky-300">{order.folio}</span>
            <span className={`badge-estado ${statusBadgeClasses[status] || 'badge-recibido'}`}>
              {status}
            </span>
          </div>
          <h3 className="text-lg font-semibold mt-2 truncate">{customerName}</h3>
          <p className="text-sm text-slate-400 truncate">{deviceName}</p>
        </div>
        {hasPromiseDate && daysLeft !== null && (
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-slate-400">Promesa</div>
            <div className={`text-sm font-bold ${daysLeft <= 2 ? 'text-rose-400' : daysLeft <= 4 ? 'text-yellow-500' : 'text-slate-400'}`}>
              {daysLeft} día{daysLeft !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <Package className="w-4 h-4" />
          <span className="truncate">{order.problem_description?.slice(0, 60) || 'Sin descripción'}</span>
        </div>
        {order.estimated_cost > 0 && (
          <div className="flex items-center gap-2 text-slate-400">
            <DollarSign className="w-4 h-4 text-sky-400" />
            <span>${order.estimated_cost.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(order.created_at)}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-sky-300">
          <Eye className="w-3 h-3" />
          <span>Ver detalle</span>
        </div>
      </div>
    </div>
  );
}
