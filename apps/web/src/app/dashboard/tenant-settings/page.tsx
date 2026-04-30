"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, DashboardHeader } from "../../../lib/runtime.js";

type TenantSettingsForm = {
  websiteTitle: string;
  websiteSubtitle: string;
  description: string;
  portalTitle: string;
  portalSubtitle: string;
  portalDescription: string;
  servicesText: string;
  contactPhone: string;
  whatsappPhone: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  websiteCta: string;
  pdfIngresoTitle: string;
  pdfDiagnosticoTitle: string;
  pdfPresupuestoTitle: string;
  pdfEntregaTitle: string;
  pdfFooterNote: string;
  address: string;
  email: string;
};

const emptyForm: TenantSettingsForm = {
  websiteTitle: "",
  websiteSubtitle: "",
  description: "",
  portalTitle: "",
  portalSubtitle: "",
  portalDescription: "",
  servicesText: "",
  contactPhone: "",
  whatsappPhone: "",
  logoUrl: "",
  primaryColor: "#1F7EDC",
  secondaryColor: "#FF6A2A",
  websiteCta: "",
  pdfIngresoTitle: "",
  pdfDiagnosticoTitle: "",
  pdfPresupuestoTitle: "",
  pdfEntregaTitle: "",
  pdfFooterNote: "",
  address: "",
  email: ""
};

export default function TenantSettingsPage() {
  const [form, setForm] = useState<TenantSettingsForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void apiFetch("/v1/tenant-settings")
      .then((data) => {
        const settings = data.settings ?? {};
        setForm({
          websiteTitle: settings.website_title ?? "",
          websiteSubtitle: settings.website_subtitle ?? "",
          description: settings.description ?? "",
          portalTitle: settings.portal_title ?? "",
          portalSubtitle: settings.portal_subtitle ?? "",
          portalDescription: settings.portal_description ?? "",
          servicesText: Array.isArray(settings.services)
            ? settings.services
                .map((service: { label?: string; description?: string } | string) =>
                  typeof service === "string" ? service : `${service.label ?? ""}|${service.description ?? ""}`
                )
                .join("\n")
            : "",
          contactPhone: settings.contact_phone ?? "",
          whatsappPhone: settings.whatsapp_phone ?? "",
          logoUrl: settings.logo_url ?? "",
          primaryColor: settings.primary_color ?? "#1F7EDC",
          secondaryColor: settings.secondary_color ?? "#FF6A2A",
          websiteCta: settings.website_cta ?? "",
          pdfIngresoTitle: settings.pdf_ingreso_title ?? "",
          pdfDiagnosticoTitle: settings.pdf_diagnostico_title ?? "",
          pdfPresupuestoTitle: settings.pdf_presupuesto_title ?? "",
          pdfEntregaTitle: settings.pdf_entrega_title ?? "",
          pdfFooterNote: settings.pdf_footer_note ?? "",
          address: settings.address ?? "",
          email: settings.email ?? ""
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const services = form.servicesText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [label = "", ...rest] = line.split("|");
          return { label: label.trim(), description: rest.join("|").trim() };
        });
      await apiFetch("/v1/tenant-settings", {
        method: "PUT",
        body: JSON.stringify({
          websiteTitle: form.websiteTitle,
          websiteSubtitle: form.websiteSubtitle,
          description: form.description,
          portalTitle: form.portalTitle,
          portalSubtitle: form.portalSubtitle,
          portalDescription: form.portalDescription,
          services,
          contactPhone: form.contactPhone,
          whatsappPhone: form.whatsappPhone,
          logoUrl: form.logoUrl,
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          websiteCta: form.websiteCta,
          pdfIngresoTitle: form.pdfIngresoTitle,
          pdfDiagnosticoTitle: form.pdfDiagnosticoTitle,
          pdfPresupuestoTitle: form.pdfPresupuestoTitle,
          pdfEntregaTitle: form.pdfEntregaTitle,
          pdfFooterNote: form.pdfFooterNote,
          address: form.address,
          email: form.email
        })
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  const previewStyle = useMemo(() => ({
    borderColor: form.primaryColor || "#1F7EDC",
    background: `linear-gradient(180deg, color-mix(in srgb, ${form.primaryColor || "#1F7EDC"} 16%, #05080F) 0%, #0b1020 100%)`
  }), [form.primaryColor]);

  if (loading) {
    return (
      <main className="shell">
        <DashboardHeader title="Branding del tenant" subtitle="Configuración visible para clientes y PDFs." />
        <p className="muted">Cargando configuración...</p>
      </main>
    );
  }

  return (
    <main className="shell">
      <DashboardHeader title="Branding del tenant" subtitle="Todo lo que ve el cliente sale de aquí." />
      {error ? <p>{error}</p> : null}
      {saved ? <p className="muted">Configuración guardada.</p> : null}
      <section className="grid-2 section">
        <div className="card stack">
          <h2>Sitio público</h2>
          <input value={form.websiteTitle} onChange={(e) => setForm({ ...form, websiteTitle: e.target.value })} placeholder="Título del negocio" />
          <input value={form.websiteSubtitle} onChange={(e) => setForm({ ...form, websiteSubtitle: e.target.value })} placeholder="Subtítulo" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Descripción" />
          <textarea value={form.servicesText} onChange={(e) => setForm({ ...form, servicesText: e.target.value })} rows={4} placeholder="Servicios, uno por línea: Nombre|Descripción" />
          <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="Teléfono de contacto" />
          <input value={form.whatsappPhone} onChange={(e) => setForm({ ...form, whatsappPhone: e.target.value })} placeholder="WhatsApp" />
          <input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="URL del logo" />
          <input value={form.websiteCta} onChange={(e) => setForm({ ...form, websiteCta: e.target.value })} placeholder="CTA principal" />
          <input value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} placeholder="#1F7EDC" />
          <input value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} placeholder="#FF6A2A" />
        </div>
        <div className="card stack" style={previewStyle}>
          <h2>Portal y PDFs</h2>
          <input value={form.portalTitle} onChange={(e) => setForm({ ...form, portalTitle: e.target.value })} placeholder="Título del portal" />
          <input value={form.portalSubtitle} onChange={(e) => setForm({ ...form, portalSubtitle: e.target.value })} placeholder="Subtítulo del portal" />
          <textarea value={form.portalDescription} onChange={(e) => setForm({ ...form, portalDescription: e.target.value })} rows={3} placeholder="Descripción del portal" />
          <input value={form.pdfIngresoTitle} onChange={(e) => setForm({ ...form, pdfIngresoTitle: e.target.value })} placeholder="Título PDF ingreso" />
          <input value={form.pdfDiagnosticoTitle} onChange={(e) => setForm({ ...form, pdfDiagnosticoTitle: e.target.value })} placeholder="Título PDF diagnóstico" />
          <input value={form.pdfPresupuestoTitle} onChange={(e) => setForm({ ...form, pdfPresupuestoTitle: e.target.value })} placeholder="Título PDF presupuesto" />
          <input value={form.pdfEntregaTitle} onChange={(e) => setForm({ ...form, pdfEntregaTitle: e.target.value })} placeholder="Título PDF entrega" />
          <textarea value={form.pdfFooterNote} onChange={(e) => setForm({ ...form, pdfFooterNote: e.target.value })} rows={3} placeholder="Nota final PDF" />
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Dirección" />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Correo" />
        </div>
      </section>
      <div className="actions">
        <button type="button" onClick={save} disabled={saving}>
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>
    </main>
  );
}
