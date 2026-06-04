"use client";

import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderFormData } from "@/app/dashboard/ordenes/page";

interface Step3Props {
  data: OrderFormData;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}

export function Step3({ data, onSubmit, onBack, loading }: Step3Props) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "No especificada";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  };

  const checklistItems = [
    { label: "Cargador", value: data.checks.cargador },
    { label: "Pantalla OK", value: data.checks.pantalla },
    { label: "Equipo prende", value: data.checks.prende },
    { label: "Respaldo", value: data.checks.respaldo },
  ];

  return (
    <div className="card space-y-6 p-6">
      <h3 className="flex items-center gap-2 text-lg font-bold text-srf-primary">
        <CheckCircle className="h-5 w-5" />
        Confirmar Orden
      </h3>

      <div className="space-y-3 rounded-lg border border-srf-primary/30 bg-srf-bg p-4">
        <Row label="Cliente" value={data.clienteNombre} />
        <Row label="Teléfono" value={data.clienteTelefono} />
        {data.clienteEmail ? <Row label="Email" value={data.clienteEmail} /> : null}
        <Row label="Equipo" value={`${data.dispositivo} - ${data.modelo}`} />
        <Row label="Falla" value={data.falla} />
        <Row label="Checklist" value={checklistItems.filter((i) => i.value).map((i) => i.label).join(" • ") || "Ninguno"} />
        <Row label="Foto recepción" value={data.fotoPreview ? "Adjunta" : "Sin foto"} />
        <Row label="Entrega prometida" value={formatDate(data.fechaPromesa)} highlight />
        <Row label="Costo estimado" value={`$${data.costo.toFixed(2)}`} />
      </div>

      <div className="flex gap-3">
        <Button type="button" onClick={onBack} variant="outline" className="flex-1">Corregir</Button>
        <Button onClick={onSubmit} disabled={loading} className="btn-primary flex-1">
          {loading ? "Guardando..." : "Guardar Orden"}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between border-b border-srf-primary/20 pb-2 last:border-b-0 last:pb-0">
      <span className="text-srf-muted">{label}:</span>
      <span className={highlight ? "font-bold text-srf-accent" : ""}>{value}</span>
    </div>
  );
}

