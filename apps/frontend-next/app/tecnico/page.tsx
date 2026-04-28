'use client';
import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { SaasShell } from '@/components/ui/SaasShell';
import { Search, Clock, ArrowRight } from 'lucide-react';

interface TimelineEntry {
  id: string;
  from_status: string;
  to_status: string;
  note: string | null;
  created_at: string;
}

export default function Page() {
  const [id, setId] = useState('');
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get<TimelineEntry[]>(`/api/service-orders/${id}/timeline`);
      if (response.success && response.data) {
        setTimeline(response.data);
      } else {
        setError(response.error?.message || 'No se pudo cargar el historial');
      }
    } catch (e) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SaasShell 
      title="Seguimiento Técnico" 
      subtitle="Historial detallado de cambios de estado y notas internas"
    >
      <div className="space-y-8">
        <section className="srf-card p-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input 
                value={id} 
                onChange={(e) => setId(e.target.value)} 
                placeholder="Ingresa el ID de la orden de servicio..."
                className="srf-input pl-12"
              />
            </div>
            <button 
              onClick={load} 
              disabled={loading || !id}
              className="srf-btn-primary px-10 py-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Consultar Historial</>
              )}
            </button>
          </div>
        </section>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {error}
          </div>
        )}

        <section className="relative">
          {timeline.length > 0 ? (
            <div className="space-y-6">
              {timeline.map((entry, index) => (
                <div key={entry.id} className="flex gap-6 group">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform shadow-lg">
                      <Clock className="h-5 w-5" />
                    </div>
                    {index !== timeline.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-blue-500/30 to-transparent my-2" />
                    )}
                  </div>
                  
                  <div className="flex-1 srf-card-soft p-6 group-hover:border-blue-500/40 transition-colors">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {entry.from_status}
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-600" />
                        <span className="px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-[10px] font-black uppercase tracking-widest text-orange-400">
                          {entry.to_status}
                        </span>
                      </div>
                      <time className="text-xs font-medium text-slate-500">
                        {new Date(entry.created_at).toLocaleString('es-MX', { 
                          dateStyle: 'long', 
                          timeStyle: 'short' 
                        })}
                      </time>
                    </div>

                    {entry.note ? (
                      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                        <p className="text-slate-300 text-sm leading-relaxed">
                          {entry.note}
                        </p>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm italic">Sin observaciones adicionales.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : !loading && id ? (
            <div className="text-center py-20 srf-card-soft opacity-60">
               <p className="text-slate-400 font-medium">No se encontraron eventos para esta orden.</p>
               <p className="text-slate-600 text-xs mt-1">Verifica que el ID sea correcto.</p>
            </div>
          ) : null}
        </section>
      </div>
    </SaasShell>
  );
}
