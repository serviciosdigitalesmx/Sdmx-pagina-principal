"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Send, LayoutGrid, Smartphone, ShieldCheck, Clock3 } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { formatCurrency } from "@/lib/format";

type TenantData = {
  id: string;
  name: string;
  slug: string;
  landingUrl: string;
  portalUrl: string;
};

type PublicRequestResult = {
  tenant: { id: string; name: string; slug: string };
  customer: { id: string };
  serviceOrder: { folio: string; status: string };
  portalUrl: string;
};

const estimateQuote = (budget: number) => {
  const subtotal = Number.isFinite(budget) && budget > 0 ? budget : 0;
  const vat = Number((subtotal * 0.16).toFixed(2));
  return {
    subtotal,
    vat,
    total: Number((subtotal + vat).toFixed(2))
  };
};

export default function TenantLandingPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PublicRequestResult | null>(null);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [deviceBrand, setDeviceBrand] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [reportedIssue, setReportedIssue] = useState("");
  const [budget, setBudget] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await apiClient.get<TenantData>(`/api/public/tenants/${params.slug}`);
        if (!response.success || !response.data) throw new Error(response.error?.message || "Tenant no encontrado");
        if (mounted) setTenant(response.data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "No se pudo cargar la landing");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [params.slug]);

  const quote = useMemo(() => estimateQuote(Number(budget.replace(/[^\d.]/g, ""))), [budget]);

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    setSubmitting(true);
    setError("");
    setResult(null);
    try {
      const response = await apiClient.post<PublicRequestResult>("/api/public/requests", {
        tenantSlug: tenant.slug,
        fullName,
        email,
        phone,
        deviceType,
        deviceBrand,
        deviceModel,
        reportedIssue,
        estimatedCost: quote.total
      });
      if (!response.success || !response.data) throw new Error(response.error?.message || "No se pudo enviar la solicitud");
      setResult(response.data);
      setFullName("");
      setEmail("");
      setPhone("");
      setDeviceType("");
      setDeviceBrand("");
      setDeviceModel("");
      setReportedIssue("");
      setBudget("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar la solicitud");
    } finally {
      setSubmitting(false);
    }
  }

  const portalHref = result?.portalUrl ? result.portalUrl : "/portal";

  return (
    <main className="min-h-screen bg-[#f7f3ee] text-slate-700">
      <section className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-[0_22px_55px_rgba(15,23,42,.08)] md:p-10">
          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#fbfbfc] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                <LayoutGrid className="h-4 w-4 text-[#8256f3]" />
                Landing pública del tenant
              </div>
              <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-[-0.06em] text-slate-700">
                {loading ? "Cargando..." : tenant?.name || "Landing del taller"}
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-slate-400">
                Cotiza tu servicio, envía tu solicitud y sigue el folio desde el portal del cliente.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={portalHref} className="rounded-full bg-[#121826] px-6 py-3 text-sm font-semibold text-white inline-flex items-center gap-2">
                  Ir al portal del cliente
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="w-full lg:w-[420px] rounded-[30px] border border-slate-200 bg-[#fbfbfc] p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8256f3]">Cotizador</div>
              <div className="mt-2 text-2xl font-black text-slate-800">Estimado rápido</div>
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                  <Sparkles className="h-5 w-5 text-[#8256f3]" />
                  <div>
                    <div className="text-sm font-semibold text-slate-700">Subtotal</div>
                    <div className="text-slate-400">${formatCurrency(quote.subtotal)} MXN</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                  <ShieldCheck className="h-5 w-5 text-[#f0a23a]" />
                  <div>
                    <div className="text-sm font-semibold text-slate-700">IVA</div>
                    <div className="text-slate-400">${formatCurrency(quote.vat)} MXN</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                  <Clock3 className="h-5 w-5 text-[#121826]" />
                  <div>
                    <div className="text-sm font-semibold text-slate-700">Total estimado</div>
                    <div className="text-slate-400">${formatCurrency(quote.total)} MXN</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_.95fr]">
            <form onSubmit={submitRequest} className="rounded-[30px] border border-slate-200 bg-white p-6 md:p-8">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8256f3]">Solicitar servicio</div>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-800">Envíanos tu solicitud</h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <input className="srf-input" placeholder="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                <input className="srf-input" placeholder="Correo electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input className="srf-input" placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <input className="srf-input" placeholder="Tipo de equipo" value={deviceType} onChange={(e) => setDeviceType(e.target.value)} required />
                <input className="srf-input" placeholder="Marca" value={deviceBrand} onChange={(e) => setDeviceBrand(e.target.value)} />
                <input className="srf-input" placeholder="Modelo" value={deviceModel} onChange={(e) => setDeviceModel(e.target.value)} />
                <textarea className="srf-input md:col-span-2 min-h-[120px] py-4" placeholder="Describe la falla reportada" value={reportedIssue} onChange={(e) => setReportedIssue(e.target.value)} required />
                <input className="srf-input md:col-span-2" placeholder="Presupuesto estimado opcional" value={budget} onChange={(e) => setBudget(e.target.value)} />
              </div>

              <button disabled={submitting} className="mt-6 srf-btn-primary px-6 py-4 inline-flex items-center gap-2 font-black">
                <Send className="h-4 w-4" />
                {submitting ? "Enviando..." : "Enviar solicitud"}
              </button>
            </form>

            <div className="space-y-6">
              <div className="rounded-[30px] border border-slate-200 bg-[#fbfbfc] p-6">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-[#8256f3]" />
                  <div className="text-lg font-black text-slate-800">Portal del cliente</div>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  Con tu folio podrás consultar el estado de la orden y ver el PDF generado por el taller.
                </p>
                <a href={portalHref} className="mt-5 inline-flex rounded-full bg-[#121826] px-5 py-3 text-sm font-semibold text-white">
                  Abrir portal
                </a>
              </div>

              {result && (
                <div className="rounded-[30px] border border-slate-200 bg-white p-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8256f3]">Solicitud enviada</div>
                  <div className="mt-2 text-2xl font-black text-slate-800">{result.serviceOrder.folio}</div>
                  <div className="mt-2 text-sm text-slate-500">Estado inicial: {result.serviceOrder.status}</div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a href={result.portalUrl} className="rounded-full bg-[#121826] px-5 py-3 text-sm font-semibold text-white inline-flex items-center gap-2">
                      Ir al folio
                      <ArrowRight className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}${result.portalUrl}`)}
                      className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
                    >
                      Copiar enlace
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-[30px] border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-600">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
