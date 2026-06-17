'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Step1 } from '@/components/operativo/step-1';
import { Step2 } from '@/components/operativo/step-2';
import { Step3 } from '@/components/operativo/step-3';
import { Success } from '@/components/operativo/success';
import { apiClient } from '@/lib/api-client';
import { getApiOptions } from '@/lib/tenant';
import { getAssetLabel, getCustomerLabel, getNewEntityLabel } from '@/lib/labels';
import { getTenantSlug } from '@/lib/tenant';

export type OrderFormData = {
  // Paso 1: Cliente
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string;
  folioCotizacion: string;

  // Paso 2: Equipo
  dispositivo: string;
  modelo: string;
  falla: string;
  fechaPromesa: string;
  costo: number;
  notas: string;

  // Checklist
  checks: {
    cargador: boolean;
    pantalla: boolean;
    prende: boolean;
    respaldo: boolean;
  };

  // Foto
  fotoRecepcion: File | null;
  fotoPreview: string | null;
};

export default function OperativoPage() {
  const router = useRouter();
  const customerLabel = getCustomerLabel();
  const assetLabel = getAssetLabel();
  const newOrderLabel = getNewEntityLabel();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savedFolio, setSavedFolio] = useState<string | null>(null);
  const [savedPdfUrl, setSavedPdfUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<OrderFormData>({
    clienteNombre: '',
    clienteTelefono: '',
    clienteEmail: '',
    folioCotizacion: '',
    dispositivo: '',
    modelo: '',
    falla: '',
    fechaPromesa: '',
    costo: 0,
    notas: '',
    checks: {
      cargador: false,
      pantalla: false,
      prende: false,
      respaldo: false,
    },
    fotoRecepcion: null,
    fotoPreview: null,
  });

  // Cargar borrador guardado en localStorage
  useEffect(() => {
    const saved = localStorage.getItem('srf_borrador_orden');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          fotoRecepcion: null,
          fotoPreview: parsed.fotoPreview || null,
        }));
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

  // Guardar borrador en localStorage
  const saveDraft = (data: Partial<OrderFormData>) => {
    const updated = { ...formData, ...data };
    setFormData(updated);

    // No guardar File objects en localStorage
    const toStore = {
      ...updated,
      fotoRecepcion: null,
    };
    localStorage.setItem('srf_borrador_orden', JSON.stringify(toStore));
  };

  const handleStep1Submit = (data: Partial<OrderFormData>) => {
    saveDraft(data);
    setStep(2);
  };

  const handleStep2Submit = (data: Partial<OrderFormData>) => {
    saveDraft(data);
    setStep(3);
  };

  const handleSubmitOrder = async () => {
    setLoading(true);
    try {
      // Crear orden
      const payload = {
        clientName: formData.clienteNombre,
        clientPhone: formData.clienteTelefono,
        clientEmail: formData.clienteEmail,
        deviceType: formData.dispositivo,
        deviceModel: formData.modelo,
        issue: formData.falla,
        estimatedCost: formData.costo,
        promisedDate: formData.fechaPromesa || undefined,
        includeIva: false,
        checklist: {
          hasCharger: formData.checks.cargador,
          screenCondition: formData.checks.pantalla ? 'OK' : '',
          powersOn: formData.checks.prende,
          backupRequired: formData.checks.respaldo,
          notes: formData.notas,
        },
        metadata: {
          internal_notes: formData.notas,
        },
      };

      const response = await apiClient.post<{ data: { folio: string; id: string } }>(
        '/orders',
        payload,
        getApiOptions()
      );

      let pdfUrl: string | null = null;
      if (formData.fotoRecepcion) {
        try {
          const uploadResponse = await apiClient.upload<{
            success: boolean;
            data: Array<{
              file_type: string;
              public_url: string | null;
            }>;
          }>(
            `/orders/${response.data.id}/attachments`,
            formData.fotoRecepcion,
            { fileType: 'intake_photo' },
            getApiOptions()
          );

          pdfUrl = uploadResponse.data.find((document) => document.file_type === 'receipt_pdf')?.public_url ?? null;
        } catch (uploadError) {
          console.error('Failed to upload intake photo:', uploadError);
        }
      }

      setSavedFolio(response.data.folio);
      setSavedPdfUrl(pdfUrl);
      setStep(4);

      // Limpiar borrador
      localStorage.removeItem('srf_borrador_orden');
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Error al guardar la orden. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrder = () => {
    setFormData({
      clienteNombre: '',
      clienteTelefono: '',
      clienteEmail: '',
      folioCotizacion: '',
      dispositivo: '',
      modelo: '',
      falla: '',
      fechaPromesa: '',
      costo: 0,
      notas: '',
      checks: {
        cargador: false,
        pantalla: false,
        prende: false,
        respaldo: false,
      },
      fotoRecepcion: null,
      fotoPreview: null,
    });
    setSavedFolio(null);
    setSavedPdfUrl(null);
    setStep(1);
    localStorage.removeItem('srf_borrador_orden');
  };

  const publicBaseUrl = process.env.NEXT_PUBLIC_WEB_PUBLIC_URL?.replace(/\/$/, "") ?? "";
  const tenantSlug = getTenantSlug();
  const trackingUrl = savedFolio && publicBaseUrl && tenantSlug
    ? `${publicBaseUrl}/${encodeURIComponent(tenantSlug)}/tracking?folio=${encodeURIComponent(savedFolio)}`
    : null;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.28em] text-sky-400/70">Recepción</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-50">Recepción</h1>
        <p className="mt-1 text-sm text-slate-400">{newOrderLabel} de servicio</p>
      </div>

      {/* Steps indicator */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-2">
          <StepIndicator number={1} label={customerLabel} active={step === 1} completed={step > 1} />
          <div className={`h-0.5 w-12 ${step > 1 ? 'bg-sky-400' : 'bg-slate-700'}`} />
          <StepIndicator number={2} label={assetLabel} active={step === 2} completed={step > 2} />
          <div className={`h-0.5 w-12 ${step > 2 ? 'bg-sky-400' : 'bg-slate-700'}`} />
          <StepIndicator number={3} label="Confirmar" active={step === 3} completed={step > 3} />
        </div>
      </div>

      {/* Step content */}
      {step === 1 && (
        <Step1
          data={formData}
          onSubmit={handleStep1Submit}
          onLoadQuote={(folio) => {
            // Cargar datos desde cotización
            const loadQuote = async () => {
              try {
                const response = await apiClient.get<{ data: any }>(
                  `/requests/${folio}`,
                  getApiOptions()
                );
                const request = response.data;
                saveDraft({
                  clienteNombre: request.customer_name,
                  clienteTelefono: request.customer_phone,
                  clienteEmail: request.customer_email || '',
                  dispositivo: request.device_type || '',
                  modelo: request.device_model || '',
                  falla: request.issue_description || '',
                  folioCotizacion: folio,
                });
              } catch (error) {
                console.error('Failed to load quote:', error);
                alert('No se encontró la solicitud');
              }
            };
            loadQuote();
          }}
        />
      )}

      {step === 2 && (
        <Step2
          data={formData}
          onSubmit={handleStep2Submit}
          onBack={() => setStep(1)}
          onUpdate={saveDraft}
        />
      )}

      {step === 3 && (
        <Step3
          data={formData}
          onSubmit={handleSubmitOrder}
          onBack={() => setStep(2)}
          loading={loading}
        />
      )}

      {step === 4 && savedFolio && (
        <Success
          folio={savedFolio}
          customerPhone={formData.clienteTelefono}
          pdfUrl={savedPdfUrl}
          trackingUrl={trackingUrl}
          onNewOrder={handleNewOrder}
        />
      )}
    </div>
  );
}

function StepIndicator({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`
          w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all
          ${active ? 'bg-sky-400 text-white shadow-lg' : ''}
          ${completed ? 'bg-green-500 text-white' : ''}
          ${!active && !completed ? 'bg-slate-900 text-slate-400 border border-slate-700' : ''}
        `}
      >
        {completed ? <CheckCircle className="w-5 h-5" /> : number}
      </div>
      <span className={`text-xs ${active ? 'font-semibold text-sky-400' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  );
}

import { CheckCircle } from 'lucide-react';
