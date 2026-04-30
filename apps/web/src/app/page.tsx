"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function tenantSlugFromHost(host: string | null) {
  if (!host) return null;
  const normalized = (host.split(":")[0] ?? "").toLowerCase();
  if (normalized === "localhost" || normalized === "127.0.0.1") return null;
  if (normalized.endsWith(".vercel.app")) return null;
  const parts = normalized.split(".");
  if (parts.length < 3) return null;
  const [subdomain] = parts;
  if (!subdomain || subdomain === "www") return null;
  return subdomain;
}

const tenantExamples = [
  { slug: "taller-alfa", name: "Taller Alfa", status: "Recepción activa" },
  { slug: "taller-beta", name: "Taller Beta", status: "Inventario y compras" },
  { slug: "taller-gamma", name: "Taller Gamma", status: "Portal público" },
];

export default function HomePage() {
  const router = useRouter();
  const [tenantSlug, setTenantSlug] = useState("");

  useEffect(() => {
    const slug = tenantSlugFromHost(window.location.host);
    if (slug) {
      router.replace(`/t/${slug}`);
    }
  }, [router]);

  const quickAccess = useMemo(
    () => [
      { href: "/pricing", label: "Planes" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/hub", label: "Hub" },
      { href: "/consultar", label: "Consultar" },
      { href: "/login", label: "Login" },
    ],
    [],
  );

  const howItWorks = useMemo(
    () => [
      {
        title: "Crea el taller",
        body: "Define nombre, branding y parámetros operativos. El tenant queda listo con su espacio y sus reglas.",
      },
      {
        title: "Activa su sitio público",
        body: "Cada taller obtiene su propia página pública en /t/[slug] para mostrar servicios, contacto y cotizador.",
      },
      {
        title: "Gestiona desde un solo panel",
        body: "Alterna entre talleres sin mezclar datos. Operas órdenes, inventario y billing desde una sola cuenta.",
      },
    ],
    [],
  );

  const differentiators = useMemo(
    () => [
      {
        title: "Panel para varios talleres",
        body: "Unifica la operación sin duplicar estructura ni perder control por tenant.",
      },
      {
        title: "Sitios públicos por taller",
        body: "Cada negocio tiene su landing, su branding y su acceso a portal.",
      },
      {
        title: "Roles y permisos",
        body: "Define quién ve, quién cobra y quién opera en cada taller.",
      },
      {
        title: "Métricas unificadas",
        body: "Visión rápida de órdenes, inventario, soporte y billing en un solo lugar.",
      },
    ],
    [],
  );

  return (
    <main className="shell landing-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="brand-mark">S</span>
          <div>
            <strong>SDMX</strong>
            <div className="muted">Software de gestión para talleres</div>
          </div>
        </div>
        <nav className="topbar-nav" aria-label="Navegación principal">
          <a href="/pricing">Planes</a>
          <a href="/dashboard">Dashboard</a>
          <a href="/hub">Hub</a>
          <a href="/login" className="topbar-cta">Entrar</a>
        </nav>
      </header>

      <section className="hero hero-grid hero-premium">
        <div className="hero-copy">
          <div className="eyebrow-row">
            <p className="eyebrow">SDMX</p>
            <span className="pill">Multi-tenant SaaS</span>
          </div>
          <h1>Cada taller bajo control, desde un solo lugar.</h1>
          <p className="lede hero-lede">
            SDMX unifica la operación de talleres con tenant websites, portal público, billing, storage por cuota y un panel listo para producción.
          </p>
          <div className="hero-actions">
            <Link href="/pricing" className="primary">
              Ver planes y empezar
            </Link>
            <Link href="/login" className="secondary">
              Acceder a mi panel
            </Link>
          </div>
          <p className="microcopy">Sin tarjeta de crédito · Configura tu primer taller en menos de 2 minutos</p>

          <div className="hero-metrics">
            <div className="metric-card">
              <strong>Prueba gratis</strong>
              <span>15 días con acceso completo</span>
            </div>
            <div className="metric-card">
              <strong>Tenant-aware</strong>
              <span>Datos aislados por taller</span>
            </div>
            <div className="metric-card">
              <strong>Panel real</strong>
              <span>Órdenes, clientes y billing</span>
            </div>
          </div>
        </div>

        <aside className="hero-panel card">
          <div className="panel-header">
            <span className="panel-kicker">Vista real del panel de operaciones</span>
            <strong>Recepción, inventario y finanzas</strong>
          </div>
          <div className="panel-figure">
            <div className="figure-badge">Tenant: SR FIX</div>
            <div className="figure-badge figure-badge-accent">+32 estados</div>
            <div className="figure-card">
              <div className="figure-topline" />
              <div className="figure-title">Todo unificado por tenant</div>
              <div className="figure-bars">
                <span />
                <span />
                <span />
              </div>
              <div className="figure-pills">
                <span>Recepción</span>
                <span>Inventario</span>
                <span>Finanzas</span>
              </div>
            </div>
          </div>
          <div className="panel-notes">
            <div>
              <strong>Portal cliente</strong>
              <span>Folio, estado, fotos y PDFs.</span>
            </div>
            <div>
              <strong>Tenant website</strong>
              <span>Landing, cotizador y branding por taller.</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Accesos</p>
          <h2>Entradas rápidas al producto</h2>
        </div>
        <div className="nav-grid">
          {quickAccess.map((item) => (
            <a key={item.href} className="nav-tile" href={item.href}>
              <strong>{item.label}</strong>
              <span className="muted">
                {item.href === "/pricing" && "Planes, prueba gratuita y límites."}
                {item.href === "/dashboard" && "Operación central del taller."}
                {item.href === "/hub" && "Métricas, accesos y módulos."}
                {item.href === "/consultar" && "Consulta pública por folio."}
                {item.href === "/login" && "Acceso al tenant."}
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="grid-2 section">
        <div className="card stack">
          <div>
            <p className="eyebrow-subtle">Cómo funciona</p>
            <h2>Multitenancy real, sin duplicar operación.</h2>
          </div>
          <div className="cards">
            {howItWorks.map((step, index) => (
              <div key={step.title} className="card accent-card">
                <div className="eyebrow-subtle">0{index + 1}</div>
                <strong>{step.title}</strong>
                <div className="muted">{step.body}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card stack">
          <div>
            <p className="eyebrow-subtle">Tenant website</p>
            <h2>Abre un sitio público por taller.</h2>
            <p className="muted">Usa el slug real del negocio para entrar a su landing pública y cotizador.</p>
          </div>
          <input
            value={tenantSlug}
            onChange={(e) => setTenantSlug(e.target.value)}
            placeholder="slug del tenant"
          />
          <a className="primary" href={tenantSlug ? `/t/${tenantSlug.trim().toLowerCase()}` : "/t"}>
            Abrir sitio del tenant
          </a>
          <div className="cards">
            {tenantExamples.map((tenant) => (
              <div key={tenant.slug} className="card accent-card">
                <strong>{tenant.name}</strong>
                <div className="muted">{tenant.status}</div>
                <div className="muted">/t/{tenant.slug}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Diferenciadores</p>
          <h2>Más que marketing: control real.</h2>
        </div>
        <div className="cards">
          {differentiators.map((item) => (
            <div key={item.title} className="card accent-card">
              <strong>{item.title}</strong>
              <div className="muted">{item.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section card stack" style={{ textAlign: "center" }}>
        <p className="eyebrow-subtle">Empieza ahora</p>
        <h2>Levanta tu primer taller gratis y súbelo cuando crezcas.</h2>
        <p className="muted">
          Todos los planes incluyen tenant websites, portal público y panel multi-taller.
        </p>
        <div className="actions" style={{ justifyContent: "center" }}>
          <Link href="/pricing" className="primary">
            Ver planes y empezar
          </Link>
          <Link href="/consultar" className="secondary">
            Rastrear una orden
          </Link>
        </div>
      </section>

      <footer className="footer">
        <div>
          <strong>SDMX</strong>
          <div className="muted">ERP de talleres convertido en SaaS multi-tenant</div>
        </div>
        <div className="footer-links">
          <Link href="/pricing">Pricing</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/hub">Hub</Link>
          <Link href="/consultar">Consultar</Link>
          <Link href="/login">Login</Link>
        </div>
      </footer>
    </main>
  );
}
