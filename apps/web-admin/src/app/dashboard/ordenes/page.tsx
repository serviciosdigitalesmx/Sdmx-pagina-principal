"use client";

import React, { useState } from 'react';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const tenantId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'tenant-local';
const authToken = process.env.NEXT_PUBLIC_DEFAULT_API_TOKEN || '';

export default function OrdenesPage() {
  const [step, setStep] = useState(1);
  const [folio, setFolio] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    deviceType: '',
    deviceModel: '',
    issue: '',
    quoteFolio: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    // Basic validation before next step
    if (step === 1 && (!formData.clientName || formData.clientPhone.length < 10)) {
      setErrorMsg('Nombre y WhatsApp (10 dígitos) son obligatorios.');
      return;
    }
    if (step === 2 && (!formData.deviceType || !formData.deviceModel || !formData.issue)) {
      setErrorMsg('Todos los campos del equipo son obligatorios.');
      return;
    }
    setErrorMsg('');
    setStep(prev => Math.min(prev + 1, 3));
  };
  
  const prevStep = () => {
    setErrorMsg('');
    setStep(prev => Math.max(prev - 1, 1));
  };

  const finishOrder = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      if (!authToken) {
        throw new Error('NEXT_PUBLIC_DEFAULT_API_TOKEN is required to submit orders');
      }

      const response = await fetch(`${apiBaseUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar la orden');
      }

      setFolio(result.data?.folio || 'ORD-ERROR');
      setStep(4);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al guardar la orden');
    } finally {
      setLoading(false);
    }
  };

  const restartOrder = () => {
    setFolio('');
    setFormData({
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      deviceType: '',
      deviceModel: '',
      issue: '',
      quoteFolio: ''
    });
    setStep(1);
    setErrorMsg('');
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-4 text-white">
      <header className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center font-bold">
            <i className="fas fa-clipboard-list"></i>
          </div>
          <h2 className="text-xl font-bold text-blue-500 flex items-center gap-2">
            Nueva Orden de Servicio
          </h2>
          <p className="text-xs text-gray-400">Recepción profesional</p>
        </div>
      </header>

      {/* ERROR MSG */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm">
          {errorMsg}
        </div>
      )}

      {/* PASOS */}
      {step < 4 && (
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-500'}`}>1</div>
            <div className={`w-8 h-1 opacity-30 ${step >= 2 ? 'bg-blue-500' : 'bg-gray-800'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-500'}`}>2</div>
            <div className={`w-8 h-1 opacity-30 ${step >= 3 ? 'bg-blue-500' : 'bg-gray-800'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-500'}`}>3</div>
          </div>
        </div>
      )}

      {/* PASO 1 */}
      {step === 1 && (
        <div className="bg-gray-900 rounded-xl p-6 shadow-xl border border-gray-800">
          <div className="bg-gray-800 border border-blue-500/30 rounded-lg p-4 mb-6">
            <label className="block text-sm text-gray-400 mb-2 font-semibold">
              Cargar por folio de cotización (opcional)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="text" name="quoteFolio" value={formData.quoteFolio} onChange={handleChange} placeholder="Ej: COT-00001" className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-3 uppercase text-white outline-none focus:border-blue-500" />
              <button className="bg-blue-600 hover:bg-blue-700 font-bold py-3 px-4 rounded-lg whitespace-nowrap transition-colors">
                Cargar folio
              </button>
            </div>
          </div>

          <h3 className="text-lg font-bold text-blue-500 mb-4 flex items-center gap-2">
             Datos del Cliente
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nombre completo <span className="text-red-500">*</span></label>
              <input type="text" name="clientName" value={formData.clientName} onChange={handleChange} placeholder="Ej: Juan Pérez" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">WhatsApp <span className="text-red-500">*</span> <span className="text-xs">(10 dígitos)</span></label>
              <input type="tel" name="clientPhone" value={formData.clientPhone} onChange={handleChange} placeholder="5512345678" maxLength={10} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email <span className="text-gray-500">(opcional)</span></label>
              <input type="email" name="clientEmail" value={formData.clientEmail} onChange={handleChange} placeholder="cliente@email.com" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500" />
            </div>
          </div>
          <button onClick={nextStep} className="bg-orange-500 hover:bg-orange-600 w-full font-bold py-3 rounded-lg mt-6 transition-colors">
            Continuar
          </button>
        </div>
      )}

      {/* PASO 2 */}
      {step === 2 && (
        <div className="bg-gray-900 rounded-xl p-6 shadow-xl border border-gray-800">
          <h3 className="text-lg font-bold text-blue-500 mb-4">Información del Equipo</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tipo de dispositivo <span className="text-red-500">*</span></label>
              <select name="deviceType" value={formData.deviceType} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500">
                <option value="">Selecciona...</option>
                <option value="Smartphone">Smartphone</option>
                <option value="Tablet">Tablet</option>
                <option value="Laptop">Laptop</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Marca y modelo <span className="text-red-500">*</span></label>
              <input type="text" name="deviceModel" value={formData.deviceModel} onChange={handleChange} placeholder="Ej: iPhone 13 Pro" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Falla reportada <span className="text-red-500">*</span></label>
              <textarea name="issue" value={formData.issue} onChange={handleChange} placeholder="Describe el problema" rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500"></textarea>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={prevStep} className="flex-1 bg-gray-800 hover:bg-gray-700 font-bold py-3 rounded-lg border border-gray-600 transition-colors">
              Atrás
            </button>
            <button onClick={nextStep} className="flex-1 bg-orange-500 hover:bg-orange-600 font-bold py-3 rounded-lg transition-colors">
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* PASO 3 */}
      {step === 3 && (
        <div className="bg-gray-900 rounded-xl p-6 shadow-xl border border-gray-800">
          <h3 className="text-lg font-bold text-blue-500 mb-4">Confirmar Orden</h3>
          <div className="bg-gray-800 rounded-lg p-4 mb-6 space-y-3 text-sm border border-gray-700">
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Cliente:</span>
              <span className="text-white font-medium">{formData.clientName}</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Teléfono:</span>
              <span className="text-white">{formData.clientPhone}</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Equipo:</span>
              <span className="text-white">{formData.deviceModel} ({formData.deviceType})</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Falla:</span>
              <span className="text-white truncate max-w-[150px]">{formData.issue}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={prevStep} disabled={loading} className="flex-1 bg-gray-800 hover:bg-gray-700 font-bold py-3 rounded-lg border border-gray-600 transition-colors disabled:opacity-50">
              Corregir
            </button>
            <button onClick={finishOrder} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 font-bold py-3 rounded-lg transition-colors disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar Orden'}
            </button>
          </div>
        </div>
      )}

      {/* EXITO */}
      {step === 4 && (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-blue-500 mb-2">¡Orden Registrada!</h2>
          <p className="text-gray-400 mb-4">El folio generado es:</p>
          <div className="border-2 border-orange-500 rounded-xl p-6 max-w-xs mx-auto mb-6">
            <span className="text-3xl font-mono font-bold text-orange-500">{folio}</span>
          </div>
          <button onClick={restartOrder} className="bg-blue-600 hover:bg-blue-700 font-bold py-3 px-8 rounded-lg">
            Nueva Orden
          </button>
        </div>
      )}
    </div>
  );
}
