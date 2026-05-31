import Link from "next/link";
import { useEffect, useState } from "react";

type TenantInfo = {
  name: string;
  description?: string;
};

export default function Home() {
  const tenantSlug = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG?.trim() || '';
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantSlug) {
      setLoading(false);
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/${tenantSlug}`)
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then(data => setTenant(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  if (!tenantSlug) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_32%),linear-gradient(180deg,#08111f_0%,#091428_46%,#070b14_100%)] px-4 py-8 text-zinc-100">
        <div className="text-center p-8 rounded-[2rem] border border-zinc-800/70 bg-zinc-950/85 shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
          <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-50 mb-4">Servicio no disponible</h1>
          <p className="text-sm text-zinc-400 max-w-sm">
            No se pudo identificar el taller. Por favor, verifica el enlace o contacta a soporte si el problema persiste.
          </p>
        </div>
      </main>
    );
  }

  if (loading) {
    return <p className="text-center mt-4">Cargando datos del tenant…</p>;
  }

  if (error) {
    return (
      <p className="text-red-500 mt-4">Error al cargar el tenant: {error}</p>
    );
  }

  if (!tenant) {
    return (
      <p className="text-center mt-4">
        No se encontró información para el tenant “{tenantSlug}”.
      </p>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_32%),radial-gradient(circle_at_80%_10%,_rgba(249,115,22,0.10),_transparent_24%),linear-gradient(180deg,#08111f_0%,#091428_46%,#070b14_100%)] px-4 py-8 text-zinc-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 rounded-[2rem] border border-zinc-800/70 bg-zinc-950/85 p-8 shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
        <header className="flex flex-col gap-5 rounded-[1.8rem] border border-zinc-800 bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(10,10,12,0.96))] p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-zinc-50 sm:text-6xl">
              {tenant.name}
            </h1>
            {tenant.description && (
              <p className="mt-4 text-lg leading-8 text-zinc-300">
                {tenant.description}
              </p>
            )}
          </div>
          <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300/80">Acceso rápido</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/${tenantSlug}`} className="inline-flex items-center justify-center rounded-2xl border border-sky-400/70 bg-sky-500 px-5 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:bg-sky-400">
                Ver landing
              </Link>
              <Link href={`/${tenantSlug}/portal`} className="inline-flex items-center justify-center rounded-2xl border border-orange-400/80 bg-zinc-50 px-5 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-zinc-950 transition hover:-translate-y-0.5 hover:bg-zinc-100">
                Ver estado
              </Link>
            </div>
          </div>
        </header>


      </section>
    </main>
  );
}
