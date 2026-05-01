'use client';
import { useEffect, useState } from 'react';
import { SaasShell } from '@/components/ui/SaasShell';
import { apiClient } from '@/lib/apiClient';
import { readSession } from '@/lib/session';
import { useAuth } from '@/components/native/AuthGuard';
import { Users, UserPlus, Phone, Mail, Calendar, Search, MoreVertical, X } from 'lucide-react';

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

export default function ClientesPage() {
  const { session: authSession, loading: authLoading } = useAuth();
  const session = authSession ?? readSession();
  const tenantId = session?.shop.id ?? '';
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get<Customer[]>('/api/customers');
      if (response.success && response.data) {
        setCustomers(response.data);
      } else {
        setError(response.error?.message || 'No se pudo cargar el listado de clientes');
      }
    } catch {
      setError('No se pudo cargar el listado de clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!tenantId) {
      setLoading(false);
      setError('No se pudo resolver el tenant activo');
      return;
    }
    void loadData();
  }, [authLoading, tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setError('No se pudo resolver el tenant activo');
      return;
    }
    try {
      const response = await apiClient.post('/api/customers', {
        tenantId,
        fullName,
        email,
        phone
      });
      
      if (response.success) {
        setShowForm(false);
        void loadData();
        setFullName('');
        setEmail('');
        setPhone('');
      } else {
        setError(response.error?.message || 'Error al crear cliente');
      }
    } catch {
      setError('Error crítico al crear cliente');
    }
  };

  return (
    <SaasShell title="Directorio de Clientes" subtitle="Gestión centralizada de contactos y cuentas.">
      <div className="space-y-6">
        {!tenantId && !authLoading && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold">
            No se pudo resolver el tenant activo. Vuelve a iniciar sesión o verifica la sesión actual.
          </div>
        )}

        <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/5">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input placeholder="Buscar por nombre o email..." className="srf-input pl-10 py-2 text-sm bg-slate-950/50 border-none ring-1 ring-white/10" />
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="w-full md:w-auto srf-btn-primary px-8 py-3 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest shadow-lg shadow-orange-500/20"
          >
            {showForm ? <><X className="h-4 w-4" /> Cancelar</> : <><UserPlus className="h-4 w-4" /> Nuevo Cliente</>}
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
            <h2 className="text-xl font-black text-white mb-6">Registro de Nuevo Cliente</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nombre Completo</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ej. Juan Pérez" className="srf-input" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Correo Electrónico</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@ejemplo.com" type="email" className="srf-input" required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Teléfono / WhatsApp</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej. +52 1 81 1234 5678" className="srf-input" />
              </div>
              <button type="submit" className="srf-btn-primary py-5 md:col-span-2 text-lg font-black mt-2">
                Confirmar Registro
              </button>
            </form>
          </section>
        )}

        <section className="srf-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/40">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Identidad</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Información de Contacto</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Fecha Registro</th>
                  <th className="px-8 py-5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                   [1,2,3].map(i => (
                     <tr key={i} className="animate-pulse">
                       <td colSpan={4} className="px-8 py-10"><div className="h-4 bg-slate-800/50 rounded-full w-full"></div></td>
                     </tr>
                   ))
                ) : customers.length > 0 ? (
                  customers.map(c => (
                    <tr key={c.id} className="hover:bg-blue-500/5 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-blue-400 font-black border border-white/5 shadow-inner">
                            {c.full_name.slice(0,1).toUpperCase()}
                          </div>
                          <span className="font-bold text-white group-hover:text-blue-400 transition-colors">{c.full_name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                            <Mail className="h-3.5 w-3.5 text-slate-500" /> {c.email}
                          </div>
                          {c.phone && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Phone className="h-3.5 w-3.5" /> {c.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2.5 text-xs text-slate-500 font-bold uppercase tracking-tighter">
                          <Calendar className="h-3.5 w-3.5 text-blue-500/50" />
                          {new Date(c.created_at).toLocaleDateString('es-MX', { dateStyle: 'long' })}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button className="p-2.5 hover:bg-slate-800 rounded-xl transition-colors text-slate-500 hover:text-white border border-transparent hover:border-white/10">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-32 text-center text-slate-600 font-black uppercase tracking-widest text-sm opacity-50 italic">
                      Base de datos vacía
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
