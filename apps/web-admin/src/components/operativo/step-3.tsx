'use client';

import { Calendar, User, Phone, Mail, Package, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OrderFormData } from '@/app/dashboard/operativo/page';

interface Step3Props {
  data: OrderFormData;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}

export function Step3({ data, onSubmit, onBack, loading }: Step3Props) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'No especificada';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const checklistItems = [
    { label: 'Cargador', value: data.checks.cargador },
    { label: 'Pantalla OK', value: data.checks.pantalla },
    { label: 'Equipo prende', value: data.checks.prende },
    { label: 'Respaldo', value: data.checks.respaldo },
  ];

  return (
    <div className="card p-6 space-y-6">
      <h3 className="text-lg font-bold text-srf-primary flex items-center gap-2">
        <CheckCircle className="w-5 h-5" />
        Confirmar Orden
      </h3>

      <div className="bg-srf-bg rounded-lg p-4 space-y-3 border border-srf-primary/30">
        <div className="flex justify-between border-b border-srf-primary/20 pb-2">
          <span className="text-srf-muted">Cliente:</span>
          <span className="font-medium">{data.clienteNombre}</span>
        </div>
        <div className="flex justify-between border-b border-srf-primary/20 pb-2">
          <span className="text-srf-muted">Teléfono:</span>
          <span>{data.clienteTelefono}</span>
        </div>
        {data.clienteEmail && (
          <div className="flex justify-between border-b border-srf-primary/20 pb-2">
            <span className="text-srf-muted">Email:</span>
            <span>{data.clienteEmail}</span>
          </div>
        )}
        <div className="flex justify-between border-b border-srf-primary/20 pb-2">
          <span className="text-srf-muted">Equipo:</span>
          <span>{data.dispositivo} - {data.modelo}</span>
        </div>
        <div className="flex justify-between border-b border-srf-primary/20 pb-2">
          <span className="text-srf-muted">Falla:</span>
          <span className="text-right max-w-[60%]">{data.falla}</span>
        </div>
        <div className="flex justify-between border-b border-srf-primary/20 pb-2">
          <span className="text-srf-muted">Checklist:</span>
          <span className="text-xs text-right">
            {checklistItems.filter(i => i.value).map(i => i.label).join(' • ') || 'Ninguno'}
          </span>
        </div>
        <div className="flex justify-between border-b border-srf-primary/20 pb-2">
          <span className="text-srf-muted">Foto recepción:</span>
          <span>{data.fotoPreview ? 'Adjunta' : 'Sin foto'}</span>
        </div>
        <div className="flex justify-between border-b border-srf-primary/20 pb-2">
          <span className="text-srf-muted">Entrega prometida:</span>
          <span className="text-srf-accent font-bold">{formatDate(data.fechaPromesa)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-srf-muted">Costo estimado:</span>
          <span>${data.costo.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" onClick={onBack} variant="outline" className="flex-1">
          Corregir
        </Button>
        <Button
          onClick={onSubmit}
          disabled={loading}
          className="btn-primary flex-1"
        >
          {loading ? (
            <>
              <div className="spinner w-4 h-4 mr-2" />
              Guardando...
            </>
          ) : (
            'Guardar Orden'
          )}
        </Button>
      </div>
    </div>
  );
}
