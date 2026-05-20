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

export default function SeguridadPage() {
  const { role } = useAuth();
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = (await fixService.getSecuritySummary()) as SecuritySummary;
        if (!cancelled) setSummary(data);
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

  const stats = useMemo(
    () => [
      { label: "Rol", value: summary?.role ?? role, helper: "Consumido desde JWT real." },
      { label: "Usuario", value: summary?.userId ?? "N/D", helper: "Sub del token." },
      { label: "Sucursal", value: summary?.sucursalId ?? "N/D", helper: "Contexto real del tenant." },
    ],
    [role, summary]
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
        subtitle="Resumen real de sesión, tenant y permisos derivado del JWT autenticado."
        icon="fas fa-shield-alt"
        actionLabel="Ver sesión"
        stats={stats}
        columns={[
          { label: "Campo", key: "field" },
          { label: "Valor", key: "value" },
        ]}
        rows={rows}
        emptyTitle={loading ? "Cargando seguridad…" : error ? "No pudimos cargar seguridad" : "Sin información de sesión"}
        emptyCopy={error || "La seguridad se resuelve desde el token firmado y la sesión autenticada. No hay placeholders."}
      />
    </RequireRole>
  );
}
