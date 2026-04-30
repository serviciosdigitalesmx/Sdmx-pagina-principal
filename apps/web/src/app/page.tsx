"use client";

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

export default function HomePage() {
  const router = useRouter();
  const [tenantSlug, setTenantSlug] = useState("");

  useEffect(() => {
    const slug = tenantSlugFromHost(window.location.host);
    if (slug) {
      router.replace(`/t/${slug}`);
    }
  }, [router]);

  const actions = useMemo(
    () => [
      { href: "/pricing", label: "Ver pricing" },
      { href: "/dashboard", label: "Ir al dashboard" },
      { href: "/hub", label: "Hub operativo" },
      { href: "/consultar", label: "Seguimiento público" },
      { href: "/login", label: "Login" },
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
          <a href="/hub">Hub</a>
          <a href="/consultar">Portal</a>
          <a href="/login" className="topbar-cta">Entrar</a>
        </nav>
      </header>

      <section className="hero hero-grid hero-premium">
        <div className="hero-copy">
          <div className="eyebrow-row">
            <p className="eyebrow">SDMX</p>
            <span className="pill">Multi-tenant SaaS</span>
          </div>
          <h1>Convierte tu taller en una operación profesional.</h1>
          <p className="lede hero-lede">
            Órdenes, clientes, técnicos, portal público, tenant website, billing y storage por cuota en una sola plataforma lista para producción.
          </p>
          <div className="hero-metrics">
            <div className="metric-card">
              <strong>+150,000</strong>
              <span>órdenes creadas</span>
            </div>
            <div className="metric-card">
              <strong>15 días</strong>
              <span>prueba gratuita</span>
            </div>
            <div className="metric-card">
              <strong>100%</strong>
              <span>tenant-aware</span>
            </div>
          </div>
          <div className="actions hero-actions">
            {actions.map((action) => (
              <a key={action.href} href={action.href} className="secondary">
                {action.label}
              </a>
            ))}
          </div>
          <p className="microcopy">
            Si entras desde un subdominio del tenant, esta app te redirige a su web pública automáticamente.
          </p>
        </div>

        <aside className="hero-panel card">
          <div className="panel-header">
            <span className="panel-kicker">Operación en tiempo real</span>
            <strong>Recepción, inventario, finanzas</strong>
          </div>
          <div className="panel-figure">
            <div className="figure-badge">+32 estados</div>
            <div className="figure-badge figure-badge-accent">+150k órdenes</div>
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
          <a className="nav-tile" href="/pricing"><strong>Pricing</strong><span className="muted">Planes, prueba gratuita y límites.</span></a>
          <a className="nav-tile" href="/dashboard"><strong>Dashboard</strong><span className="muted">Operación central del taller.</span></a>
          <a className="nav-tile" href="/hub"><strong>Hub operativo</strong><span className="muted">Métricas, accesos y módulos.</span></a>
          <a className="nav-tile" href="/consultar"><strong>Seguimiento</strong><span className="muted">Consulta pública por folio.</span></a>
          <a className="nav-tile" href="/login"><strong>Login</strong><span className="muted">Acceso al tenant.</span></a>
        </div>
      </section>

      <section className="grid-2 section">
        <div className="card stack">
          <h2>Ir al sitio de un tenant</h2>
          <p className="muted">Escribe el slug público del taller para abrir su web.</p>
          <input value={tenantSlug} onChange={(e) => setTenantSlug(e.target.value)} placeholder="slug del tenant" />
          <a className="primary" href={tenantSlug ? `/t/${tenantSlug.trim().toLowerCase()}` : "/t"}>
            Abrir sitio del tenant
          </a>
        </div>

        <div className="card stack">
          <h2>Qué mejora frente a la versión simple</h2>
          <div className="cards">
            <div className="card accent-card">
              <strong>Más impacto</strong>
              <div className="muted">Hero más fuerte, más contraste y más presencia comercial.</div>
            </div>
            <div className="card accent-card">
              <strong>Más claridad</strong>
              <div className="muted">Los accesos principales están visibles sin perder estructura.</div>
            </div>
            <div className="card accent-card">
              <strong>Más producto</strong>
              <div className="muted">Muestra lo que hace el SaaS además de venderlo.</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
