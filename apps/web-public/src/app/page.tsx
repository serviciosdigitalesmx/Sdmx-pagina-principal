import Link from "next/link";
import { optionalEnv } from "@white-label/config";
import { RootAuthHashRedirect } from "@/components/root-auth-hash-redirect";
import { resolveAdminUrl } from "@/lib/admin-url";
import { Badge, SurfaceCard } from "@white-label/ui";

const productName = optionalEnv("NEXT_PUBLIC_SAAS_BRAND_NAME") ?? "FIXI";
const brandShort = optionalEnv("NEXT_PUBLIC_SAAS_BRAND_SHORT") ?? "FX";
const hubName = optionalEnv("NEXT_PUBLIC_HUB_NAME") ?? "Hub";
const publicUrl =
  optionalEnv("NEXT_PUBLIC_WEB_PUBLIC_URL") ??
  "https://app.serviciosdigitalesmx.online";
const adminUrl =
  optionalEnv("NEXT_PUBLIC_WEB_ADMIN_URL") ??
  "https://admin.serviciosdigitalesmx.online";
const trialDays = optionalEnv("NEXT_PUBLIC_SAAS_TRIAL_DAYS") ?? "7";
const contactEmail = optionalEnv("NEXT_PUBLIC_SAAS_CONTACT_EMAIL") ?? "";
const contactPhone = optionalEnv("NEXT_PUBLIC_SAAS_CONTACT_PHONE") ?? "";
const adminBaseUrl = resolveAdminUrl();
const adminLoginUrl = adminBaseUrl ? `${adminBaseUrl}/login` : "/login";
const adminOnboardingUrl = adminBaseUrl ? `${adminBaseUrl}/login?mode=signup` : "/login?mode=signup";

const dashboardStats = [
  ["Ingresos del mes", "$1200.00", "positive"],
  ["Egresos del mes", "$0.00", "negative"],
  ["Utilidad bruta", "$1200.00", "positive"],
  ["Productividad", "0%", "warning"],
  ["Órdenes activas", "1", "neutral"],
  ["Stock bajo", "0", "neutral"],
  ["Clientes", "1", "neutral"],
  ["Cuentas por cobrar", "$0.00", "neutral"],
];

const whatsappSteps = [
  ["1. Registras la orden", "FIXI guarda folio, cliente y estado."],
  ["2. Envías por WhatsApp", "Un clic y el cliente recibe su seguimiento."],
  ["3. El cliente consulta solo", "Ya no te persigue por mensaje o llamada."],
];

const receptionChecks = [
  "Condición cosmética",
  "Daño físico reportado",
  "Accesorios recibidos",
  "Aceptación del cliente",
];

const pricingPlans = [
  {
    name: "Básico",
    price: "$300",
    period: "MXN / mes",
    description: "Ideal para arrancar con órdenes, clientes y seguimiento.",
  },
  {
    name: "Profesional",
    price: "$450",
    period: "MXN / mes",
    description: "Para talleres que necesitan inventario, reportes y más control.",
    featured: true,
  },
  {
    name: "Negocio",
    price: "$600",
    period: "MXN / mes",
    description: "Para operación multi-sucursal y administración más completa.",
  },
];

const faqItems = [
  ["¿FIXI sirve para talleres pequeños?", "Sí. Está pensado para operación real, desde una sola sucursal hasta varios puntos de atención."],
  ["¿El seguimiento público está incluido?", "Sí. El cliente consulta su folio desde la web pública del tenant."],
  ["¿Puedo usar mi propio logo?", "Sí. El branding sale de la configuración del tenant y se refleja en toda la superficie."],
  ["¿Hay que cambiar backend o rutas?", "No. Esta versión respeta los contratos y superficies actuales del proyecto."],
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Badge variant="neutral">{children}</Badge>;
}

