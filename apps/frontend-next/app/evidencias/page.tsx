'use client';
import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { SaasShell } from '@/components/ui/SaasShell';
import { Database, FileUp, Link as LinkIcon, AlertCircle } from 'lucide-react';

type SignedUploadResponse = {
  signedUrl?: string;
  url?: string;
};

export default function Page() {
  const [bucket, setBucket] = useState('evidences');
  const [path, setPath] = useState('');
  const [result, setResult] = useState<SignedUploadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sign = async () => {
    if (!path) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await apiClient.post('/api/evidences/signed-upload', {
        bucket,
        path,
        expiresInSeconds: 600
      });
      
      if (response.success) {
        setResult((response.data as SignedUploadResponse) ?? null);
      } else {
        setError(response.error?.message || 'Error al generar firma');
      }
    } catch (e) {
      setError('Error de comunicación con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SaasShell 
      title="Gestión de Evidencias" 
      subtitle="Generación de URLs firmadas para carga segura de archivos"
    >
      <div className="max-w-3xl mx-auto space-y-8">
        <section className="srf-card p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Database className="h-3 w-3" /> Storage Bucket
              </label>
              <input 
                value={bucket} 
                onChange={(e) => setBucket(e.target.value)} 
                className="srf-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <FileUp className="h-3 w-3" /> Ruta del Archivo
              </label>
              <input 
                value={path} 
                onChange={(e) => setPath(e.target.value)} 
                placeholder="tenant/evidencia_01.jpg"
                className="srf-input"
              />
            </div>
          </div>

          <button 
            onClick={sign} 
            disabled={loading || !path}
            className="w-full srf-btn-primary py-4 flex items-center justify-center gap-3 text-lg"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>Generar Firma de Upload</>
            )}
          </button>
        </section>

        {error && (
          <div className="p-6 srf-card-soft border-red-500/20 bg-red-500/5 flex items-center gap-4 text-red-400">
            <AlertCircle className="h-6 w-6 shrink-0" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {result && (
          <section className="srf-card p-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <header className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-blue-400" /> URL de Carga Generada
              </h2>
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                Válida por 10 minutos
              </span>
            </header>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 overflow-hidden">
               <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Endpoint de Destino</p>
               <div className="text-blue-400 font-mono text-sm break-all leading-relaxed">
                  {result.signedUrl || result.url || 'No disponible'}
               </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
               <div className="srf-card-soft p-4 text-center">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Método</div>
                  <div className="text-white font-bold mt-1">PUT / POST</div>
               </div>
               <div className="srf-card-soft p-4 text-center">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Expiración</div>
                  <div className="text-white font-bold mt-1">600s</div>
               </div>
               <div className="srf-card-soft p-4 text-center">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Seguridad</div>
                  <div className="text-white font-bold mt-1">SSL Encrypted</div>
               </div>
            </div>
          </section>
        )}
      </div>
    </SaasShell>
  );
}
