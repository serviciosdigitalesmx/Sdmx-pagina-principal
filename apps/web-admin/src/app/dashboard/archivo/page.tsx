"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, RefreshCw, Search, PackageCheck } from "lucide-react";
import { fixService } from "@/services/fixService";

type ArchiveRow = {
  id?: string;
  folio: string;
  client: string;
  cierre: string;
  estado: string;
};

function normalizeStatus(value: string) {
  if (!value) return "cerrada";
  const lower = value.toLowerCase();
  if (lower.includes("cancel")) return "cancelada";
  if (lower.includes("entreg")) return "entregada";
  if (lower.includes("list")) return "lista";
  return value;
}

function resolveCloseDate(order: Record<string, unknown>) {
  const date = String(order.updated_at ?? order.created_at ?? "");
  return date ? new Date(date).toLocaleDateString("es-MX") : "No disponible";
}

function badgeClass(status: string) {
  const lower = status.toLowerCase();
  if (lower.includes("cancel")) return "badge-cancelado";
  if (lower.includes("entreg")) return "badge-listo";
  if (lower.includes("list")) return "badge-diagnostico";
  return "badge-recibido";
}

export default function ArchivoPage() {
  const [rows, setRows] = useState<ArchiveRow[]>([]);
  const [filtered, setFiltered] = useState<ArchiveRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setLoading(true);
      setError("");
      const data = await fixService.getOrders();
      const archived = (data as Array<Record<string, unknown>>)
        .filter((order) => {
          const status = String(order.status ?? "").toLowerCase();
          return ["list", "entreg", "cerr", "complete", "ready", "delivered", "waiting"].some((value) => status.includes(value));
        })
        .map((order) => ({
          id: String(order.id ?? order.folio ?? ""),
          folio: String(order.folio ?? "Sin folio"),
          client: String((order.device_info as { customer_name?: string } | undefined)?.customer_name ?? order.customer_name ?? "Cliente no disponible"),
          cierre: resolveCloseDate(order),
          estado: normalizeStatus(String(order.status ?? "")),
        }));
      setRows(archived);
      setFiltered(archived);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar archivo");
      setRows([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      setFiltered(rows);
      return;
    }
    setFiltered(
      rows.filter((row) => [row.folio, row.client, row.estado].join(" ").toLowerCase().includes(term)),
    );
  }, [rows, search]);

  const deliveredCount = useMemo(
    () => filtered.filter((row) => row.estado.toLowerCase().includes("entreg")).length,
    [filtered],
  );

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="spinner w-8 h-8" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Archivo</h1>
          <p className="mt-1 text-sm text-srf-muted">{filtered.length} órdenes cerradas · {deliveredCount} entregadas</p>
        </div>
        <button onClick={() => void refresh()} className="btn-outline inline-flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card text-center">
          <Archive className="mx-auto w-5 h-5 text-srf-primary" />
          <div className="mt-3 text-3xl font-bold text-srf-primary">{filtered.length}</div>
          <div className="text-xs text-srf-muted">Órdenes en archivo</div>
        </div>
        <div className="card text-center">
          <PackageCheck className="mx-auto w-5 h-5 text-srf-accent" />
          <div className="mt-3 text-3xl font-bold text-srf-accent">{deliveredCount}</div>
          <div className="text-xs text-srf-muted">Entregadas</div>
        </div>
        <div className="card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-srf-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input pl-9"
              placeholder="Buscar por folio, cliente o estado..."
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-srf-primary/20 bg-srf-surface/40">
        <table className="w-full text-sm">
          <thead className="border-b border-srf-primary/20 bg-black/20 text-srf-muted">
            <tr>
              <th className="px-4 py-3 text-left">Folio</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Cierre</th>
              <th className="px-4 py-3 text-left">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id ?? row.folio} className="border-b border-srf-primary/10 hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-mono text-srf-primary">{row.folio}</td>
                <td className="px-4 py-3 text-srf-text">{row.client}</td>
                <td className="px-4 py-3 text-srf-muted">{row.cierre}</td>
                <td className="px-4 py-3"><span className={badgeClass(row.estado)}>{row.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-srf-muted">No hay órdenes cerradas o entregadas para mostrar.</div>
        ) : null}
      </div>
    </div>
  );
}
