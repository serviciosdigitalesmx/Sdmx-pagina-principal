"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, DashboardHeader } from "../../../../lib/runtime.js";

type Customer = { id: string; full_name: string; phone?: string };
type ChecklistTemplate = { id: string; name: string; device_type?: string; is_default?: boolean; items?: { label: string; sort_order: number }[] };

export default function NewOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ portal_url: string; whatsapp_url: string } | null>(null);
  const [form, setForm] = useState({
    customerId: "",
    vehiclePlate: "",
    description: "",
    deviceType: "",
    deviceBrand: "",
    deviceModel: "",
    accessories: "",
    checklistTemplateId: ""
  });

  useEffect(() => {
    void Promise.all([
      apiFetch("/v1/customers"),
      apiFetch("/v1/checklist-templates")
    ]).then(([customersData, templatesData]) => {
      setCustomers(customersData.customers ?? []);
      setTemplates(templatesData.templates ?? []);
      const defaultTemplate = (templatesData.templates ?? []).find((template: ChecklistTemplate) => template.is_default);
      setForm((current) => ({
        ...current,
        checklistTemplateId: defaultTemplate?.id ?? current.checklistTemplateId
      }));
    });
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    try {
      const data = await apiFetch("/v1/orders", {
        method: "POST",
        body: JSON.stringify({
          customerId: form.customerId,
          vehiclePlate: form.vehiclePlate,
          description: form.description,
          deviceType: form.deviceType,
          deviceBrand: form.deviceBrand,
          deviceModel: form.deviceModel,
          accessories: form.accessories,
          checklistTemplateId: form.checklistTemplateId || undefined
        })
      });
      setResult({ portal_url: data.portal_url, whatsapp_url: data.whatsapp_url });
      router.push(`/dashboard/orders/${data.folio}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <main className="shell">
      <DashboardHeader title="Nueva orden" subtitle="Ingreso con checklist, portal y WhatsApp." />
      {result ? (
        <div className="card section stack">
          <strong>Orden creada</strong>
          <a href={result.portal_url} className="secondary">Abrir portal del cliente</a>
          <a href={result.whatsapp_url} className="primary" target="_blank" rel="noreferrer">Enviar por WhatsApp</a>
        </div>
      ) : null}
      <form className="grid-2 section" onSubmit={submit}>
        <div className="card stack">
          <h2>Cliente</h2>
          <select value={form.customerId} onChange={(e) => {
            setForm({
              ...form,
              customerId: e.target.value
            });
          }}>
            <option value="">Selecciona cliente</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.full_name}</option>
            ))}
          </select>
          <input value={form.vehiclePlate} onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })} placeholder="Placa" />
          <input value={form.deviceType} onChange={(e) => setForm({ ...form, deviceType: e.target.value })} placeholder="Tipo de dispositivo" />
          <input value={form.deviceBrand} onChange={(e) => setForm({ ...form, deviceBrand: e.target.value })} placeholder="Marca" />
          <input value={form.deviceModel} onChange={(e) => setForm({ ...form, deviceModel: e.target.value })} placeholder="Modelo" />
          <input value={form.accessories} onChange={(e) => setForm({ ...form, accessories: e.target.value })} placeholder="Accesorios" />
          <select value={form.checklistTemplateId} onChange={(e) => setForm({ ...form, checklistTemplateId: e.target.value })}>
            <option value="">Checklist default</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}{template.device_type ? ` · ${template.device_type}` : ""}
              </option>
            ))}
          </select>
          <div className="muted">
            El checklist se crea desde plantilla normalizada al registrar la orden.
          </div>
        </div>
        <div className="card stack">
          <h2>Ingreso</h2>
          <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción / falla" />
          {error ? <p>{error}</p> : null}
          <button type="submit">Crear orden</button>
        </div>
      </form>
    </main>
  );
}
