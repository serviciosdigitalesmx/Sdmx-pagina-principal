import { HelpChat } from '@/components/help-chat';

export default function HomePage() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'New Project 21';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'fixi@serviciosdigitalesmx.online';

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="max-w-3xl space-y-6">
            <p className="text-sm uppercase tracking-[0.35em] text-emerald-400">
              SaaS multi-tenant
            </p>
            <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">{appName}</h1>
            <p className="max-w-2xl text-lg leading-8 text-zinc-300">
              El sistema operativo para talleres que ya no compiten por precio. Una experiencia
              más precisa, conectada por variables de entorno y lista para integrarse con una API
              en Render y Supabase.
            </p>
            <div className="flex flex-col gap-3 text-sm text-zinc-300">
              <div>
                <span className="text-zinc-500">API:</span> {apiUrl || 'No configurada'}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={`mailto:${contactEmail}`}
                className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-400/20"
              >
                Enviar correo
              </a>
              <a
                href={`mailto:${contactEmail}`}
                className="text-sm font-medium text-zinc-300 underline decoration-zinc-600 decoration-1 underline-offset-4 transition hover:text-white hover:decoration-zinc-400"
              >
                {contactEmail}
              </a>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Señal clave</p>
                <p className="mt-2 text-sm leading-6 text-zinc-200">
                  Arquitectura segura con datos aislados por taller.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Promesa</p>
                <p className="mt-2 text-sm leading-6 text-zinc-200">
                  Tu información nunca se mezcla con la de otros talleres.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="/signup"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
              >
                Crear cuenta
              </a>
              <a
                href="/login"
                className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
              >
                Iniciar sesión
              </a>
            </div>
            <p className="text-sm text-zinc-400">
              ¿Quieres una demo? Solicítala por correo o crea una cuenta de prueba gratis por 14
              días con acceso completo.
            </p>
          </div>

          <HelpChat />
        </div>
      </section>
    </main>
  );
}
