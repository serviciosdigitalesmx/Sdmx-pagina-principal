'use client';
import { useEffect, useState } from 'react';
import { SaasShell } from '@/components/ui/SaasShell';
import { apiClient } from '@/lib/apiClient';
import { ClipboardList, PlusCircle, Smartphone, User, Settings, Clock, Search, X } from 'lucide-react';

interface ServiceOrder {
  id: string;
  folio: string;
  customer_id: string;
  device_type: string;
  device_brand: string;
  device_model: string;
  status: string;
  created_at: string;
}

interface Customer {
  id: string;
  full_name: string;
}

export default function RecepcionPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [reportedIssue, setReportedIssue] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, customersRes] = await Promise.all([
        apiClient.get<ServiceOrder[]>('/api/service-orders'),
        apiClient.get<Customer[]>('/api/customers')
      ]);

      if (ordersRes.success && ordersRes.data) setOrders(ordersRes.data);
      if (customersRes.success && customersRes.data) setCustomers(customersRes.data);
      
    } catch (e) {
      setError('Error al sincronizar datos de recepción');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/api/service-orders', {
        customerId,
        deviceType,
        deviceBrand,
        deviceModel,
        reportedIssue
      });

      if (response.success) {
        setShowForm(false);
        void loadData();
        setCustomerId('');
        setDeviceType('');
        setDeviceBrand('');
        setDeviceModel('');
        setReportedIssue('');
      } else {
        setError(response.error?.message || 'Error al procesar el ingreso del equipo');
      }
    } catch (e) {
      setError('Error de comunicación con el centro de control');
    }
  };

  return (
    <SaasShell title="Recepción de Equipos" subtitle="Ingreso de nuevas órdenes de servicio y seguimiento operativo.">
       <div className="space-y-6">
          <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/5">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input placeholder="Buscar por folio o equipo..." className="srf-input pl-10 py-2 text-sm bg-slate-950/50 border-none ring-1 ring-white/10" />
            </div>
            <button 
              onClick={() => setShowForm(!showForm)}
              className="w-full md:w-auto srf-btn-primary px-8 py-3 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest shadow-lg shadow-orange-500/20"
            >
              {showForm ? <><X className="h-4 w-4" /> Cancelar</> : <><PlusCircle className="h-4 w-4" /> Nueva Orden</>}
            </button>
          </header>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}

          {showForm && (
            <section className="srf-card p-8 animate-in fade-in slide-in-from-top-4 duration-300">
               <h2 className="text-xl font-black text-white mb-6">Nueva Orden de Servicio</h2>
               <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Seleccionar Cliente</label>
                    <select 
                      value={customerId} 
                      onChange={(e) => setCustomerId(e.target.value)} 
                      required
                      className="srf-input appearance-none bg-slate-950/50"
                    >
                      <option value="">Buscar cliente...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo de Dispositivo</label>
                    <input value={deviceType} onChange={(e) => setDeviceType(e.target.value)} placeholder="Ej. Laptop, Smartphone, Consola" className="srf-input" required />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Marca</label>
                    <input value={deviceBrand} onChange={(e) => setDeviceBrand(e.target.value)} placeholder="Ej. Apple, Samsung, Dell" className="srf-input" required />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Modelo / Versión</label>
                    <input value={deviceModel} onChange={(e) => setDeviceModel(e.target.value)} placeholder="Ej. iPhone 15 Pro, XPS 13" className="srf-input" required />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Falla Reportada por el Cliente</label>
                    <textarea 
                      value={reportedIssue} 
                      onChange={(e) => setReportedIssue(e.target.value)} 
                      placeholder="Describe detalladamente el síntoma o daño..." 
                      className="srf-input min-h-[120px] py-4 leading-relaxed"
                      required 
                    />
                  </div>
                  <button type="submit" className="srf-btn-primary py-5 md:col-span-2 text-lg font-black mt-2">
                    Generar Folio de Ingreso
                  </button>
               </form>
            </section>
          )}

          <section className="srf-card overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="border-b border-white/5 bg-slate-900/40">
                         <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Folio / ID</th>
                         <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Cliente</th>
                         <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Equipo</th>
                         <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Estado</th>
                         <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Fecha</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {loading ? (
                         [1,2,3].map(i => (
                           <tr key={i} className="animate-pulse">
                             <td colSpan={5} className="px-8 py-10"><div className="h-4 bg-slate-800/50 rounded-full w-full"></div></td>
                           </tr>
                         ))
                      ) : orders.length > 0 ? (
                        orders.map(o => (
                          <tr key={o.id} className="hover:bg-blue-500/5 transition-colors group cursor-pointer">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-2">
                                  <ClipboardList className="h-4 w-4 text-blue-500/50" />
                                  <span className="font-black text-blue-400 uppercase tracking-widest">{o.folio}</span>
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-2 text-sm text-slate-300 font-bold">
                                  <User className="h-3.5 w-3.5 text-slate-500" />
                                  {customers.find(c => c.id === o.customer_id)?.full_name || 'Desconocido'}
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2 text-sm text-white font-bold">
                                     <Smartphone className="h-3.5 w-3.5 text-slate-500" />
                                     {o.device_brand} {o.device_model}
                                  </div>
                                  <div className="text-[10px] uppercase tracking-widest text-slate-500 ml-5">{o.device_type}</div>
                               </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                               <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                  o.status === 'recibido' ? 'srf-badge-blue' : 'srf-badge-green'
                               }`}>
                                  {o.status}
                               </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <div className="flex items-center justify-end gap-2 text-xs text-slate-500 font-bold">
                                  <Clock className="h-3.5 w-3.5" />
                                  {new Date(o.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                               </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-8 py-32 text-center text-slate-600 font-black uppercase tracking-widest text-sm opacity-50 italic">
                            Sin movimientos recientes
                          </td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </section>
       </div>
    </SaasShell>
  );
}
