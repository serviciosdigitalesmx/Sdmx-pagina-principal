import Link from "next/link";
import { optionalEnv } from "@white-label/config";
import { RootAuthHashRedirect } from "@/components/root-auth-hash-redirect";
import { resolveAdminUrl } from "@/lib/admin-url";

const productName = optionalEnv("NEXT_PUBLIC_SAAS_BRAND_NAME") ?? "FIXI";
const brandShort = optionalEnv("NEXT_PUBLIC_SAAS_BRAND_SHORT") ?? "FX";
const hubName = optionalEnv("NEXT_PUBLIC_HUB_NAME") ?? "Hub";
const adminUrl = optionalEnv("NEXT_PUBLIC_WEB_ADMIN_URL") ?? "";
const publicUrl = optionalEnv("NEXT_PUBLIC_WEB_PUBLIC_URL") ?? "";
const trialDays = optionalEnv("NEXT_PUBLIC_SAAS_TRIAL_DAYS") ?? "7";
const contactEmail = optionalEnv("NEXT_PUBLIC_SAAS_CONTACT_EMAIL") ?? "";
const contactPhone = optionalEnv("NEXT_PUBLIC_SAAS_CONTACT_PHONE") ?? "";
const adminBaseUrl = resolveAdminUrl();
const adminLoginUrl = adminBaseUrl ? `${adminBaseUrl}/login` : "/login";
const adminOnboardingUrl = adminBaseUrl ? `${adminBaseUrl}/login?mode=signup` : "/login?mode=signup";

const coreModules = [
  {
    name: "Órdenes de servicio",
    copy: "Recepción, diagnóstico, reparación y entrega en un solo flujo.",
  },
  {
    name: "Clientes",
    copy: "Historial, teléfonos y seguimiento para cada equipo ingresado.",
  },
  {
    name: "Inventario",
    copy: "Refacciones, entradas, salidas y alertas sin hojas de cálculo.",
  },
  {
    name: "Evidencias",
    copy: "Fotos, notas y documentos vinculados al folio correcto.",
  },
  {
    name: "Cobros",
    copy: "Control de pagos, estados y comprobantes con trazabilidad.",
  },
  {
    name: "WhatsApp",
    copy: "Comparte el folio y acelera el seguimiento del cliente.",
  },
];

const featureRows = [
  ["Recepción ordenada", "Sin libretas ni Excel sueltos"],
  ["Diagnóstico visible", "Estados claros en cada paso"],
  ["Entrega profesional", "PDF, WhatsApp y seguimiento público"],
  ["Multi-sucursal", "Operación separada por tenant y sucursal"],
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
  return <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-sky-300/80">{children}</p>;
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
  const base =
    "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold tracking-[0.12em] transition duration-200";
  const className =
    variant === "primary"
      ? `${base} border border-sky-400/30 bg-[linear-gradient(135deg,#60a5fa_0%,#2563eb_100%)] text-white shadow-[0_18px_40px_rgba(37,99,235,0.24)] hover:-translate-y-0.5 hover:brightness-110`
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
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.98))] p-5 shadow-[0_30px_100px_rgba(2,6,23,0.45)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.14),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(34,211,238,0.1),transparent_26%)]" />
      <div className="relative space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-sky-300/80">{hubName} / Live</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-white">Órdenes en movimiento</p>
          </div>
          <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">Operando</div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">Orden activa</p>
            <h3 className="mt-3 text-3xl font-black tracking-tight text-white">SRF-MQHJQN14</h3>
            <div className="mt-5 grid gap-3 text-sm text-slate-300">
              <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <span>Recepción</span>
                <span className="text-sky-300">Listo</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <span>Diagnóstico</span>
                <span className="text-sky-300">En curso</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                <span>Entrega</span>
                <span className="text-sky-300">Pendiente</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">Flujo</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">Recepción → diagnóstico → reparación → entrega → cobro.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">Inventario</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">Refacciones y consumibles conectados al tenant.</p>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">WhatsApp</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">El cliente recibe su folio y seguimiento con un clic.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 pt-2 sm:grid-cols-4">
          {featureRows.map(([left, right]) => (
            <div key={left} className="rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-sm font-semibold text-white">{left}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{right}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SceneFrame({
  eyebrow,
  title,
  copy,
  children,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[0.48fr_0.52fr] lg:items-center">
        <div className="space-y-4">
          <SectionLabel>{eyebrow}</SectionLabel>
          <h3 className="max-w-xl text-4xl font-black tracking-tight text-white sm:text-5xl">{title}</h3>
          <p className="max-w-xl text-base leading-8 text-slate-300">{copy}</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.95))] p-5 shadow-[0_24px_80px_rgba(2,6,23,0.32)]">
          {children}
        </div>
      </div>
    </section>
  );
}

