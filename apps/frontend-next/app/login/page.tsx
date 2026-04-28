'use client';
import type { Session } from "@/lib/session";
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { persistSession, isValidSession, clearSession } from '@/lib/session';
import { LogIn, Lock, Mail, AlertCircle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post<Session>('/api/auth/login', {
        email,
        password
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Credenciales inválidas');
      }

      const typedSession = response.data;
      if (!isValidSession(typedSession)) {
        throw new Error('La sesión recibida es inválida.');
      }

      persistSession(typedSession);
      router.push('/dashboard');
    } catch (e: unknown) {
      clearSession();
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#05080F] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1F7EDC]/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/5 blur-[120px] rounded-full" />
      
      <section className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#1F7EDC] to-[#2FA4FF] shadow-lg shadow-blue-500/20 mb-6">
             <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">SDMX</h1>
          <p className="text-slate-400 text-sm font-medium tracking-wide uppercase">Software de Gestión para Talleres</p>
        </div>

        <div className="srf-card p-8 md:p-10">
          <h2 className="text-2xl font-black text-white mb-8">Iniciar sesión</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="tu@correo.com" 
                  type="email" 
                  required 
                  className="srf-input pl-12 h-14"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contraseña</label>
                <a href="#" className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors">¿Olvidaste?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  type="password" 
                  required 
                  className="srf-input pl-12 h-14"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full srf-btn-primary py-5 text-lg font-black uppercase tracking-[0.1em] shadow-xl shadow-orange-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn className="h-5 w-5" /> Acceder al Panel</>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-500 text-sm">
              ¿No tienes una cuenta? {' '}
              <a href="/register" className="text-white font-black hover:text-blue-400 transition-colors">Regístrate</a>
            </p>
          </div>
        </div>
        
        <footer className="mt-8 text-center">
          <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">
            Desarrollado por Servicios Digitales MX
          </p>
        </footer>
      </section>
    </main>
  );
}
