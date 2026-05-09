'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { uploadImage } from '@/lib/storage';
import ClienteForm from '@/components/equipos/ClienteForm';
import EquipoForm from '@/components/equipos/EquipoForm';
import Confirmacion from '@/components/equipos/Confirmacion';

type CotizacionData = {
  nombre: string;
  telefono: string;
  email: string;
  dispositivo: string;
  modelo: string;
  descripcion: string;
  urgencia: string;
};

type OrdenRecepcion = {
  cliente_telefono: string;
  folio: string;
};

type FormPatch = Record<string, unknown>;

export default function RecepcionPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [folioCotizacion, setFolioCotizacion] = useState('');
  const [fotoRecepcion, setFotoRecepcion] = useState<File | null>(null);
  const router = useRouter();

  const cargarDesdeCotizacion = async () => {
    if (!folioCotizacion) return;
    const response = await apiClient.get<CotizacionData>(`/api/solicitudes/${folioCotizacion}`);
    if (response.success && response.data) {
      const data = response.data;
      setFormData({
        cliente_nombre: data.nombre,
        cliente_telefono: data.telefono,
        cliente_email: data.email,
        equipo_tipo: data.dispositivo,
        equipo_modelo: data.modelo,
        falla: data.descripcion,
        urgencia: data.urgencia
      });
    }
  };

  const handleSubmit = async (finalData: Record<string, unknown>) => {
    let fotoUrl = null;
    if (fotoRecepcion) fotoUrl = await uploadImage(fotoRecepcion, 'recepciones');
    const response = await apiClient.post<OrdenRecepcion>('/api/equipos', { ...finalData, foto_recepcion_url: fotoUrl });
    if (response.success && response.data) {
      const orden = response.data;
      const waLink = `https://wa.me/${orden.cliente_telefono}?text=¡Hola! Tu orden ${orden.folio} ha sido registrada. Estado: ${window.location.origin}/portal/${orden.folio}`;
      window.open(waLink, '_blank');
      router.push(`/dashboard?folio=${orden.folio}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step>=1?'bg-blue-600':'bg-gray-600'}`}>1</div>
          <div className="w-8 h-1 bg-gray-600"></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step>=2?'bg-blue-600':'bg-gray-600'}`}>2</div>
          <div className="w-8 h-1 bg-gray-600"></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step>=3?'bg-blue-600':'bg-gray-600'}`}>3</div>
        </div>
      </div>
      {step === 1 && <ClienteForm initialData={formData} onNext={(data: FormPatch)=>{setFormData({...formData,...data}); setStep(2);}} onLoadCotizacion={cargarDesdeCotizacion} folioCotizacion={folioCotizacion} setFolioCotizacion={setFolioCotizacion} />}
      {step === 2 && <EquipoForm initialData={formData} onNext={(data: FormPatch)=>{setFormData({...formData,...data}); setStep(3);}} onBack={()=>setStep(1)} onFotoChange={setFotoRecepcion} />}
      {step === 3 && <Confirmacion data={formData} onConfirm={handleSubmit} onBack={()=>setStep(2)} />}
    </div>
  );
}
