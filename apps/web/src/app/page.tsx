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
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">SDMX</p>
        <h1>ERP de talleres convertido en SaaS multi-tenant</h1>
        <p className="lede">
          Órdenes de servicio, clientes, técnicos, suscripciones, páginas públicas por tenant y límites por plan en una sola base lista para Vercel, Render y Supabase.
        </p>
        <div className="actions">
          {actions.map((action) => (
            <a key={action.href} href={action.href} className="secondary">
              {action.label}
            </a>
          ))}
        </div>
        <p className="lede">
          Si entras desde un subdominio del tenant, esta misma app te redirige a su web pública automáticamente.
        </p>
        <div className="card stack" style={{ maxWidth: 420, margin: "0 auto" }}>
          <h2>Ir al sitio de un tenant</h2>
          <p className="muted">Escribe el slug público del taller para abrir su web.</p>
          <input value={tenantSlug} onChange={(e) => setTenantSlug(e.target.value)} placeholder="slug del tenant" />
          <a className="primary" href={tenantSlug ? `/t/${tenantSlug.trim().toLowerCase()}` : "/t"}>
            Abrir sitio del tenant
          </a>
        </div>
      </section>
    </main>
  );
}
