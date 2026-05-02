'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { buildAppUrl } from '@/lib/app-url';
import { LogIn, Lock, Mail, AlertCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const GoogleMark = () => (
  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8256f3] text-[11px] font-black leading-none text-white shadow-[0_0_12px_rgba(130,86,243,.28)]">
    G
  </span>
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = getSupabaseClient();
      const { error: signInError, data } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      if (!data.session) throw new Error('No se recibió sesión de Supabase.');
      router.push('/hub');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: buildAppUrl('/auth/callback') }
      });
      if (error) throw error;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#05080F] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#8256f3]/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#f0a23a]/5 blur-[120px] rounded-full" />
      
      <section className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#121826] to-[#8256f3] shadow-lg shadow-violet-500/20 mb-6">
             <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Fixi</h1>
          <p className="text-slate-400 text-sm font-medium tracking-wide uppercase">15 días de prueba gratuita con acceso completo</p>
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
                {!email && <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />}
                <input 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="tu@correo.com" 
                  type="email" 
                  required 
                  className={`srf-input h-14 ${email ? 'pl-4' : 'pl-12'}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contraseña</label>
                <a href="#" className="text-[10px] font-black uppercase tracking-widest text-violet-400 hover:text-violet-300 transition-colors">¿Olvidaste?</a>
              </div>
              <div className="relative">
                {!password && <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />}
                <input 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  className={`srf-input h-14 ${password ? 'pl-4 pr-12' : 'pl-12 pr-12'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:text-white"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
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

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">o continúa con</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={googleLoading}
            className="w-full inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-black text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            {googleLoading ? (
              <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                <GoogleMark />
                Continuar con Google
              </>
            )}
          </button>

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
