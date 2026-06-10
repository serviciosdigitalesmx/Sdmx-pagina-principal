'use client';

import { useEffect, useState } from 'react';
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
  const [localData, setLocalData] = useState<OrderFormData>(data);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalData(data);
    setFolioCotizacion(data.folioCotizacion);
  }, [data]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!localData.customerName.trim()) newErrors.customerName = 'El nombre es requerido';
    if (!localData.customerPhone.trim()) newErrors.customerPhone = 'El teléfono es requerido';
    else if (!/^\d{10}$/.test(localData.customerPhone.replace(/\D/g, ''))) {
      newErrors.customerPhone = 'Teléfono debe tener 10 dígitos';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(localData);
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
        <Label className="text-srf-muted text-sm flex items-center gap-1">
          <Search className="w-4 h-4" />
          Cargar por folio de cotización
        </Label>
        <p className="text-xs text-srf-muted mt-1 mb-3">
          Puedes ingresar el folio en mayúsculas o minúsculas. Ej: COT-00001
        </p>
        <div className="flex gap-2">
          <Input
            value={folioCotizacion}
            onChange={(e) => {
              // Permitir pegar o teclear, forzando mayúsculas y formato base
              let val = e.target.value.toUpperCase().replace(/\s/g, '');
              if (val && !val.includes('-') && val.length > 3) {
                // Autocompletar el guión si lo olvidan
                val = val.substring(0, 3) + '-' + val.substring(3);
              }
              setFolioCotizacion(val);
            }}
            placeholder="COT-00001"
            className="flex-1 font-mono uppercase"
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
            value={localData.customerName}
            onChange={(e) => setLocalData((current) => ({ ...current, customerName: e.target.value }))}
            placeholder="Ej: Juan Pérez"
            className={errors.customerName ? 'border-red-500' : ''}
          />
          {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
        </div>

        <div>
          <Label>WhatsApp <span className="text-red-500">*</span> <span className="text-xs text-srf-muted">(Se ajustará a 10 dígitos)</span></Label>
          <Input
            value={localData.customerPhone}
            onChange={(e) => {
              let val = e.target.value.replace(/\D/g, '');
              // Limpiar prefijo +52 si el usuario lo pega
              if (val.startsWith('52') && val.length > 10) {
                val = val.substring(2);
              }
              if (val.startsWith('1') && val.length > 10) {
                val = val.substring(1);
              }
              val = val.slice(0, 10);
              
              setLocalData((current) => ({
                ...current,
                customerPhone: val,
              }));
            }}
            placeholder="5512345678"
            maxLength={15}
            className={`font-mono ${errors.customerPhone ? 'border-red-500' : ''}`}
          />
          {errors.customerPhone && <p className="text-red-500 text-xs mt-1">{errors.customerPhone}</p>}
        </div>

        <div>
          <Label>Email <span className="text-srf-muted">(opcional)</span></Label>
          <Input
            value={localData.customerEmail}
            onChange={(e) => setLocalData((current) => ({ ...current, customerEmail: e.target.value }))}
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
