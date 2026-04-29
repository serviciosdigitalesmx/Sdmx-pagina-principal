"use client";

import { useEffect, useState } from "react";
import { apiFetch, DashboardHeader } from "../../../lib/runtime.js";

type TemplateItem = { label: string; sort_order: number };
type Template = {
  id: string;
  name: string;
  device_type?: string | null;
  is_default: boolean;
  items: TemplateItem[];
};

export default function ChecklistTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    deviceType: "",
    isDefault: false,
    items: [{ label: "Cargador" }, { label: "Batería" }, { label: "Tapa trasera" }, { label: "SIM / memoria" }]
  });

  const load = async () => {
    const data = await apiFetch("/v1/checklist-templates");
    setTemplates(data.templates ?? []);
  };

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiFetch("/v1/checklist-templates", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          deviceType: form.deviceType || undefined,
          isDefault: form.isDefault,
          items: form.items.map((item, index) => ({
            label: item.label,
            sort_order: index
          }))
        })
      });
      setForm({
        name: "",
        deviceType: "",
        isDefault: false,
        items: [{ label: "Cargador" }, { label: "Batería" }, { label: "Tapa trasera" }, { label: "SIM / memoria" }]
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="shell">
      <DashboardHeader title="Plantillas de checklist" subtitle="Normalización del intake por taller y dispositivo." />
      <form className="grid-2 section" onSubmit={submit}>
        <div className="card stack">
          <h2>Nueva plantilla</h2>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre de plantilla" />
          <input value={form.deviceType} onChange={(e) => setForm({ ...form, deviceType: e.target.value })} placeholder="Tipo de dispositivo" />
          <label className="muted" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Plantilla por defecto
          </label>
          <div className="card stack">
            <strong>Ítems</strong>
            {form.items.map((item, index) => (
              <div key={index} className="toolbar">
                <input
                  value={item.label}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      items: form.items.map((entry, entryIndex) =>
                        entryIndex === index ? { label: e.target.value } : entry
                      )
                    });
                  }}
                  placeholder={`Ítem ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })}
                >
                  X
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setForm({ ...form, items: [...form.items, { label: "Nuevo ítem" }] })}>
              + Agregar ítem
            </button>
          </div>
          {error ? <p>{error}</p> : null}
          <button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar plantilla"}
          </button>
        </div>
        <div className="card stack">
          <h2>Plantillas existentes</h2>
          {templates.map((template) => (
            <div key={template.id} className="card stack">
              <strong>
                {template.name} {template.is_default ? "(defecto)" : ""}
              </strong>
              <div className="muted">{template.device_type || "Sin tipo"}</div>
              <div className="stack">
                {template.items.map((item) => (
                  <div key={`${template.id}-${item.sort_order}`} className="muted">
                    • {item.label}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!templates.length ? <p className="muted">No hay plantillas registradas.</p> : null}
        </div>
      </form>
    </main>
  );
}
