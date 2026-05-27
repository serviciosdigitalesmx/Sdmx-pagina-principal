"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { fixService } from "@/services/fixService";

type SecuritySummary = {
  tenantId: string | null;
  userId: string | null;
  role: string | null;
  email: string | null;
  sucursalId: string | null;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManageTenantSettings: boolean;
};

type TenantBillingSummary = {
  tenantId: string;
  tenantSlug: string;
  subscriptionStatus: string;
  trialExpiresAt: string | null;
  billingExempt: boolean;
  isTrialActive: boolean;
  isBillingBlocked: boolean;
  daysLeft: number | null;
  upgradeHref: string | null;
};

export default function SeguridadPage() {
  const { role } = useAuth();
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [billing, setBilling] = useState<TenantBillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const [data, tenantSettings] = await Promise.all([
          fixService.getSecuritySummary() as Promise<SecuritySummary>,
          fixService.getTenantSettings(),
        ]);
        if (!cancelled) setSummary(data);
        if (!cancelled) setBilling((tenantSettings.data.billing ?? null) as TenantBillingSummary | null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar seguridad");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshSecurity() {
    try {
      setLoading(true);
      setError("");
      const [data, tenantSettings] = await Promise.all([
        fixService.getSecuritySummary() as Promise<SecuritySummary>,
        fixService.getTenantSettings(),
      ]);
      setSummary(data);
      setBilling((tenantSettings.data.billing ?? null) as TenantBillingSummary | null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar seguridad");
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(
    () => [
      { label: "Rol", value: summary?.role ?? role, helper: "Tu rol actual." },
      { label: "Usuario", value: summary?.userId ?? "N/D", helper: "Tu sesión actual." },
      { label: "Sucursal", value: summary?.sucursalId ?? "N/D", helper: "Tu sucursal actual." },
      {
        label: "Suscripción",
        value: billing?.subscriptionStatus ?? "trial",
        helper: billing?.isBillingBlocked ? "Bloqueado por trial vencido." : "Operación habilitada.",
      },
    ],
    [billing?.isBillingBlocked, billing?.subscriptionStatus, role, summary]
  );

  const rows = summary
    ? [
        { field: "tenantId", value: summary.tenantId ?? "" },
        { field: "email", value: summary.email ?? "" },
        { field: "canManageUsers", value: String(summary.canManageUsers) },
        { field: "canManageRoles", value: String(summary.canManageRoles) },
        { field: "canManageTenantSettings", value: String(summary.canManageTenantSettings) },
      ]
    : [];

  return (
    <RequireRole allowed={["owner", "manager", "technician"]}>
      <ModuleShell
        title="Seguridad y roles"
        subtitle="Resumen de sesión, tenant, permisos y estado de suscripción."
        icon="fas fa-shield-alt"
        actionLabel="Ver sesión"
        secondaryActionLabel="Actualizar"
        secondaryOnAction={() => void refreshSecurity()}
        tertiaryActionLabel="Recargar"
        tertiaryOnAction={() => void refreshSecurity()}
        stats={stats}
        columns={[
          { label: "Campo", key: "field" },
          { label: "Valor", key: "value" },
        ]}
        rows={rows}
        emptyTitle={loading ? "Cargando seguridad…" : error ? "No pudimos cargar seguridad" : "Sin información de sesión"}
        emptyCopy={error || "La seguridad se muestra desde tu sesión actual."}
      />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-amber-700/15 bg-[linear-gradient(180deg,rgba(16,14,12,0.96),rgba(22,18,14,0.98))] p-5 text-zinc-100 shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-100/70">Trial</p>
          <p className="mt-2 text-2xl font-semibold">{billing?.daysLeft ?? "N/D"} días</p>
          <p className="mt-2 text-sm text-zinc-300">
            {billing?.trialExpiresAt ? `Expira ${new Date(billing.trialExpiresAt).toLocaleDateString('es-MX')}` : "No hay expiración registrada."}
          </p>
        </article>
        <article className="rounded-3xl border border-amber-700/15 bg-[linear-gradient(180deg,rgba(16,14,12,0.96),rgba(22,18,14,0.98))] p-5 text-zinc-100 shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-100/70">Estado</p>
          <p className="mt-2 text-2xl font-semibold">{billing?.subscriptionStatus ?? "trial"}</p>
          <p className="mt-2 text-sm text-zinc-300">
            {billing?.billingExempt ? "Tenancy exenta de cobro." : billing?.isBillingBlocked ? "Limitado por suscripción vencida." : "Operación habilitada."}
          </p>
        </article>
        <article className="rounded-3xl border border-amber-700/15 bg-[linear-gradient(180deg,rgba(16,14,12,0.96),rgba(22,18,14,0.98))] p-5 text-zinc-100 shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-100/70">Upgrade</p>
          <p className="mt-2 text-2xl font-semibold">{billing?.upgradeHref ? "Disponible" : "Pendiente"}</p>
          <p className="mt-2 text-sm text-zinc-300 break-all">
            {billing?.upgradeHref ?? "Configura APP_URL para publicar el enlace de activación."}
          </p>
        </article>
      </div>
    </RequireRole>
  );
}
