"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DynamicFields, type DynamicFieldDefinition } from "@white-label/ui";
import { Badge, SurfaceCard } from "@white-label/ui";
import { getPublicApiPath } from "@/lib/public-api";

const fieldClassName =
  "w-full rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/15";

type QuotePayload = {
  fullName: string;
  phone: string;
  email: string;
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  serialNumber: string;
  priorityLevel: string;
  passwordOrPin: string;
  issue: string;
};

type QuoteResponse = {
  success: true;
  tenant: {
    id: string;
    slug: string;
    name: string;
    branding?: {
      primaryColor?: string;
      secondaryColor?: string;
      logoUrl?: string;
    } | null;
  };
  data: {
    id: string;
    folio: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string | null;
    device_type: string;
    device_model: string;
    issue_description: string;
    status: string;
  };
};

type PublicTenantConfig = {
  fieldDefinitions?: DynamicFieldDefinition[];
  labels?: Record<string, string>;
};

function buildTrackingHref(tenant: string, folio: string) {
  return `/${encodeURIComponent(tenant)}/tracking?folio=${encodeURIComponent(folio)}`;
}

function coerceDynamicValue(definition: DynamicFieldDefinition, value: string | boolean | undefined) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (definition.field_type === "number" || definition.field_type === "money") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return value;
}

function findSerialFieldDefinition(definitions: DynamicFieldDefinition[]) {
  return definitions.find((definition) => definition.entity === "service_requests" && definition.field_key === "serial_number" && definition.visible !== false) ?? null;
}

