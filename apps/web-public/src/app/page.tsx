import Link from "next/link";
import { HeroButton, ShellBadge, StatCard, srFixTheme } from "@/components/srfix-theme";
import { requireEnv } from "@white-label/config";

const productName = requireEnv("NEXT_PUBLIC_SAAS_BRAND_NAME");
const legalName = requireEnv("NEXT_PUBLIC_SAAS_LEGAL_NAME");
const demoTenantSlug = requireEnv("NEXT_PUBLIC_SAAS_DEMO_TENANT_SLUG");
const quoteHref = `/${encodeURIComponent(demoTenantSlug)}/cotizar`;
const portalHref = `/t/${encodeURIComponent(demoTenantSlug)}/portal`;

const metrics = [
  { value: "1", label: "Experiencia por tenant" },
  { value: "3", label: "Landing + portal + cotizador" },
  { value: "100%", label: "Datos reales de Supabase" },
  { value: "RLS", label: "Aislamiento por tenant_id" },
];

const modules = [
  { title: "Portal del cliente", copy: "El cliente consulta su folio, timeline, evidencia y documentos sin perder el contexto del taller." },
  { title: "Cotizador", copy: "Captura rápida del caso para convertir visitas en solicitudes y luego en órdenes reales." },
  { title: "Tracking", copy: "Consulta pública por folio con estado, seguimiento y acceso directo a WhatsApp." },
  { title: "Integrador", copy: "El panel interno coordina ordenes, stock, finanzas, compras y sucursales por tenant." },
];