function CTA({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const base = "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition duration-200";
  const className =
    variant === "primary"
      ? `${base} border border-sky-400/20 bg-sky-500/15 text-sky-100 hover:bg-sky-500/20`
      : `${base} border border-white/10 bg-white/5 text-slate-100 hover:-translate-y-0.5 hover:bg-white/10`;

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200">{children}</span>;
}

function ProductMockup() {
  return (
    <SurfaceCard elevated className="relative p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.14),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(34,211,238,0.1),transparent_26%)]" />
      <div className="relative space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-sky-300/80">{hubName} / Live</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-white">Una pantalla, todo lo que importa</p>
          </div>
          <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">Activo</div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">Hoy</p>
            <div className="mt-4 grid gap-3">
              {dashboardStats.slice(0, 4).map(([label, value, tone]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                  <span className="text-sm text-slate-300">{label}</span>
                  <span className={`text-sm font-semibold ${tone === "positive" ? "text-emerald-400" : tone === "negative" ? "text-rose-400" : tone === "warning" ? "text-amber-300" : "text-sky-200"}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">Flujo visible</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">Recepción → diagnóstico → WhatsApp → cobro. Una ruta corta que el taller sí entiende.</p>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">Control</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">Órdenes activas, stock crítico y cuentas por cobrar en un solo lugar.</p>
            </div>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020617] text-slate-100">
      <RootAuthHashRedirect />

      <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <SurfaceCard elevated className="flex flex-col gap-4 px-5 py-4 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-sky-500/15 text-sm font-black text-sky-100">
              {brandShort.slice(0, 2)}
            </div>
            <div>
              <Badge variant="neutral">SaaS para talleres</Badge>
              <h1 className="text-xl font-semibold tracking-tight text-white">{productName}</h1>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
            <Link href="#producto" className="transition hover:text-white">
              Producto
            </Link>
            <Link href="#modulos" className="transition hover:text-white">
              Módulos
            </Link>
            <Link href="#precios" className="transition hover:text-white">
              Precios
            </Link>
            <Link href="#faq" className="transition hover:text-white">
              FAQ
            </Link>
            <Link href={adminLoginUrl} className="rounded-full px-4 py-2 transition hover:bg-white/5 hover:text-white">
              Iniciar sesión
            </Link>
            <CTA href={adminOnboardingUrl}>Probar {trialDays} días gratis</CTA>
          </nav>
        </SurfaceCard>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-10 pt-3 sm:px-6 lg:px-8 lg:pt-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-8 pt-4 lg:pt-10">
            <Pill>Protege tu taller antes de que haya reclamos</Pill>

            <div className="space-y-5">
              <h2 className="max-w-2xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
                ¿Y si el cliente dice
                <span className="block bg-[linear-gradient(135deg,#7dd3fc_0%,#60a5fa_40%,#2563eb_100%)] bg-clip-text text-transparent">que le rompiste la pantalla?</span>
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                FIXI documenta cada recepción con checklist legal, fotos y firma del cliente. Tu taller queda protegido, tu cliente informado y tu dinero sin fugas.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <CTA href={adminOnboardingUrl}>Probar gratis 14 días</CTA>
              <Link href="#dashboard" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold tracking-[0.12em] text-slate-100 transition hover:bg-white/10">
                Ver cómo funciona
              </Link>
              <CTA href={adminLoginUrl} variant="secondary">
                Entrar al panel
              </CTA>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-6 shadow-[0_24px_80px_rgba(37,99,235,0.14)]">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.3em] text-sky-300/80">{hubName} / Live</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-white">Una pantalla, todo lo que importa</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">El dueño ve si el taller ganó o perdió el día sin abrir Excel ni perseguir reportes.</p>
            </div>
            <div className="mt-4 rounded-[1.6rem] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">Flujo visible</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">Recepción → diagnóstico → WhatsApp → cobro. Una ruta corta que el taller sí entiende.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="dashboard" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="space-y-4">
            <SectionLabel>Tu mañana en el taller</SectionLabel>
            <h3 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Sabe si ganaste o perdiste hoy, sin abrir Excel.</h3>
            <p className="max-w-xl text-base leading-8 text-slate-300">Ingresos, egresos, utilidad, órdenes activas y stock crítico en una sola pantalla que se actualiza sola.</p>
            <p className="max-w-xl text-sm leading-7 text-slate-400">Si manejas 2 sucursales, cambias de vista sin cerrar sesión y sin mezclar datos.</p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-5 shadow-[0_24px_80px_rgba(37,99,235,0.14)]">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {dashboardStats.map(([label, value, tone]) => (
                <div key={label} className="rounded-[1.2rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
                  <p className={`mt-3 text-3xl font-black tracking-tight ${tone === "positive" ? "text-emerald-400" : tone === "negative" ? "text-rose-400" : tone === "warning" ? "text-amber-300" : "text-white"}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="whatsapp" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <SectionLabel>Tu cliente deja de llamarte</SectionLabel>
            <h3 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Envía el seguimiento en 3 clics.</h3>
            <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">Registras la orden, FIXI prepara el mensaje y el cliente recibe su folio por WhatsApp para consultar el estado cuando quiera.</p>
            <div className="mt-5 space-y-3">
              {whatsappSteps.map(([title, copy]) => (
                <div key={title} className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-1 text-sm leading-7 text-slate-400">{copy}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-sky-400/25 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-6 shadow-[0_24px_80px_rgba(37,99,235,0.14)]">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">Mensaje generado</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">Hola, tu equipo fue registrado en FIXI con el folio <span className="text-white">SRF-MQV0ISEK</span>. Puedes consultar el estado en el portal del cliente.</p>
              <div className="mt-4 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-center text-sm font-semibold text-emerald-200">
                Enviar por WhatsApp
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <SectionLabel>Recepción legal</SectionLabel>
            <h3 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Cuando el cliente diga “yo no entregué así”, tú tendrás respaldo.</h3>
            <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">Cada equipo entra con checklist, fotos y firma. Todo queda atado a la orden para que no vivas de memoria ni de chats.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {receptionChecks.map((item) => (
                <div key={item} className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold text-white">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-6 shadow-[0_24px_80px_rgba(37,99,235,0.14)]">
            <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">Captura real</p>
              <p className="mt-3 text-2xl font-black tracking-tight text-white">Información del equipo</p>
              <div className="mt-5 grid gap-3">
                {["Tipo de dispositivo", "Checklist de recepción", "Condición cosmética", "Daño físico reportado", "Accesorios recibidos", "Aceptación"].map((label) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="text-sm text-slate-300">{label}</span>
                    <span className="text-sm font-semibold text-sky-200">Registrado</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="precios" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>Planes</SectionLabel>
            <h3 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Precios claros para talleres reales</h3>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-400">Sin letras chiquitas. Sin modalidades raras. Elige el plan que se acerque al tamaño de tu operación.</p>
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          {pricingPlans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-[2rem] border p-6 ${plan.featured ? "border-sky-400/40 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] shadow-[0_24px_80px_rgba(37,99,235,0.14)]" : "border-white/10 bg-white/5"}`}
            >
              {plan.featured ? <Pill>Más popular</Pill> : null}
              <h4 className="mt-4 text-2xl font-semibold text-white">{plan.name}</h4>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-5xl font-black tracking-tight text-white">{plan.price}</span>
                <span className="pb-1 text-sm text-slate-400">{plan.period}</span>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-400">{plan.description}</p>
              <div className="mt-6 flex flex-col gap-3">
                <CTA href={adminOnboardingUrl} variant={plan.featured ? "primary" : "secondary"}>
                  Empezar prueba gratis
                </CTA>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-6 lg:grid-cols-[0.8fr_1.2fr] lg:p-8">
          <div>
            <SectionLabel>FAQ</SectionLabel>
            <h3 className="mt-3 text-4xl font-black tracking-tight text-white">Respuestas rápidas, sin ruido.</h3>
          </div>
          <div className="grid gap-3">
            {faqItems.map(([question, answer]) => (
              <details key={question} className="group rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                <summary className="cursor-pointer list-none text-sm font-semibold text-white">{question}</summary>
                <p className="mt-3 text-sm leading-7 text-slate-400">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <SectionLabel>Listo para operar</SectionLabel>
              <p className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Pon orden en tu taller sin cambiar tu forma de trabajar.</p>
              <p className="mt-4 text-base leading-8 text-slate-300">
                Si ya operas con WhatsApp, libretas o Excel, FIXI te ayuda a organizar recepción, reparación y entrega sin romper tu flujo actual.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <CTA href={adminOnboardingUrl}>Crear cuenta</CTA>
              <CTA href={adminLoginUrl} variant="secondary">
                Entrar al panel
              </CTA>
            </div>
          </div>
        </div>
      </section>

      <footer id="contacto" className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Web pública", publicUrl || "No configurada"],
              ["Panel administrativo", adminUrl || "No configurado"],
              ["Correo", contactEmail || "No configurado"],
              ["WhatsApp", contactPhone || "No configurado"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-sky-300/80">{label}</p>
                <p className="mt-2 text-sm font-medium text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>{productName} · SaaS multitenant para talleres de reparación.</p>
            <p>{brandShort} · {hubName}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
