'use client';

import { CheckCircle, Copy, Download, Plus, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCreatedSuccessLabel, getNewEntityLabel } from '@/lib/labels';
import { getTenantSlug } from '@/lib/tenant';

interface SuccessProps {
  folio: string;
  customerPhone: string;
  pdfUrl: string | null;
  trackingUrl: string | null;
  onNewOrder: () => void;
}

export function Success({ folio, customerPhone, pdfUrl, trackingUrl, onNewOrder }: SuccessProps) {
  const createdLabel = getCreatedSuccessLabel();
  const newOrderLabel = getNewEntityLabel();
  const tenantSlug = getTenantSlug();
  const publicBase = process.env.NEXT_PUBLIC_WEB_PUBLIC_URL?.replace(/\/$/, "") ?? "";
  const fallbackTrackingUrl = trackingUrl || (publicBase && tenantSlug ? `${publicBase}/${encodeURIComponent(tenantSlug)}/tracking?folio=${encodeURIComponent(folio)}` : null);

  const copyFolio = () => {
    navigator.clipboard.writeText(folio);
    alert('Folio copiado al portapapeles');
  };

  const openWhatsApp = () => {
    const message = `Hola, tu equipo ha sido registrado en FIXI con el folio ${folio}. Puedes consultar el estado en este enlace: ${fallbackTrackingUrl || 'seguimiento público'}`;
    const url = `https://wa.me/52${customerPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const downloadPDF = () => {
    if (!pdfUrl) {
      return;
    }
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500">
        <CheckCircle className="w-10 h-10 text-white" />
      </div>

      <h2 className="mb-2 text-2xl font-bold text-slate-50">¡{createdLabel}!</h2>
      <p className="mb-4 text-slate-400">El folio generado es:</p>

      <div className="card mx-auto mb-6 max-w-xs rounded-2xl border-2 border-sky-400/40 p-6">
        <span className="text-3xl font-mono font-bold tracking-wider text-sky-300">{folio}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
        <Button onClick={copyFolio} variant="outline" className="gap-2">
          <Copy className="w-4 h-4" />
          Copiar folio
        </Button>
        <Button onClick={openWhatsApp} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <MessageCircle className="w-4 h-4" />
          Enviar por WhatsApp
        </Button>
        <Button onClick={downloadPDF} disabled={!pdfUrl} className="gap-2 bg-sky-500 hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-700">
          <Download className="w-4 h-4" />
          {pdfUrl ? 'Ver PDF' : 'PDF pendiente'}
        </Button>
      </div>

      <p className="mb-6 text-sm text-slate-400">
        Comparte este folio con el cliente para que pueda consultar el estado.
      </p>

      <Button onClick={onNewOrder} className="btn-primary mx-auto gap-2">
        <Plus className="w-4 h-4" />
        {newOrderLabel}
      </Button>
    </div>
  );
}

// Por simplicidad, usaremos un span con emoji o importar de otro paquete
// Alternativa: usar un div con clase btn-wa