export default function Home() {
  return (
    <main className="min-h-screen text-zinc-100" style={{ background: srFixTheme.background }}>
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-amber-700/15 bg-[linear-gradient(180deg,rgba(16,14,12,0.96),rgba(14,13,12,0.92))] px-5 py-4 shadow-[0_20px_70px_rgba(120,53,15,0.18)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-700/20 bg-[linear-gradient(180deg,rgba(124,45,18,0.22),rgba(15,23,42,0.96))] text-sm font-black text-amber-50">
                FX
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.42em] text-amber-100">FIXI</p>
                <p className="mt-1 text-sm text-zinc-400">{legalName}</p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
              <a className="rounded-full border border-stone-700 px-4 py-2 transition hover:border-amber-700/30 hover:bg-white/4" href="#producto">Producto</a>
              <a className="rounded-full border border-stone-700 px-4 py-2 transition hover:border-amber-700/30 hover:bg-white/4" href="#integrador">Integrador</a>
              <a className="rounded-full border border-stone-700 px-4 py-2 transition hover:border-amber-700/30 hover:bg-white/4" href="#contacto">Contacto</a>
              <Link className="rounded-full border border-amber-700/30 bg-amber-500/10 px-5 py-3 font-semibold text-amber-50 transition hover:border-amber-300/40 hover:bg-amber-500/15" href="/onboarding">
                Crear mi tenant
              </Link>
            </nav>
          </div>
        </header>

        <section className="rounded-[2.5rem] border border-amber-700/15 bg-[linear-gradient(180deg,rgba(16,14,12,0.96),rgba(22,18,14,0.98))] px-5 py-8 shadow-[0_30px_120px_rgba(120,53,15,0.16)] lg:px-8 lg:py-12">
          <div className="mx-auto max-w-5xl text-center">
            <ShellBadge>Landing + portal + cotizador</ShellBadge>
            <h1 className="mx-auto mt-6 max-w-4xl text-balance text-5xl font-black tracking-[-0.07em] text-stone-50 sm:text-6xl lg:text-7xl">
              {productName} conserva la experiencia del taller, pero la vuelve escalable por tenant.
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-zinc-300 sm:text-lg">
              Cada tenant tiene su propia landing, su portal público y su operación interna, conectados a Supabase y al API real. El cliente ve su taller, no una plantilla genérica.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <HeroButton href={quoteHref}>Ir al cotizador</HeroButton>
              <HeroButton href={portalHref} secondary>
                Entrar al panel del cliente
              </HeroButton>
              <HeroButton href="/onboarding" secondary>
                Crear mi tenant
              </HeroButton>
            </div>
            <p className="mt-4 text-sm text-zinc-400">
              Demo pública configurada para el tenant <span className="font-semibold text-zinc-200">{demoTenantSlug}</span>.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric) => (
                <StatCard key={metric.label} value={metric.value} label={metric.label} />
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <article className="rounded-[1.75rem] border border-stone-700/70 bg-white/4 p-6 shadow-[0_16px_60px_rgba(0,0,0,0.24)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-100/70">Cotizador</p>
            <h2 className="mt-3 text-2xl font-bold text-zinc-50">Enviar una solicitud real al taller</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              El cliente captura su nombre, contacto, equipo y falla para generar un folio real y dejarlo listo para recepción.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <HeroButton href={quoteHref}>Abrir cotizador</HeroButton>
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-stone-700/70 bg-white/4 p-6 shadow-[0_16px_60px_rgba(0,0,0,0.24)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-100/70">Panel del cliente</p>
            <h2 className="mt-3 text-2xl font-bold text-zinc-50">Consultar folio, timeline y evidencia</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              El cliente entra al portal del taller para revisar su orden sin mezclar información con otros tenants.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <HeroButton href={portalHref} secondary>
                Abrir portal
              </HeroButton>
            </div>
          </article>
        </section>

        <section id="producto" className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((module) => (
            <article key={module.title} className="rounded-[1.75rem] border border-stone-700/70 bg-white/4 p-6 shadow-[0_16px_60px_rgba(0,0,0,0.24)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-100/70">Módulo</p>
              <h2 className="mt-3 text-2xl font-bold text-zinc-50">{module.title}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-300">{module.copy}</p>
            </article>
          ))}
        </section>

        <section id="integrador" className="grid gap-6 rounded-[2rem] border border-amber-700/15 bg-[linear-gradient(180deg,rgba(16,14,12,0.96),rgba(22,18,14,0.98))] p-6 shadow-[0_16px_70px_rgba(0,0,0,0.24)] lg:grid-cols-[1fr_0.95fr] lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-100/70">Contrato visual</p>
            <h2 className="mt-3 text-3xl font-bold text-zinc-50 [font-family:var(--font-cormorant)]">
              La experiencia pública sigue la línea del prototipo, sin tocar el multitenant.
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">
              Cada taller conserva su branding, sus colores y sus contenidos desde `tenants.branding` y `tenants.landing_content`. Lo que cambia es la narrativa: menos SaaS genérico, más operación real.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="rounded-[1.5rem] border border-stone-700/70 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Público</p>
              <p className="mt-2 text-sm text-zinc-300">Landing, cotizador y tracking muestran la operación del taller en una sola experiencia.</p>
            </div>
            <div className="rounded-[1.5rem] border border-stone-700/70 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Cliente</p>
              <p className="mt-2 text-sm text-zinc-300">El portal entrega folio, evidencia, timeline y documentos reales del tenant.</p>
            </div>
            <div className="rounded-[1.5rem] border border-stone-700/70 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Interno</p>
              <p className="mt-2 text-sm text-zinc-300">El integrador organiza las pestañas del producto como el contrato de Señor Fix.</p>
            </div>
          </div>
        </section>

        <section id="contacto" className="rounded-[2rem] border border-amber-700/15 bg-[linear-gradient(180deg,rgba(16,14,12,0.96),rgba(22,18,14,0.98))] p-6 shadow-[0_16px_70px_rgba(0,0,0,0.24)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-100/70">Contacto</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-stone-700/70 bg-white/4 p-5">
              <p className="text-sm font-semibold text-zinc-50">Tenant real</p>
              <p className="mt-1 text-sm text-zinc-300">Sin mezcla de información entre talleres.</p>
            </div>
            <div className="rounded-[1.5rem] border border-stone-700/70 bg-white/4 p-5">
              <p className="text-sm font-semibold text-zinc-50">API real</p>
              <p className="mt-1 text-sm text-zinc-300">Cotizador, portal y tracking consumen endpoints reales.</p>
            </div>
            <div className="rounded-[1.5rem] border border-stone-700/70 bg-white/4 p-5">
              <p className="text-sm font-semibold text-zinc-50">White-label</p>
              <p className="mt-1 text-sm text-zinc-300">Colores, logos y textos salen de la configuración del taller.</p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
