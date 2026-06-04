"use client";

import { CheckCircle, Copy, Download, Plus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessProps {
  folio: string;
  customerPhone: string;
  onNewOrder: () => void;
}

export function Success({ folio, customerPhone, onNewOrder }: SuccessProps) {
  const copyFolio = () => {
    navigator.clipboard.writeText(folio);
    alert("Folio copiado al portapapeles");
  };

  const openWhatsApp = () => {
    const message = `Hola, tu equipo ha sido registrado en SrFix con el folio ${folio}. Puedes consultar el estado en el portal del cliente.`;
    const url = `https://wa.me/52${customerPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const downloadPDF = () => {
    alert("Función de PDF en desarrollo");
  };

  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500">
        <CheckCircle className="h-10 w-10 text-white" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-srf-primary">¡Orden Registrada!</h2>
      <p className="mb-4 text-srf-muted">El folio generado es:</p>
      <div className="card mx-auto mb-6 max-w-xs rounded-xl border-2 border-srf-accent p-6">
        <span className="font-mono text-3xl font-bold tracking-wider text-srf-accent">{folio}</span>
      </div>
      <div className="mb-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button onClick={copyFolio} variant="outline" className="gap-2">
          <Copy className="h-4 w-4" />
          Copiar folio
        </Button>
        <Button onClick={openWhatsApp} className="gap-2 bg-green-600 hover:bg-green-700">
          <MessageCircle className="h-4 w-4" />
          Enviar por WhatsApp
        </Button>
        <Button onClick={downloadPDF} className="gap-2 bg-srf-primary hover:bg-srf-primary/80">
          <Download className="h-4 w-4" />
          Descargar PDF
        </Button>
      </div>
      <p className="mb-6 text-sm text-srf-muted">Comparte este folio con el cliente para que pueda consultar el estado.</p>
      <Button onClick={onNewOrder} className="btn-primary mx-auto gap-2">
        <Plus className="h-4 w-4" />
        Nueva Orden
      </Button>
    </div>
  );
}

