"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type TenantWebsite = {
  tenant: { id: string; name: string; slug: string };
  settings: {
    website_title: string;
    website_subtitle: string;
    description: string;
    services: Array<string | { name?: string; label?: string; description?: string }>;
    contact_phone: string;
    whatsapp_phone: string;
    logo_url: string;
    primary_color: string;
    secondary_color: string;
    website_cta: string;
    address: string;
    email: string;
  };
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function TenantWebsitePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;
  const [payload, setPayload] = useState<TenantWebsite | null>(null);
  const [folio, setFolio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteResult, setQuoteResult] = useState<{ folio: string; portal_url: string; whatsapp_url: string } | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    vehiclePlate: "",
    description: "",
    deviceType: "",
    deviceBrand: "",
    deviceModel: "",
    accessories: ""
  });

  useEffect(() => {
    void (async () => {
      if (!apiBaseUrl) throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
      setLoading(true);
      try {
        const res = await fetch(`${apiBaseUrl}/v1/public/tenant/${slug}`);
        if (!res.ok) throw new Error("Tenant not found");
        setPayload(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const theme = useMemo(() => ({
    primary: payload?.settings.primary_color ?? "#1F7EDC",
    secondary: payload?.settings.secondary_color ?? "#FF6A2A"
  }), [payload]);

  async function submitQuote(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!apiBaseUrl) throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
    setQuoteLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/v1/public/tenant/${slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || err.error || "No se pudo crear la solicitud");
      }
      const data = await res.json();
      setQuoteResult(data);
      setFolio(data.folio);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setQuoteLoading(false);
    }
  }

  function openPortal() {
    const normalized = folio.trim().toUpperCase();
    if (!normalized) return;
    router.push(`/portal?folio=${encodeURIComponent(normalized)}`);
  }

  if (loading) {
    return (
      <main className="shell">
        <p className="muted">Cargando sitio del tenant...</p>
      </main>
    );
  }

  if (error && !payload) {
    return (
      <main className="shell">
        <div className="card section stack">
          <h1>Tenant no encontrado</h1>
          <p className="muted">{error}</p>
          <Link href="/" className="secondary">Volver al inicio</Link>
        </div>
      </main>
    );
  }

  if (!payload) return null;

  return (
    <main className="shell" style={{
      background: `linear-gradient(180deg, color-mix(in srgb, ${theme.primary} 18%, #05080F) 0%, #05080F 45%, color-mix(in srgb, ${theme.secondary} 10%, #05080F) 100%)`
    }}>
      <section className="hero" style={{ borderColor: theme.primary }}>
        <div className="eyebrow">{payload.settings.website_subtitle || "Sitio público del taller"}</div>
        {payload.settings.logo_url ? (
          <img src={payload.settings.logo_url} alt={payload.settings.website_title} style={{ width: 72, height: 72, borderRadius: 20, objectFit: "cover", margin: "0 auto" }} />
        ) : null}
        <h1>{payload.settings.website_title}</h1>
        <p className="lede">{payload.settings.website_subtitle}</p>
        <p className="muted">{payload.settings.description || payload.tenant.name}</p>
        <div className="actions">
          {payload.settings.whatsapp_phone ? (
            <a
              className="primary"
              href={`https://wa.me/${payload.settings.whatsapp_phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, quiero cotizar con ${payload.settings.website_title}.`)}`}
              target="_blank"
              rel="noreferrer"
            >
              {payload.settings.website_cta || "Cotizar ahora"}
            </a>
          ) : null}

        </div>
      </section>

      <section className="grid-2 section">
        <div className="card stack">
          <h2>Servicios</h2>
          <div className="cards">
            {payload.settings.services?.length ? (
              payload.settings.services.map((service, index) => {
                const label = typeof service === "string" ? service : service.label || service.name || `Servicio ${index + 1}`;
                const description = typeof service === "object" ? service.description || "" : "";
                return (
                  <div key={`${label}-${index}`} className="card">
                    <strong>{label}</strong>
                    {description ? <div className="muted">{description}</div> : null}
                  </div>
                );
              })
            ) : (
              <div className="muted">El taller no ha configurado servicios todavía.</div>
            )}
          </div>
        </div>

        <div className="card stack">
          <h2>Contacto</h2>
          <div className="muted">Teléfono: {payload.settings.contact_phone || payload.settings.whatsapp_phone || "-"}</div>
          <div className="muted">Email: {payload.settings.email || "-"}</div>
          <div className="muted">Dirección: {payload.settings.address || "-"}</div>
          <div className="muted">Slug: {payload.tenant.slug}</div>
        </div>
      </section>

      <section className="grid-2 section">
        <form className="card stack" onSubmit={submitQuote}>
          <h2>Cotizador web</h2>
          <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Nombre completo" />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="WhatsApp / teléfono" />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Correo" type="email" />
          <input value={form.vehiclePlate} onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })} placeholder="Placa o folio del equipo" />
          <input value={form.deviceType} onChange={(e) => setForm({ ...form, deviceType: e.target.value })} placeholder="Tipo de dispositivo" />
          <input value={form.deviceBrand} onChange={(e) => setForm({ ...form, deviceBrand: e.target.value })} placeholder="Marca" />
          <input value={form.deviceModel} onChange={(e) => setForm({ ...form, deviceModel: e.target.value })} placeholder="Modelo" />
          <input value={form.accessories} onChange={(e) => setForm({ ...form, accessories: e.target.value })} placeholder="Accesorios" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe la falla o servicio requerido" rows={4} />
          {error ? <p>{error}</p> : null}
          <button type="submit" disabled={quoteLoading}>
            {quoteLoading ? "Enviando..." : "Enviar solicitud"}
          </button>
          {quoteResult ? (
            <div className="card stack">
              <strong>Solicitud creada</strong>
              <div className="muted">Folio: {quoteResult.folio}</div>
              <a className="secondary" href={quoteResult.portal_url} target="_blank" rel="noreferrer">Abrir portal</a>
              {quoteResult.whatsapp_url ? <a className="primary" href={quoteResult.whatsapp_url} target="_blank" rel="noreferrer">Enviar por WhatsApp</a> : null}
            </div>
          ) : null}
        </form>

        <div className="card stack">
          <h2>Portal cliente</h2>
          <p className="muted">Ingresa el folio y te llevamos al portal de seguimiento.</p>
          <input value={folio} onChange={(e) => setFolio(e.target.value.toUpperCase())} placeholder="Folio" />
          <button type="button" onClick={openPortal}>Abrir portal</button>
        </div>
      </section>
    </main>
  );
}
