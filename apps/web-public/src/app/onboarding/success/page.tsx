import Link from 'next/link';
import { SaveOnboardingToken } from './save-onboarding-token';
import { AutoRedirectToAdmin } from './redirect-to-admin';

const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'srfix.mx';

export default function OnboardingSuccessPage({
  searchParams,
}: {
  searchParams: {
    tenant?: string;
    token?: string;
  };
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#08111f_0%,#0f172a_38%,#f8fafc_38%,#f8fafc_100%)] px-6 py-12 text-slate-950">
      <SaveOnboardingToken token={searchParams.token} />
      <AutoRedirectToAdmin token={searchParams.token} />
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-700">Registro completado</p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Tu prueba gratuita ya quedó creada.
        </h1>
        <p className="text-lg leading-8 text-slate-600">
          {searchParams.tenant ? `Tenant: ${searchParams.tenant}.` : 'El tenant fue creado correctamente.'}{' '}
          La sesión quedó guardada en este navegador.
        </p>
        <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">
          Si quieres seguir probando, abre el panel del taller con la misma sesión.
        </div>
        <div className="flex flex-wrap gap-3">
          {searchParams.tenant ? (
            <Link
              href={`https://${searchParams.tenant}.${baseDomain}`}
              className="rounded-full bg-cyan-600 px-8 py-3 font-semibold text-white shadow-lg shadow-cyan-200 transition hover:bg-cyan-500"
            >
              Ir a mi taller
            </Link>
          ) : null}
          <Link
            href="/"
            className="rounded-full bg-slate-100 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
