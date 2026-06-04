"use client";

import { useRef, useState } from "react";
import { Camera, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OrderFormData } from "@/app/dashboard/ordenes/page";

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
    if (!data.dispositivo) newErrors.dispositivo = "Selecciona tipo de dispositivo";
    if (!data.modelo) newErrors.modelo = "Completa marca y modelo";
    if (!data.falla) newErrors.falla = "Describe la falla";
    if (!data.fechaPromesa) newErrors.fechaPromesa = "Selecciona fecha de entrega";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit({});
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      onUpdate({ fotoRecepcion: file, fotoPreview: preview });
    }
  };

  const removeFoto = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (data.fotoPreview) URL.revokeObjectURL(data.fotoPreview);
    onUpdate({ fotoRecepcion: null, fotoPreview: null });
  };

  const getDefaultFecha = () => {
    if (data.fechaPromesa) return data.fechaPromesa;
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toISOString().split("T")[0];
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6">
      <h3 className="flex items-center gap-2 text-lg font-bold text-srf-primary">
        <FileText className="h-5 w-5" />
        Información del Equipo
      </h3>

      <div>
        <Label>Tipo de dispositivo <span className="text-red-500">*</span></Label>
        <select
          value={data.dispositivo}
          onChange={(e) => onUpdate({ dispositivo: e.target.value })}
          className={`input w-full ${errors.dispositivo ? "border-red-500" : ""}`}
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
        {errors.dispositivo ? <p className="mt-1 text-xs text-red-500">{errors.dispositivo}</p> : null}
      </div>

      <div>
        <Label>Marca y modelo <span className="text-red-500">*</span></Label>
        <Input value={data.modelo} onChange={(e) => onUpdate({ modelo: e.target.value })} placeholder="Ej: iPhone 13 Pro, Dell XPS 15" className={errors.modelo ? "border-red-500" : ""} />
        {errors.modelo ? <p className="mt-1 text-xs text-red-500">{errors.modelo}</p> : null}
      </div>

      <div>
        <Label>Falla reportada <span className="text-red-500">*</span></Label>
        <Textarea value={data.falla} onChange={(e) => onUpdate({ falla: e.target.value })} placeholder="Describe el problema que comenta el cliente" rows={3} className={errors.falla ? "border-red-500" : ""} />
        {errors.falla ? <p className="mt-1 text-xs text-red-500">{errors.falla}</p> : null}
      </div>

      <div className="rounded-lg border border-srf-primary bg-srf-bg p-4">
        <p className="mb-3 text-sm font-semibold text-srf-muted">Checklist de Recepción:</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={data.checks.cargador} onChange={(e) => onUpdate({ checks: { ...data.checks, cargador: e.target.checked } })} className="h-4 w-4 accent-srf-accent" />
            <span className="text-sm">Trae cargador</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={data.checks.pantalla} onChange={(e) => onUpdate({ checks: { ...data.checks, pantalla: e.target.checked } })} className="h-4 w-4 accent-srf-accent" />
            <span className="text-sm">Pantalla OK</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={data.checks.prende} onChange={(e) => onUpdate({ checks: { ...data.checks, prende: e.target.checked } })} className="h-4 w-4 accent-srf-accent" />
            <span className="text-sm">Equipo prende</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={data.checks.respaldo} onChange={(e) => onUpdate({ checks: { ...data.checks, respaldo: e.target.checked } })} className="h-4 w-4 accent-srf-accent" />
            <span className="text-sm">Datos respaldados</span>
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-srf-primary bg-srf-bg p-4">
        <Label className="flex items-center gap-2 text-srf-muted text-sm">
          <Camera className="h-4 w-4 text-srf-accent" />
          Foto del estado en recepción
        </Label>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFotoChange} className="mt-2 text-sm text-srf-text file:mr-2 file:rounded-lg file:border-0 file:bg-srf-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-srf-accent/80" />
        {data.fotoPreview ? (
          <div className="relative mt-3 inline-block">
            <img src={data.fotoPreview} alt="Preview" className="max-h-48 rounded-lg border border-srf-primary" />
            <button type="button" onClick={removeFoto} className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Fecha promesa <span className="text-red-500">*</span></Label>
          <Input type="date" value={getDefaultFecha()} onChange={(e) => onUpdate({ fechaPromesa: e.target.value })} className={errors.fechaPromesa ? "border-red-500" : ""} />
          {errors.fechaPromesa ? <p className="mt-1 text-xs text-red-500">{errors.fechaPromesa}</p> : null}
        </div>
        <div>
          <Label>Costo estimado $</Label>
          <Input type="number" step="0.01" min="0" value={data.costo || ""} onChange={(e) => onUpdate({ costo: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
        </div>
      </div>

      <div>
        <Label>Notas adicionales (opcional)</Label>
        <Input value={data.notas} onChange={(e) => onUpdate({ notas: e.target.value })} placeholder="Ej: Cliente dejó funda, teléfono con contraseña..." />
      </div>

      <div className="flex justify-between">
        <Button type="button" onClick={onBack} variant="outline">Atrás</Button>
        <Button type="submit" className="btn-primary">Continuar</Button>
      </div>
    </form>
  );
}