function StatusDot({ tone }: { tone: "green" | "amber" | "red" }) {
  const classes =
    tone === "green"
      ? "bg-emerald-400 shadow-[0_0_0_6px_rgba(34,197,94,0.08)]"
      : tone === "amber"
        ? "bg-amber-400 shadow-[0_0_0_6px_rgba(245,158,11,0.08)]"
        : "bg-rose-400 shadow-[0_0_0_6px_rgba(239,68,68,0.08)]";
  return <span className={`inline-flex h-3.5 w-3.5 rounded-full ${classes}`} />;
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020617] text-slate-100">
      <RootAuthHashRedirect />

      <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#60a5fa_0%,#2563eb_100%)] text-sm font-black text-white">
              {brandShort.slice(0, 2)}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-300/80">SaaS para talleres</p>
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
        </header>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 pb-10 pt-3 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pt-8">
        <div className="space-y-8 pt-4 lg:pt-10">
          <Pill>El sistema operativo para talleres de reparación modernos</Pill>

          <div className="space-y-5">
            <h2 className="max-w-2xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              Controla tu taller
              <span className="block bg-[linear-gradient(135deg,#7dd3fc_0%,#60a5fa_40%,#2563eb_100%)] bg-clip-text text-transparent">con claridad real.</span>
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              FIXI centraliza recepción, diagnóstico, reparación, entrega y cobro en un SaaS multitenant serio, ordenado y listo para operar.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <CTA href={adminOnboardingUrl}>Crear mi taller</CTA>
            <CTA href={adminLoginUrl} variant="secondary">
              Entrar al panel
            </CTA>
            <Link href="#producto" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold tracking-[0.12em] text-slate-100 transition hover:bg-white/10">
              Ver producto
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Sin libretas ni Excel disperso",
              "Seguimiento público para clientes",
              "Inventario, cobros y evidencias",
              "Multi-sucursal y multi-tenant",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 lg:pt-0">
          <ProductMockup />
        </div>
      </section>

      <SceneFrame
        eyebrow="Orden en riesgo"
        title="Detecta retrasos antes de que el cliente reclame."
        copy="Una orden próxima a vencer debe verse diferente: clara, silenciosa y sin confundir estados con marketing."
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-sky-300/80">Folio</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-white">SRF-00214</p>
              <p className="mt-1 text-sm text-slate-400">Cliente: Juan Pérez · iPhone 13</p>
            </div>
            <div className="text-right">
              <StatusDot tone="red" />
              <p className="mt-2 text-sm font-semibold text-rose-200">En reparación</p>
              <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">Promesa: hoy 6:00 PM</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.3rem] border border-white/10 bg-black/20 p-4"><StatusDot tone="green" /><p className="mt-3 text-sm text-slate-300">Recepción completa</p></div>
            <div className="rounded-[1.3rem] border border-white/10 bg-black/20 p-4"><StatusDot tone="amber" /><p className="mt-3 text-sm text-slate-300">Diagnóstico pendiente</p></div>
            <div className="rounded-[1.3rem] border border-white/10 bg-black/20 p-4"><StatusDot tone="red" /><p className="mt-3 text-sm text-slate-300">Riesgo de atraso</p></div>
          </div>
        </div>
      </SceneFrame>

      <SceneFrame
        eyebrow="Timeline real"
        title="Cada reparación tiene un historial completo."
        copy="Estados, fechas y evidencias deberían vivir juntos. El taller ve contexto, el cliente entiende el avance."
      >
        <div className="space-y-3">
          {[
            ["Recepción", "12 jun · 09:42", "Equipo ingresado con fotos y diagnóstico inicial.", "green"],
            ["Diagnóstico", "12 jun · 11:10", "Se detectó batería degradada y puerto sucio.", "green"],
            ["Cotización", "12 jun · 12:35", "Cotización enviada por WhatsApp y portal.", "amber"],
            ["Reparación", "13 jun · 10:20", "Pieza en espera con alerta de inventario.", "red"],
            ["Entrega", "Pendiente", "Aún no liberado para cobro y entrega.", "red"],
          ].map(([label, date, note, tone]) => (
            <div key={label} className="flex items-start gap-4 rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
              <div className="mt-1"><StatusDot tone={tone as "green" | "amber" | "red"} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-white">{label}</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{date}</p>
                </div>
                <p className="mt-1 text-sm leading-7 text-slate-400">{note}</p>
              </div>
            </div>
          ))}
        </div>
      </SceneFrame>

      <SceneFrame
        eyebrow="Seguimiento público"
        title="Tus clientes consultan el estado sin llamar ni mandar mensajes."
        copy="La pantalla del cliente debe ser limpia, confiable y rápida. Un folio, un estado, un historial."
      >
        <div className="rounded-[1.6rem] border border-white/10 bg-black/25 p-5">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-sky-300/80">Portal del cliente</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-white">Ver estado</p>
            </div>
            <Link href="/cliente" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-100">
              Abrir portal
            </Link>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">Consultar folio</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">Tenant: sr-fixi</div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white">Folio: SRF-00214</div>
                <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(96,165,250,0.16),rgba(37,99,235,0.16))] px-4 py-3 text-center text-sm font-semibold text-sky-100">Consultar</div>
              </div>
            </div>
            <div className="rounded-[1.3rem] border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">Estado actual</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-white">En reparación</p>
              <p className="mt-3 text-sm leading-7 text-slate-400">Tu equipo está en proceso. La fecha prometida se mantiene visible y la información se actualiza sin ruido visual.</p>
            </div>
          </div>
        </div>
      </SceneFrame>

      <SceneFrame
        eyebrow="Evidencias"
        title="Documenta cada etapa del proceso."
        copy="Las fotografías del equipo deben vivir en la orden, no dispersas en chats o galerías externas."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {["Frontal del equipo", "Puerto de carga", "Batería reemplazada", "Prueba final"].map((label, index) => (
            <div key={label} className="overflow-hidden rounded-[1.3rem] border border-white/10 bg-black/20">
              <div className="aspect-[4/3] bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.2),transparent_40%),linear-gradient(180deg,rgba(30,41,59,0.9),rgba(15,23,42,0.95))]" />
              <div className="px-4 py-3">
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">Evidencia {index + 1}</p>
              </div>
            </div>
          ))}
        </div>
      </SceneFrame>

      <SceneFrame
        eyebrow="WhatsApp"
        title="Envía el seguimiento en segundos."
        copy="El enlace debe salir del folio real y llevar al cliente a su propio estado sin fricción."
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[1.3rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">Mensaje generado</p>
            <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300">
              Hola, tu equipo fue registrado en FIXI con el folio <span className="text-white">SRF-00214</span>. Puedes consultar el estado en el portal del cliente.
            </div>
            <div className="mt-4 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-center text-sm font-semibold text-emerald-200">
              wa.me/521XXXXXXXXXX
            </div>
          </div>
          <div className="rounded-[1.3rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">Acción</p>
            <p className="mt-3 text-2xl font-black tracking-tight text-white">Compartir enlace</p>
            <p className="mt-3 text-sm leading-7 text-slate-400">Un solo clic para avisar al cliente sin copiar y pegar texto o perseguir chats.</p>
          </div>
        </div>
      </SceneFrame>

      <SceneFrame
        eyebrow="Inventario"
        title="Evita quedarte sin piezas críticas."
        copy="El stock bajo tiene que verse de inmediato y con suficiente espacio para que no pase desapercibido."
      >
        <div className="space-y-3">
          {[
            ["Batería iPhone 13", "2 unidades", "red"],
            ["Pantalla Samsung A54", "4 unidades", "amber"],
            ["Conector de carga", "1 unidad", "red"],
          ].map(([name, stock, tone]) => (
            <div key={name} className="flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-4">
              <div>
                <p className="font-semibold text-white">{name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">Stock crítico</p>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${tone === "red" ? "bg-rose-500/10 text-rose-200" : "bg-amber-500/10 text-amber-200"}`}>{stock}</div>
            </div>
          ))}
        </div>
      </SceneFrame>

      <SceneFrame
        eyebrow="Cobros"
        title="No pierdas seguimiento de tus ingresos."
        copy="Órdenes pendientes y cobradas en la misma vista, con el estado financiero siempre visible."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.3rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">Pendientes</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">SRF-00214 · $1,250.00</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">SRF-00219 · $680.00</div>
            </div>
          </div>
          <div className="rounded-[1.3rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">Cobradas</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">SRF-00210 · $2,100.00</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">SRF-00208 · $950.00</div>
            </div>
          </div>
        </div>
      </SceneFrame>

      <SceneFrame
        eyebrow="Multi-sucursal"
        title="Controla toda la operación desde un solo lugar."
        copy="Varias sucursales dentro del mismo tenant, con espacios claros para no mezclar datos."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {["sr fixi", "Hub", "Otriz Valle"].map((branch, index) => (
            <div key={branch} className={`rounded-[1.3rem] border p-4 ${index === 1 ? "border-sky-400/25 bg-sky-500/10" : "border-white/10 bg-black/20"}`}>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Sucursal</p>
              <p className="mt-2 text-lg font-semibold text-white">{branch}</p>
              <p className="mt-3 text-sm text-slate-400">Activa</p>
            </div>
          ))}
        </div>
      </SceneFrame>

      <SceneFrame
        eyebrow="Dashboard operativo"
        title="Visualiza tu operación en tiempo real."
        copy="Métricas reales del taller sin adornos: órdenes activas, entregadas, pendientes y piezas críticas."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Órdenes activas", "18"],
            ["Órdenes entregadas", "42"],
            ["Pendientes de cobro", "9"],
            ["Equipos en reparación", "14"],
            ["Refacciones críticas", "5"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[1.2rem] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-white">{value}</p>
            </div>
          ))}
        </div>
      </SceneFrame>

      <SceneFrame
        eyebrow="Portal cliente"
        title="Más confianza para el cliente y menos llamadas para tu equipo."
        copy="La consulta por folio debe sentirse simple y confiable, con la misma identidad visual del resto de FIXI."
      >
        <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">Portal del cliente</p>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">SRF-00214</p>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Consultar por folio</p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">Tenant + folio</div>
              <div className="mt-3 rounded-2xl bg-sky-500/90 px-4 py-3 text-center text-sm font-semibold text-white">Consultar</div>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">Estado</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-white">En reparación</p>
              <p className="mt-3 text-sm leading-7 text-slate-400">El cliente ve su avance, sus evidencias y su información sin fricción.</p>
            </div>
          </div>
        </div>
      </SceneFrame>

      <section id="precios" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>Planes</SectionLabel>
            <h3 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Precios claros para talleres reales</h3>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-400">Mantiene la estructura actual de cobro, sin inventar modalidades nuevas ni cambiar las rutas existentes.</p>
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
                  Empezar ahora
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
              <p className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Lleva tu taller a un SaaS serio y consistente.</p>
              <p className="mt-4 text-base leading-8 text-slate-300">
                Si ya operas con WhatsApp, libretas o Excel, FIXI te ayuda a ordenar el taller sin romper tu flujo actual.
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
