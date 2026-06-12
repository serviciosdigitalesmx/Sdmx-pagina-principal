'use client';

import { CheckCircle, Copy, Download, Plus, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCreatedSuccessLabel, getNewEntityLabel } from '@/lib/labels';

interface SuccessProps {
  folio: string;
  customerPhone: string;
  onNewOrder: () => void;
}

export function Success({ folio, customerPhone, onNewOrder }: SuccessProps) {
  const createdLabel = getCreatedSuccessLabel();
  const newOrderLabel = getNewEntityLabel();
  const copyFolio = () => {
    navigator.clipboard.writeText(folio);
    alert('Folio copiado al portapapeles');
  };

  const openWhatsApp = () => {
    const message = `Hola, tu equipo ha sido registrado en SrFix con el folio ${folio}. Puedes consultar el estado en el portal del cliente.`;
    const url = `https://wa.me/52${customerPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const downloadPDF = () => {
    // Implementar generación de PDF
    alert('Función de PDF en desarrollo');
  };

  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-10 h-10 text-white" />
      </div>

      <h2 className="text-2xl font-bold text-srf-primary mb-2">¡{createdLabel}!</h2>
      <p className="text-srf-muted mb-4">El folio generado es:</p>

      <div className="card border-2 border-srf-accent rounded-xl p-6 max-w-xs mx-auto mb-6">
        <span className="text-3xl font-mono font-bold text-srf-accent tracking-wider">{folio}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
        <Button onClick={copyFolio} variant="outline" className="gap-2">
          <Copy className="w-4 h-4" />
          Copiar folio
        </Button>
        <Button onClick={openWhatsApp} className="bg-green-600 hover:bg-green-700 gap-2">
          <MessageCircle className="w-4 h-4" />
          Enviar por WhatsApp
        </Button>
        <Button onClick={downloadPDF} className="bg-srf-primary hover:bg-srf-primary/80 gap-2">
          <Download className="w-4 h-4" />
          Descargar PDF
        </Button>
      </div>

      <p className="text-sm text-srf-muted mb-6">
        Comparte este folio con el cliente para que pueda consultar el estado.
      </p>

      <Button onClick={onNewOrder} className="btn-primary gap-2 mx-auto">
        <Plus className="w-4 h-4" />
        {newOrderLabel}
      </Button>
    </div>
  );
}

// Por simplicidad, usaremos un span con emoji o importar de otro paquete
// Alternativa: usar un div con clase btn-wa
