'use client';

import { useState, useRef } from 'react';
import { Calendar, DollarSign, FileText, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { OrderFormData } from '@/app/dashboard/operativo/page';

interface Step2Props {
  data: OrderFormData;
  onSubmit: (data: Partial<OrderFormData>) => void;
  onBack: () => void;
  onUpdate: (data: Partial<OrderFormData>) => void;
}

export function Step2({ data, onSubmit, onBack, onUpdate }: Step2Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!data.dispositivo) newErrors.dispositivo = 'Selecciona tipo de dispositivo';
    if (!data.modelo) newErrors.modelo = 'Completa marca y modelo';
    if (!data.falla) newErrors.falla = 'Describe la falla';
    if (!data.fechaPromesa) newErrors.fechaPromesa = 'Selecciona fecha de entrega';
    else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const promise = new Date(data.fechaPromesa);
      if (promise < today) newErrors.fechaPromesa = 'La fecha no puede ser anterior a hoy';
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

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      onUpdate({ fotoRecepcion: file, fotoPreview: preview });
    }
  };

  const removeFoto = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (data.fotoPreview) URL.revokeObjectURL(data.fotoPreview);
    onUpdate({ fotoRecepcion: null, fotoPreview: null });
  };

  // Set default fecha promesa (3 días desde hoy) si no está definida
  const getDefaultFecha = () => {
    if (data.fechaPromesa) return data.fechaPromesa;
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toISOString().split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-6">
      <h3 className="text-lg font-bold text-srf-primary flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Información del Equipo
      </h3>

      {/* Device type */}
      <div>
        <Label>Tipo de dispositivo <span className="text-red-500">*</span></Label>
        <select
          value={data.dispositivo}
          onChange={(e) => onUpdate({ dispositivo: e.target.value })}
          className={`input w-full ${errors.dispositivo ? 'border-red-500' : ''}`}
        >
          <option value="">Selecciona...</option>
          <option value="Smartphone">Smartphone</option>
          <option value="Tablet">Tablet</option>
          <option value="Laptop">Laptop</option>
          <option value="Computadora">Computadora</option>
          <option value="Consola">Consola</option>
          <option value="Control">Control</option>
          <option value="Otro">Otro</option>
        </select>
        {errors.dispositivo && <p className="text-red-500 text-xs mt-1">{errors.dispositivo}</p>}
      </div>

      {/* Brand/Model */}
      <div>
        <Label>Marca y modelo <span className="text-red-500">*</span></Label>
        <Input
          value={data.modelo}
          onChange={(e) => onUpdate({ modelo: e.target.value })}
          placeholder="Ej: iPhone 13 Pro, Dell XPS 15"
          className={errors.modelo ? 'border-red-500' : ''}
        />
        {errors.modelo && <p className="text-red-500 text-xs mt-1">{errors.modelo}</p>}
      </div>

      {/* Issue */}
      <div>
        <Label>Falla reportada <span className="text-red-500">*</span></Label>
        <Textarea
          value={data.falla}
          onChange={(e) => onUpdate({ falla: e.target.value })}
          placeholder="Describe el problema que comenta el cliente"
          rows={3}
          className={errors.falla ? 'border-red-500' : ''}
        />
        {errors.falla && <p className="text-red-500 text-xs mt-1">{errors.falla}</p>}
      </div>

      {/* Checklist */}
      <div className="bg-srf-bg border border-srf-primary rounded-lg p-4">
        <p className="text-sm text-srf-muted mb-3 font-semibold">Checklist de Recepción:</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.checks.cargador}
              onChange={(e) => onUpdate({ checks: { ...data.checks, cargador: e.target.checked } })}
              className="w-4 h-4 accent-srf-accent"
            />
            <span className="text-sm">Trae cargador</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.checks.pantalla}
              onChange={(e) => onUpdate({ checks: { ...data.checks, pantalla: e.target.checked } })}
              className="w-4 h-4 accent-srf-accent"
            />
            <span className="text-sm">Pantalla OK</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.checks.prende}
              onChange={(e) => onUpdate({ checks: { ...data.checks, prende: e.target.checked } })}
              className="w-4 h-4 accent-srf-accent"
            />
            <span className="text-sm">Equipo prende</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.checks.respaldo}
              onChange={(e) => onUpdate({ checks: { ...data.checks, respaldo: e.target.checked } })}
              className="w-4 h-4 accent-srf-accent"
            />
            <span className="text-sm">Datos respaldados</span>
          </label>
        </div>
      </div>

      {/* Receipt photo */}
      <div className="bg-srf-bg border border-srf-primary rounded-lg p-4">
        <Label className="text-srf-muted text-sm flex items-center gap-2">
          <Camera className="w-4 h-4 text-srf-accent" />
          Foto del estado en recepción
        </Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFotoChange}
          className="mt-2 text-sm text-srf-text file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-srf-accent file:text-white hover:file:bg-srf-accent/80"
        />
        {data.fotoPreview && (
          <div className="relative mt-3 inline-block">
            <img src={data.fotoPreview} alt="Preview" className="max-h-48 rounded-lg border border-srf-primary" />
            <button
              type="button"
              onClick={removeFoto}
              className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Date and Cost */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Fecha promesa <span className="text-red-500">*</span></Label>
          <Input
            type="date"
            value={getDefaultFecha()}
            onChange={(e) => onUpdate({ fechaPromesa: e.target.value })}
            className={errors.fechaPromesa ? 'border-red-500' : ''}
          />
          {errors.fechaPromesa && <p className="text-red-500 text-xs mt-1">{errors.fechaPromesa}</p>}
        </div>
        <div>
          <Label>Costo estimado $</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={data.costo || ''}
            onChange={(e) => onUpdate({ costo: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Additional notes */}
      <div>
        <Label>Notas adicionales (opcional)</Label>
        <Input
          value={data.notas}
          onChange={(e) => onUpdate({ notas: e.target.value })}
          placeholder="Ej: Cliente dejó funda, teléfono con contraseña..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="button" onClick={onBack} variant="outline" className="flex-1">
          Atrás
        </Button>
        <Button type="submit" className="btn-primary flex-1">
          Continuar
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}

import { ArrowRight } from 'lucide-react';
