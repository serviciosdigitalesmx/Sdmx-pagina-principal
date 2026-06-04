"use client";

import { useEffect, useState } from "react";
import { Step1 } from "@/components/operativo/step-1";
import { Step2 } from "@/components/operativo/step-2";
import { Step3 } from "@/components/operativo/step-3";
import { Success } from "@/components/operativo/success";
import { apiClient } from "@/lib/api-client";
import { getApiOptions } from "@/lib/tenant";

export type OrderFormData = {
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string;
  folioCotizacion: string;
  dispositivo: string;
  modelo: string;
  falla: string;
  fechaPromesa: string;
  costo: number;
  notas: string;
  checks: {
    cargador: boolean;
    pantalla: boolean;
    prende: boolean;
    respaldo: boolean;
  };
  fotoRecepcion: File | null;
  fotoPreview: string | null;
};

const initialForm: OrderFormData = {
  clienteNombre: "",
  clienteTelefono: "",
  clienteEmail: "",
  folioCotizacion: "",
  dispositivo: "",
  modelo: "",
  falla: "",
  fechaPromesa: "",
  costo: 0,
  notas: "",
  checks: {
    cargador: false,
    pantalla: false,
    prende: false,
    respaldo: false,
  },
  fotoRecepcion: null,
  fotoPreview: null,
};

export default function OperativoPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savedFolio, setSavedFolio] = useState<string | null>(null);
  const [formData, setFormData] = useState<OrderFormData>(initialForm);

  useEffect(() => {
    const saved = localStorage.getItem("srf_borrador_orden");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          fotoRecepcion: null,
          fotoPreview: parsed.fotoPreview || null,
        }));
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
    }
  }, []);

  const saveDraft = (data: Partial<OrderFormData>) => {
    const updated = { ...formData, ...data };
    setFormData(updated);
    const toStore = { ...updated, fotoRecepcion: null };
    localStorage.setItem("srf_borrador_orden", JSON.stringify(toStore));
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
      let fotoUrl = null;
      if (formData.fotoRecepcion) {
        const uploadResponse = await apiClient.upload<{ publicUrl: string }>("/orders/upload", formData.fotoRecepcion, { fileType: "intake_photo" }, getApiOptions());
        fotoUrl = uploadResponse.publicUrl;
      }

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
          screenCondition: formData.checks.pantalla ? "OK" : "",
          powersOn: formData.checks.prende,
          backupRequired: formData.checks.respaldo,
          notes: formData.notas,
        },
        receiptUrl: fotoUrl,
        metadata: {
          internal_notes: formData.notas,
        },
      };

      const response = await apiClient.post<{ data: { folio: string; id: string } }>("/orders", payload, getApiOptions());
      setSavedFolio(response.data.folio);
      setStep(4);
      localStorage.removeItem("srf_borrador_orden");
    } catch (error) {
      console.error("Failed to create order:", error);
      alert("Error al guardar la orden. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrder = () => {
    setFormData(initialForm);
    setSavedFolio(null);
    setStep(1);
    localStorage.removeItem("srf_borrador_orden");
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Recepción</h1>
        <p className="mt-1 text-sm text-srf-muted">Nueva orden de servicio</p>
      </div>

      <div className="mb-8 flex justify-center">
        <div className="flex items-center gap-2">
          <StepIndicator number={1} label="Cliente" active={step === 1} completed={step > 1} />
          <div className={`h-0.5 w-12 ${step > 1 ? "bg-srf-accent" : "bg-srf-muted/30"}`} />
          <StepIndicator number={2} label="Equipo" active={step === 2} completed={step > 2} />
          <div className={`h-0.5 w-12 ${step > 2 ? "bg-srf-accent" : "bg-srf-muted/30"}`} />
          <StepIndicator number={3} label="Confirmar" active={step === 3} completed={step > 3} />
        </div>
      </div>

      {step === 1 ? (
        <Step1
          data={formData}
          onSubmit={handleStep1Submit}
          onLoadQuote={(folio) => {
            void (async () => {
              try {
                const data = await apiClient.get<{ data: any[] }>("/requests", getApiOptions());
                const request = (data.data || []).find((item) => String(item.folio ?? "").trim().toUpperCase() === folio.toUpperCase());
                if (request) {
                  setFormData((current) => ({
                    ...current,
                    clienteNombre: String(request.customer_name ?? "").trim(),
                    clienteTelefono: String(request.customer_phone ?? "").trim(),
                    clienteEmail: String(request.customer_email ?? "").trim(),
                    dispositivo: String(request.device_type ?? "").trim() || current.dispositivo,
                    modelo: String(request.device_model ?? "").trim() || current.modelo,
                    falla: String(request.issue_description ?? "").trim() || current.falla,
                    folioCotizacion: folio.toUpperCase(),
                    notas: current.notas.trim() ? current.notas : `Origen solicitud: ${folio}`,
                  }));
                } else {
                  alert("No se encontró la solicitud");
                }
              } catch (error) {
                console.error(error);
                alert("No se pudo cargar la solicitud");
              }
            })();
          }}
        />
      ) : null}

      {step === 2 ? (
        <Step2
          data={formData}
          onSubmit={handleStep2Submit}
          onBack={() => setStep(1)}
          onUpdate={(data) => saveDraft(data)}
        />
      ) : null}

      {step === 3 ? (
        <Step3 data={formData} onSubmit={handleSubmitOrder} onBack={() => setStep(2)} loading={loading} />
      ) : null}

      {step === 4 && savedFolio ? <Success folio={savedFolio} customerPhone={formData.clienteTelefono} onNewOrder={handleNewOrder} /> : null}
    </div>
  );
}

function StepIndicator({ number, label, active, completed }: { number: number; label: string; active: boolean; completed: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
          completed ? "bg-green-500 text-white" : active ? "bg-srf-accent text-white" : "border border-srf-primary/30 bg-srf-surface text-srf-muted"
        }`}
      >
        {completed ? "✓" : number}
      </div>
      <span className="text-xs text-srf-muted">{label}</span>
    </div>
  );
}
