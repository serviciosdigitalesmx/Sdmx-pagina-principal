'use client';

import { Calendar, User, Phone, Mail, Package, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SurfaceCard } from '@white-label/ui';
import { getAssetLabel, getCustomerLabel, getOrderLabel, getSaveOrderCopy } from '@/lib/labels';
import type { OrderFormData } from '@/app/dashboard/operativo/page';

interface Step3Props {
  data: OrderFormData;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}

export function Step3({ data, onSubmit, onBack, loading }: Step3Props) {
  const customerLabel = getCustomerLabel();
  const orderLabel = getOrderLabel();
  const assetLabel = getAssetLabel();
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'No especificada';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const checklistItems = [
    { label: 'Cargador', value: data.checks.cargador },
    { label: 'Pantalla OK', value: data.checks.pantalla },
    { label: `${assetLabel} prende`, value: data.checks.prende },
    { label: 'Respaldo', value: data.checks.respaldo },
  ];

  const saveOrderCopy = getSaveOrderCopy();

  return (
    <SurfaceCard elevated className="space-y-6 p-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-50">
        <CheckCircle className="w-5 h-5" />
        Confirmar {orderLabel}
      </h3>

      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-400">{customerLabel}:</span>
          <span className="font-medium text-slate-100">{data.clienteNombre}</span>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-400">Teléfono:</span>
          <span className="text-slate-100">{data.clienteTelefono}</span>
        </div>
        {data.clienteEmail && (
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Email:</span>
            <span className="text-slate-100">{data.clienteEmail}</span>
          </div>
        )}
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-400">{assetLabel}:</span>
          <span className="text-slate-100">{data.dispositivo} - {data.modelo}</span>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-400">Serie / IMEI:</span>
          <span className="text-slate-100">{data.serialNumber || 'Sin dato'}</span>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-400">Falla:</span>
          <span className="max-w-[60%] text-right text-slate-100">{data.falla}</span>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-400">Checklist:</span>
          <span className="text-right text-xs text-slate-100">
            {checklistItems.filter(i => i.value).map(i => i.label).join(' • ') || 'Ninguno'}
          </span>
        </div>
        <div className="grid gap-2 border-b border-slate-800 pb-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Condición cosmética:</span>
            <span className="max-w-[60%] text-right text-slate-100">{data.legalChecklist.cosmeticCondition || 'Sin dato'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Daño físico:</span>
            <span className="max-w-[60%] text-right text-slate-100">{data.legalChecklist.reportedPhysicalDamage || 'Sin dato'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Accesorios:</span>
            <span className="max-w-[60%] text-right text-slate-100">{data.legalChecklist.accessoriesReceived || 'Sin dato'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Aceptación:</span>
            <span className="max-w-[60%] text-right text-slate-100">
              {data.legalChecklist.customerAcceptanceRequired ? data.legalChecklist.acceptedByName || 'Requerida' : 'No requerida'}
            </span>
          </div>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-400">Foto recepción:</span>
          <span className="text-slate-100">{data.fotoPreview ? 'Adjunta' : 'Sin foto'}</span>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-400">Entrega prometida:</span>
          <span className="font-bold text-sky-300">{formatDate(data.fechaPromesa)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Costo estimado:</span>
          <span className="text-slate-100">${data.costo.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" onClick={onBack} variant="outline" className="flex-1">
          Corregir
        </Button>
        <Button onClick={onSubmit} disabled={loading} className="flex-1">
          {loading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
              Guardando...
            </>
          ) : (
            saveOrderCopy
          )}
        </Button>
      </div>
    </SurfaceCard>
  );
}
