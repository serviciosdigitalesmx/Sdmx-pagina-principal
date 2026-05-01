'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, AlertCircle, UserPlus, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { hydrateSessionFromSupabase } from '@/lib/hydrateSession';
import { persistSession } from '@/lib/session';

const GoogleMark = () => (
  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1F7EDC] text-[11px] font-black leading-none text-white shadow-[0_0_12px_rgba(31,126,220,.3)]">
    G
  </span>
);

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [shopName, setShopName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = getSupabaseClient();
      const tenantSlug = shopName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-') || 'default';
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            shop_name: shopName,
            shop_slug: tenantSlug,
            tenant_slug: tenantSlug
          }
        }
      });
      if (error) throw error;
      if (data.session) {
        const session = await hydrateSessionFromSupabase();
        persistSession(session);
        router.push('/hub');
        return;
      }
      alert('Usuario creado con éxito. Revisa tu correo o inicia sesión para entrar al panel.');
      router.push('/login');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleRegister = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) throw error;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#05080F] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1F7EDC]/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/5 blur-[120px] rounded-full" />

      <section className="w-full max-w-2xl z-10">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#1F7EDC] to-[#2FA4FF] shadow-lg shadow-blue-500/20 mb-6">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Fixi</h1>
          <p className="text-slate-400 text-sm font-medium tracking-wide uppercase">Registro con prueba gratuita de 15 días</p>
        </div>

        <div className="srf-card p-8 md:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-11 w-11 rounded-2xl bg-[#1F7EDC]/15 border border-[#1F7EDC]/30 flex items-center justify-center text-[#2FA4FF]">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Registro de Usuario</h2>
              <p className="text-slate-400 text-sm">Crea tu tenant y entra con acceso completo al periodo de prueba.</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-sm font-bold flex items-center gap-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Nombre completo</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre"
                required
                className="srf-input h-14 text-white placeholder:text-slate-500 bg-[#101827] border-[#284b7d]"
              />
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Nombre de tu negocio</label>
              <input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Taller Ejemplo"
                required
                className="srf-input h-14 text-white placeholder:text-slate-500 bg-[#101827] border-[#284b7d]"
              />
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Correo</label>
              <div className="relative">
                {!email && <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />}
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  type="email"
                  required
                  className={`srf-input h-14 text-white placeholder:text-slate-500 bg-[#101827] border-[#284b7d] ${email ? 'pl-4' : 'pl-12'}`}
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Contraseña</label>
              <div className="relative">
                {!password && <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />}
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`srf-input h-14 text-white placeholder:text-slate-500 bg-[#101827] border-[#284b7d] ${password ? 'pl-4 pr-12' : 'pl-12 pr-12'}`}
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

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full srf-btn-primary py-5 text-lg font-black uppercase tracking-[0.1em] shadow-xl shadow-orange-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" /> Crear cuenta
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">o regístrate con</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            type="button"
            onClick={onGoogleRegister}
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
              ¿Ya tienes una cuenta?{' '}
              <a href="/login" className="text-white font-black hover:text-blue-400 transition-colors">Volver al login</a>
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
