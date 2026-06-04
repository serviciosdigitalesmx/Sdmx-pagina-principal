'use client';

import { Calendar, User, Phone, Package, AlertCircle, MessageSquare, FileText, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ServiceRequest } from '@/types';

interface RequestCardProps {
  request: ServiceRequest;
  onQuote: () => void;
  onArchive: () => void;
}

export function RequestCard({ request, onQuote, onArchive }: RequestCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const urgencyLabels: Record<string, { label: string; color: string }> = {
    baja: { label: 'Baja', color: 'text-green-400' },
    media: { label: 'Media', color: 'text-yellow-400' },
    alta: { label: 'Alta', color: 'text-orange-400' },
    urgente: { label: 'Urgente', color: 'text-red-400' },
  };

  const urgency = urgencyLabels[request.urgency] || { label: request.urgency, color: 'text-srf-muted' };

  return (
    <div className="card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-srf-primary">{request.folio}</h3>
            <span className="text-xs text-srf-muted">{formatDate(request.created_at)}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-semibold ${urgency.color}`}>
              {urgency.label}
            </span>
            <span className="badge-recibido text-xs">Pendiente</span>
          </div>
        </div>
      </div>

      {/* Customer info */}
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2 text-srf-muted">
          <User className="w-3 h-3" />
          <span>{request.customer_name}</span>
        </div>
        <div className="flex items-center gap-2 text-srf-muted">
          <Phone className="w-3 h-3" />
          <span>{request.customer_phone}</span>
        </div>
        <div className="flex items-center gap-2 text-srf-muted">
          <Package className="w-3 h-3" />
          <span>{request.device_type} {request.device_model}</span>
        </div>
      </div>

      {/* Issue preview */}
      <div className="bg-srf-bg rounded-lg p-2 text-sm">
        <p className="text-srf-muted text-xs mb-1">Problema:</p>
        <p className="line-clamp-2">{request.issue_description}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          onClick={onQuote}
          className="flex-1 bg-srf-primary hover:bg-srf-primary/80 text-sm"
        >
          <FileText className="w-4 h-4 mr-1" />
          Cotizar
        </Button>
        <Button
          onClick={onArchive}
          variant="outline"
          className="flex-1 text-sm"
        >
          <Archive className="w-4 h-4 mr-1" />
          Archivar
        </Button>
      </div>
    </div>
  );
}