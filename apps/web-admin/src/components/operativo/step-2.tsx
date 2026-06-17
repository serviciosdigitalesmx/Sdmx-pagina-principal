'use client';

import { useState, useRef } from 'react';
import { Calendar, DollarSign, FileText, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getAssetLabel } from '@/lib/labels';
import type { OrderFormData } from '@/app/dashboard/operativo/page';

interface Step2Props {
  data: OrderFormData;
  onSubmit: (data: Partial<OrderFormData>) => void;
  onBack: () => void;
  onUpdate: (data: Partial<OrderFormData>) => void;
}

export function Step2({ data, onSubmit, onBack, onUpdate }: Step2Props) {
  const assetLabel = getAssetLabel();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [localData, setLocalData] = useState<OrderFormData>(data);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDefaultFecha = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toISOString().split('T')[0];
  };

  const [fechaPromesa, setFechaPromesa] = useState(() => data.fechaPromesa || getDefaultFecha());

  const dateValue = fechaPromesa || getDefaultFecha();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    console.log('STEP2_VALIDATE_INPUT', JSON.stringify({
      dispositivo: localData.dispositivo,
      modelo: localData.modelo,
      falla: localData.falla,
      fechaPromesaState: fechaPromesa,
      fechaPromesa: localData.fechaPromesa,
      costo: localData.costo,
      notas: localData.notas,
      checks: localData.checks,
    }));
    if (!localData.dispositivo) newErrors.dispositivo = 'Selecciona tipo de dispositivo';
    if (!localData.modelo) newErrors.modelo = 'Completa marca y modelo';
    if (!localData.falla) newErrors.falla = 'Describe la falla';
    if (!fechaPromesa) newErrors.fechaPromesa = 'Selecciona fecha de entrega';
    else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const promise = new Date(fechaPromesa);
      if (promise < today) newErrors.fechaPromesa = 'La fecha no puede ser anterior a hoy';
    }
    setErrors(newErrors);
    console.log('STEP2_VALIDATE_ERRORS', JSON.stringify(newErrors));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('STEP2_HANDLE_SUBMIT', JSON.stringify({
      dispositivo: localData.dispositivo,
      modelo: localData.modelo,
      falla: localData.falla,
      fechaPromesaState: fechaPromesa,
      fechaPromesa: localData.fechaPromesa,
      fechaPromesaVisible: fechaPromesa,
      costo: localData.costo,
      notas: localData.notas,
      checks: localData.checks,
    }));
    if (validate()) {
      onSubmit({ ...localData, fechaPromesa });
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      const next = { ...localData, fotoRecepcion: file, fotoPreview: preview };
      setLocalData(next);
      onUpdate({ fotoRecepcion: file, fotoPreview: preview });
    }
  };

  const removeFoto = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (data.fotoPreview) URL.revokeObjectURL(data.fotoPreview);
    onUpdate({ fotoRecepcion: null, fotoPreview: null });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.32)]">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-50">
        <FileText className="w-5 h-5" />
        Información del {assetLabel}
      </h3>

      {/* Device type */}
      <div>
        <Label>Tipo de dispositivo <span className="text-red-500">*</span></Label>
          <select
          value={localData.dispositivo}
          onChange={(e) => {
            const next = { ...localData, dispositivo: e.target.value };
            setLocalData(next);
            onUpdate({ dispositivo: e.target.value });
          }}
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
          value={localData.modelo}
          onChange={(e) => {
            const next = { ...localData, modelo: e.target.value };
            setLocalData(next);
            onUpdate({ modelo: e.target.value });
          }}
          placeholder="Ej: iPhone 13 Pro, Dell XPS 15"
          className={errors.modelo ? 'border-red-500' : ''}
        />
        {errors.modelo && <p className="text-red-500 text-xs mt-1">{errors.modelo}</p>}
      </div>

      {/* Issue */}
      <div>
        <Label>Falla reportada <span className="text-red-500">*</span></Label>
        <Textarea
          value={localData.falla}
          onChange={(e) => {
            const next = { ...localData, falla: e.target.value };
            setLocalData(next);
            onUpdate({ falla: e.target.value });
          }}
          placeholder="Describe el problema que comenta el cliente"
          rows={3}
          className={errors.falla ? 'border-red-500' : ''}
        />
        {errors.falla && <p className="text-red-500 text-xs mt-1">{errors.falla}</p>}
      </div>

      {/* Checklist */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-400">Checklist de Recepción:</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localData.checks.cargador}
              onChange={(e) => {
                const next = { ...localData, checks: { ...localData.checks, cargador: e.target.checked } };
                setLocalData(next);
                onUpdate({ checks: next.checks });
              }}
              className="h-4 w-4 accent-sky-400"
            />
            <span className="text-sm">Trae cargador</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localData.checks.pantalla}
              onChange={(e) => {
                const next = { ...localData, checks: { ...localData.checks, pantalla: e.target.checked } };
                setLocalData(next);
                onUpdate({ checks: next.checks });
              }}
              className="h-4 w-4 accent-sky-400"
            />
            <span className="text-sm">Pantalla OK</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localData.checks.prende}
              onChange={(e) => {
                const next = { ...localData, checks: { ...localData.checks, prende: e.target.checked } };
                setLocalData(next);
                onUpdate({ checks: next.checks });
              }}
              className="h-4 w-4 accent-sky-400"
            />
            <span className="text-sm">{assetLabel} prende</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localData.checks.respaldo}
              onChange={(e) => {
                const next = { ...localData, checks: { ...localData.checks, respaldo: e.target.checked } };
                setLocalData(next);
                onUpdate({ checks: next.checks });
              }}
              className="h-4 w-4 accent-sky-400"
            />
            <span className="text-sm">Datos respaldados</span>
          </label>
        </div>
      </div>

      {/* Receipt photo */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <Label className="flex items-center gap-2 text-sm text-slate-400">
          <Camera className="h-4 w-4 text-sky-400" />
          Foto del estado en recepción
        </Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
            onChange={handleFotoChange}
          className="mt-2 text-sm text-slate-100 file:mr-2 file:rounded-lg file:border-0 file:bg-sky-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-sky-400"
        />
        {data.fotoPreview && (
          <div className="relative mt-3 inline-block">
            <img src={data.fotoPreview} alt="Preview" className="max-h-48 rounded-lg border border-slate-700" />
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
            value={dateValue}
            onChange={(e) => {
              setFechaPromesa(e.target.value);
              const next = { ...localData, fechaPromesa: e.target.value };
              setLocalData(next);
              onUpdate({ fechaPromesa: e.target.value });
            }}
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
            value={localData.costo || ''}
            onChange={(e) => {
              const next = { ...localData, costo: parseFloat(e.target.value) || 0 };
              setLocalData(next);
              onUpdate({ costo: next.costo });
            }}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Additional notes */}
      <div>
        <Label>Notas adicionales (opcional)</Label>
        <Input
        value={localData.notas}
        onChange={(e) => {
          const next = { ...localData, notas: e.target.value };
          setLocalData(next);
          onUpdate({ notas: e.target.value });
        }}
          placeholder="Ej: Cliente dejó funda, teléfono con contraseña..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="button" onClick={onBack} variant="outline" className="flex-1">
          Atrás
        </Button>
      <Button type="submit" className="flex-1">
        Continuar
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
      </div>
    </form>
  );
}

import { ArrowRight } from 'lucide-react';
