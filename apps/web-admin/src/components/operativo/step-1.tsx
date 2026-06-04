"use client";

import { useState } from "react";
import { ArrowRight, Search, RefreshCw, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OrderFormData } from "@/app/dashboard/ordenes/page";

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
    if (!data.clienteNombre.trim()) newErrors.clienteNombre = "El nombre es requerido";
    if (!data.clienteTelefono.trim()) newErrors.clienteTelefono = "El teléfono es requerido";
    else if (!/^\d{10}$/.test(data.clienteTelefono.replace(/\D/g, ""))) {
      newErrors.clienteTelefono = "Teléfono debe tener 10 dígitos";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit({});
  };

  const handleLoadQuote = () => {
    if (!folioCotizacion.trim()) return;
    setLoadingQuote(true);
    onLoadQuote(folioCotizacion);
    window.setTimeout(() => setLoadingQuote(false), 500);
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6">
      <div className="rounded-lg border border-srf-primary bg-srf-bg p-4">
        <Label className="text-sm text-srf-muted">
          <Search className="mr-1 inline h-4 w-4" />
          Cargar por folio de cotización (opcional)
        </Label>
        <div className="mt-2 flex gap-2">
          <Input
            value={folioCotizacion}
            onChange={(e) => setFolioCotizacion(e.target.value.toUpperCase())}
            placeholder="Ej: COT-00001"
            className="flex-1 uppercase"
          />
          <Button type="button" onClick={handleLoadQuote} disabled={loadingQuote} variant="outline">
            {loadingQuote ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Cargar
          </Button>
        </div>
        {data.folioCotizacion ? <p className="mt-2 text-xs text-green-500">Solicitud {data.folioCotizacion} cargada</p> : null}
      </div>

      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-bold text-srf-primary">
          <User className="h-5 w-5" />
          Datos del Cliente
        </h3>
        <div>
          <Label>Nombre completo <span className="text-red-500">*</span></Label>
          <Input
            value={data.clienteNombre}
            onChange={(e) => onSubmit({ clienteNombre: e.target.value })}
            placeholder="Ej: Juan Pérez"
            className={errors.clienteNombre ? "border-red-500" : ""}
          />
          {errors.clienteNombre ? <p className="mt-1 text-xs text-red-500">{errors.clienteNombre}</p> : null}
        </div>
        <div>
          <Label>WhatsApp <span className="text-red-500">*</span> <span className="text-xs text-srf-muted">(10 dígitos)</span></Label>
          <Input
            value={data.clienteTelefono}
            onChange={(e) => onSubmit({ clienteTelefono: e.target.value.replace(/\D/g, "").slice(0, 10) })}
            placeholder="5512345678"
            maxLength={10}
            className={errors.clienteTelefono ? "border-red-500" : ""}
          />
          {errors.clienteTelefono ? <p className="mt-1 text-xs text-red-500">{errors.clienteTelefono}</p> : null}
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
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}

