'use client';

import { useState } from 'react';
import { User, Phone, Mail, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OrderFormData } from '@/app/dashboard/operativo/page';

interface Step1Props {
  data: OrderFormData;
  onSubmit: (data: Partial<OrderFormData>) => void;
  onLoadQuote: (folio: string) => void;
}

export function Step1({ data, onSubmit, onLoadQuote }: Step1Props) {
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [folioCotizacion, setFolioCotizacion] = useState(data.folioCotizacion);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!data.clienteNombre.trim()) newErrors.clienteNombre = 'El nombre es requerido';
    if (!data.clienteTelefono.trim()) newErrors.clienteTelefono = 'El teléfono es requerido';
    else if (!/^\d{10}$/.test(data.clienteTelefono.replace(/\D/g, ''))) {
      newErrors.clienteTelefono = 'Teléfono debe tener 10 dígitos';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({});
    }
  };

  const handleLoadQuote = () => {
    if (!folioCotizacion.trim()) return;
    setLoadingQuote(true);
    onLoadQuote(folioCotizacion);
    setTimeout(() => setLoadingQuote(false), 500);
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-6">
      {/* Quote loader */}
      <div className="bg-srf-bg border border-srf-primary rounded-lg p-4">
        <Label className="text-srf-muted text-sm">
          <Search className="w-4 h-4 inline mr-1" />
          Cargar por folio de cotización (opcional)
        </Label>
        <div className="flex gap-2 mt-2">
          <Input
            value={folioCotizacion}
            onChange={(e) => setFolioCotizacion(e.target.value.toUpperCase())}
            placeholder="Ej: COT-00001"
            className="flex-1 uppercase"
          />
          <Button
            type="button"
            onClick={handleLoadQuote}
            disabled={loadingQuote}
            variant="outline"
          >
            {loadingQuote ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Cargar
          </Button>
        </div>
        {data.folioCotizacion && (
          <p className="text-xs text-green-500 mt-2">
            Solicitud {data.folioCotizacion} cargada
          </p>
        )}
      </div>

      {/* Customer form */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-srf-primary flex items-center gap-2">
          <User className="w-5 h-5" />
          Datos del Cliente
        </h3>

        <div>
          <Label>Nombre completo <span className="text-red-500">*</span></Label>
          <Input
            value={data.clienteNombre}
            onChange={(e) => onSubmit({ clienteNombre: e.target.value })}
            placeholder="Ej: Juan Pérez"
            className={errors.clienteNombre ? 'border-red-500' : ''}
          />
          {errors.clienteNombre && <p className="text-red-500 text-xs mt-1">{errors.clienteNombre}</p>}
        </div>

        <div>
          <Label>WhatsApp <span className="text-red-500">*</span> <span className="text-xs text-srf-muted">(10 dígitos)</span></Label>
          <Input
            value={data.clienteTelefono}
            onChange={(e) => onSubmit({ clienteTelefono: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            placeholder="5512345678"
            maxLength={10}
            className={errors.clienteTelefono ? 'border-red-500' : ''}
          />
          {errors.clienteTelefono && <p className="text-red-500 text-xs mt-1">{errors.clienteTelefono}</p>}
        </div>

        <div>
          <Label>Email <span className="text-srf-muted">(opcional)</span></Label>
          <Input
            value={data.clienteEmail}
            onChange={(e) => onSubmit({ clienteEmail: e.target.value })}
            placeholder="cliente@email.com"
            type="email"
          />
        </div>
      </div>

      <Button type="submit" className="btn-primary w-full py-3">
        Continuar
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </form>
  );
}

import { ArrowRight } from 'lucide-react';
