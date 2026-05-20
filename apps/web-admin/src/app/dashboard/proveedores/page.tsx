"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { fixService } from "@/services/fixService";

type SupplierRow = {
  business_name?: string;
  legal_name?: string;
  contact_name?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  city?: string;
  state?: string;
  categories?: string;
  lead_time_days?: string;
  payment_terms?: string;
  price_score?: string;
  speed_score?: string;
  quality_score?: string;
  reliability_score?: string;
  is_active?: string;
};

export default function ProveedoresPage() {
  const { role } = useAuth();
  const [rows, setRows] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await fixService.getSuppliers();
        if (!cancelled) setRows(data as SupplierRow[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar proveedores");
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
      { label: "Activos", value: String(rows.filter((item) => item.is_active !== "false").length), helper: "Datos reales de Supabase." },
      { label: "Totales", value: String(rows.length), helper: "Listado real del tenant." },
      { label: "Rol", value: role, helper: "Permisos reales por usuario." },
    ],
    [role, rows]
  );

  const tableRows = useMemo(
    () =>
      rows.map((row) => ({
        business_name: row.business_name ?? "",
        contact_name: row.contact_name ?? "",
        city: row.city ?? "",
        is_active: row.is_active ?? "",
      })),
    [rows]
  );

  return (
    <RequireRole allowed={["owner", "manager"]}>
      <ModuleShell
        title="Proveedores"
        subtitle="Catálogo real de proveedores del tenant desde Supabase."
        icon="fas fa-truck"
        actionLabel={role === "owner" ? "+ Nuevo proveedor" : "Solo lectura"}
        stats={stats}
        columns={[
          { label: "Proveedor", key: "business_name" },
          { label: "Contacto", key: "contact_name" },
          { label: "Ciudad", key: "city" },
          { label: "Activo", key: "is_active" },
        ]}
        rows={tableRows}
        emptyTitle={loading ? "Cargando proveedores…" : error ? "No pudimos cargar proveedores" : "No hay proveedores registrados todavía"}
        emptyCopy={error || "La lista real sale de /api/:tenantId/suppliers. Cuando esté vacía, se muestra vacío real."}
      />
    </RequireRole>
  );
}