export default function TenantQuotePage() {
  const params = useParams<{ tenant: string }>();
  const tenant = params?.tenant ?? "";
  const [form, setForm] = useState<QuotePayload>({
    fullName: "",
    phone: "",
    email: "",
    deviceType: "",
    deviceBrand: "",
    deviceModel: "",
    serialNumber: "",
    priorityLevel: "",
    passwordOrPin: "",
    issue: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [folio, setFolio] = useState<string | null>(null);
  const [dynamicFieldDefinitions, setDynamicFieldDefinitions] = useState<DynamicFieldDefinition[]>([]);
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, string | boolean>>({});
  const [tenantLabels, setTenantLabels] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const response = await fetch(getPublicApiPath(`/api/public/tenant/${encodeURIComponent(tenant)}/landing`));
        const payload = (await response.json().catch(() => null)) as { success?: boolean; data?: { tenant?: { config?: PublicTenantConfig } } } | null;
        if (!response.ok || !payload?.success) {
          throw new Error("No se pudo cargar la configuración del tenant");
        }
        const definitions = payload.data?.tenant?.config?.fieldDefinitions ?? [];
        const labels = (payload.data?.tenant?.config as { labels?: Record<string, string> } | undefined)?.labels ?? {};
        if (!cancelled) {
          setDynamicFieldDefinitions(definitions.filter((item) => item.entity === "service_requests" && item.visible !== false));
          setTenantLabels(labels);
        }
      } catch {
        if (!cancelled) setDynamicFieldDefinitions([]);
      }
    }

    if (tenant) {
      void loadSettings();
    }

    return () => {
      cancelled = true;
    };
  }, [tenant]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setFolio(null);

    const serialFieldDefinition = findSerialFieldDefinition(dynamicFieldDefinitions);
    const visibleDynamicFieldDefinitions = dynamicFieldDefinitions.filter((definition) => !(definition.entity === "service_requests" && definition.field_key === "serial_number"));

    for (const definition of visibleDynamicFieldDefinitions) {
      if (!definition.required || definition.visible === false) continue;
      const value = dynamicFieldValues[definition.field_key];
      const missing =
        definition.field_type === "boolean"
          ? value === undefined || value === null
          : typeof value === "string"
            ? value.trim().length === 0
            : value === undefined || value === null;
      if (missing) {
        setLoading(false);
        setError(`Falta completar el campo requerido: ${definition.field_label}`);
        return;
      }
    }

    const dynamicMetadata = visibleDynamicFieldDefinitions.reduce<Record<string, string | boolean | number>>((acc, definition) => {
      const value = coerceDynamicValue(definition, dynamicFieldValues[definition.field_key]);
      if (value !== undefined) {
        acc[definition.field_key] = value;
      }
      return acc;
    }, {});

    try {
      if (serialFieldDefinition?.required && !form.serialNumber.trim()) {
        setLoading(false);
        setError(`Falta completar el campo requerido: ${serialFieldDefinition.field_label}`);
        return;
      }

      const response = await fetch(getPublicApiPath("/api/public/quotes"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug: tenant, ...form, metadata: dynamicMetadata }),
      });

      const payload = (await response.json().catch(() => null)) as QuoteResponse | { error?: string; details?: unknown } | null;

      if (!response.ok) {
        throw new Error(payload && "error" in payload && payload.error ? payload.error : "No se pudo enviar tu solicitud");
      }

      if (!payload || !("success" in payload)) {
        throw new Error("Respuesta inválida del servidor");
      }

      setFolio(payload.data.folio);
      setMessage(`Solicitud enviada. Folio: ${payload.data.folio}. Ya quedó en el buzón del taller.`);
      setForm({
        fullName: "",
        phone: "",
        email: "",
        deviceType: "",
        deviceBrand: "",
        deviceModel: "",
        serialNumber: "",
        priorityLevel: "",
        passwordOrPin: "",
        issue: "",
      });
      setDynamicFieldValues({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_26%),radial-gradient(circle_at_80%_10%,_rgba(14,165,233,0.06),_transparent_24%),linear-gradient(180deg,#020617_0%,#050b16_48%,#0b1220_100%)] px-4 py-8 text-slate-50">
      <section className="mx-auto grid w-full max-w-5xl gap-8 rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(9,14,26,0.96),rgba(11,18,32,0.98))] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.22)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <Badge variant="neutral">Cotizador</Badge>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
              {tenantLabels.request ?? "Cuéntanos la falla y te generamos una solicitud real"}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Captura el caso, liga el activo al tenant actual y deja lista la entrada para que recepción lo convierta en servicio.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/${tenant}`} className="rounded-full border border-white/10 px-5 py-3 font-medium text-slate-100 transition hover:bg-white/5">
                Volver al taller
              </Link>
              <Link href={`/${tenant}/tracking`} className="rounded-full border border-white/10 px-5 py-3 font-medium text-slate-100 transition hover:bg-white/5">
                Ver estatus
              </Link>
            </div>
          </div>

          <SurfaceCard elevated className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">Qué ocurre al enviar</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
              <li>• La solicitud se envía para registrarse.</li>
              <li>• Se asocia al taller actual.</li>
              <li>• Recepción recibe marca, modelo, serie y urgencia para abrir el caso.</li>
              <li>• Recepción puede convertirla en servicio con un clic.</li>
            </ul>
          </SurfaceCard>
        </div>

        <SurfaceCard elevated className="p-6">
          <form onSubmit={submit} className="grid gap-4">
          {(() => {
            const serialFieldDefinition = findSerialFieldDefinition(dynamicFieldDefinitions);
            const fields = [
            ["Nombre", "fullName", "text", "Nombre completo del cliente.", true],
            ["WhatsApp", "phone", "tel", "Número de teléfono de contacto.", true],
            ["Correo", "email", "email", "Dirección de correo electrónico.", true],
            ["Tipo de equipo", "deviceType", "text", "Tipo de dispositivo (Celular, Laptop, Consola).", true],
            ["Marca", "deviceBrand", "text", "Marca del fabricante.", true],
            ["Modelo", "deviceModel", "text", "Modelo específico.", true],
            [
              serialFieldDefinition?.field_label ?? "Serie / IMEI",
              "serialNumber",
              "text",
              serialFieldDefinition?.help_text ?? "Número de serie o identificador único.",
              Boolean(serialFieldDefinition?.required),
              serialFieldDefinition?.placeholder ?? "IMEI o número de serie",
            ],
            ["Nivel de urgencia", "priorityLevel", "text", "Prioridad (Normal, Alta o Urgente).", true],
            ["PIN / contraseña", "passwordOrPin", "password", "Clave o patrón de desbloqueo (opcional y confidencial).", false],
            ];

            return fields.map(([label, key, type, helperText, isRequired, placeholder]) => (
            <div key={key as string}>
              <label className="mb-2 block text-sm font-medium text-slate-300">{label}</label>
              <input
                type={type as string}
                value={(form as Record<string, string>)[key as string]}
                onChange={(e) => setForm((current) => ({ ...current, [key as string]: e.target.value }))}
                className={fieldClassName}
                placeholder={placeholder as string | undefined}
                required={isRequired as boolean}
              />
              <p className="mt-1 text-xs text-slate-500">{helperText as string}</p>
            </div>
            ));
          })()}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">{tenantLabels.diagnosis ?? "Problema"}</label>
            <textarea
              value={form.issue}
              onChange={(e) => setForm((current) => ({ ...current, issue: e.target.value }))}
              className={fieldClassName}
              rows={4}
              required
            />
            <p className="mt-1 text-xs text-slate-500">Describe detalladamente la falla o desperfecto del equipo.</p>
          </div>

          {dynamicFieldDefinitions.filter((definition) => !(definition.entity === "service_requests" && definition.field_key === "serial_number")).length > 0 ? (
            <DynamicFields
              title={tenantLabels.request ? `Campos de ${tenantLabels.request.toLowerCase()}` : "Campos del tenant"}
              definitions={dynamicFieldDefinitions.filter((definition) => !(definition.entity === "service_requests" && definition.field_key === "serial_number"))}
              values={dynamicFieldValues}
              onChange={(fieldKey, value) => setDynamicFieldValues((current) => ({ ...current, [fieldKey]: value }))}
              className="grid gap-4 rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-6"
            />
          ) : null}

          {error ? <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
          {message ? <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}
          {folio ? (
            <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4 text-sm text-slate-300">
              <div className="font-semibold text-slate-50">Folio real: {folio}</div>
              <Link href={buildTrackingHref(tenant, folio)} className="mt-2 inline-flex font-semibold text-sky-100">
                Ir al tracking
              </Link>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button disabled={loading} className="rounded-full bg-sky-500/15 px-6 py-3 font-medium text-sky-100 transition hover:bg-sky-500/20 disabled:opacity-60">
              {loading ? "Enviando..." : "Enviar solicitud"}
            </button>
            <p className="text-sm leading-6 text-slate-400">
              La solicitud queda ligada al taller actual.
            </p>
          </div>
          </form>
        </SurfaceCard>
      </section>
    </main>
  );
}
