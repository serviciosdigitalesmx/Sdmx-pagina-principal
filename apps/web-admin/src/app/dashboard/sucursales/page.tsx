"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw, Edit2, Trash2, Building2, Phone, Mail, MapPin, ArrowRightLeft } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { getApiOptions, getActiveSucursalId, setActiveSucursalId } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SucursalModal } from "@/components/sucursales/sucursal-modal";
import { TransferModal } from "@/components/sucursales/transfer-modal";
import type { Sucursal } from "@/types";

export default function SucursalesPage() {
  const [loading, setLoading] = useState(true);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [filteredSucursales, setFilteredSucursales] = useState<Sucursal[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSucursal, setSelectedSucursal] = useState<Sucursal | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [activeSucursalId, setActiveSucursalIdLocal] = useState<string | null>(null);

  const loadSucursales = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ data: Sucursal[] }>("/sucursales", getApiOptions());
      setSucursales(data.data || []);
      setActiveSucursalIdLocal(getActiveSucursalId());
    } catch (error) {
      console.error("Failed to load sucursales:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSucursales(); }, []);

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = sucursales.filter((s) => s.name.toLowerCase().includes(term) || (s.code && s.code.toLowerCase().includes(term)) || (s.address && s.address.toLowerCase().includes(term)));
      setFilteredSucursales(filtered);
    } else {
      setFilteredSucursales(sucursales);
    }
  }, [searchTerm, sucursales]);

  const handleSetActive = (sucursalId: string | null) => {
    setActiveSucursalId(sucursalId);
    window.location.reload();
  };

  const handleDelete = async (sucursal: Sucursal) => {
    if (!confirm(`¿Eliminar la sucursal "${sucursal.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await apiClient.delete(`/sucursales/${sucursal.id}`, getApiOptions());
      loadSucursales();
    } catch (error) {
      console.error("Failed to delete sucursal:", error);
      alert("No se pudo eliminar la sucursal");
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><div className="spinner h-8 w-8" /></div>;

  const activeCount = sucursales.filter((s) => s.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Sucursales</h1>
          <p className="mt-1 text-sm text-srf-muted">{sucursales.length} sucursales · {activeCount} activas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => loadSucursales()} variant="outline" className="gap-2"><RefreshCw className="h-4 w-4" /> Actualizar</Button>
          <Button onClick={() => { setSelectedSucursal(null); setModalOpen(true); }} className="btn-primary gap-2"><Plus className="h-4 w-4" /> Nueva sucursal</Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Input placeholder="Buscar por nombre, código o ciudad..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Button onClick={() => setTransferOpen(true)} variant="outline" className="gap-2"><ArrowRightLeft className="h-4 w-4" /> Transferencia</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredSucursales.map((sucursal) => (
          <div key={sucursal.id} className={`card p-4 ${activeSucursalId === sucursal.id ? "border-srf-accent" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-srf-primary" />
                  <p className="font-semibold">{sucursal.name}</p>
                </div>
                <p className="text-xs text-srf-muted">{sucursal.code || "Sin código"}</p>
              </div>
              <span className={`badge-${sucursal.is_active ? "listo" : "cancelado"} text-xs`}>{sucursal.is_active ? "Activa" : "Inactiva"}</span>
            </div>
            <div className="mt-4 space-y-2 text-sm text-srf-muted">
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {sucursal.address || "Sin dirección"}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {sucursal.phone || "Sin teléfono"}</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {sucursal.city || "Sin ciudad"}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => { setSelectedSucursal(sucursal); setModalOpen(true); }} className="rounded p-1 text-srf-primary hover:bg-srf-primary/20"><Edit2 className="h-4 w-4" /></button>
              <button onClick={() => handleDelete(sucursal)} className="rounded p-1 text-red-400 hover:bg-red-500/20"><Trash2 className="h-4 w-4" /></button>
              <button onClick={() => handleSetActive(sucursal.id)} className="rounded p-1 text-srf-accent hover:bg-srf-accent/20">Activa</button>
            </div>
          </div>
        ))}
      </div>

      {filteredSucursales.length === 0 ? <div className="py-12 text-center"><p className="text-srf-muted">No hay sucursales con esos filtros</p></div> : null}

      <SucursalModal open={modalOpen} onOpenChange={setModalOpen} sucursal={selectedSucursal} onSucursalSaved={() => loadSucursales()} />
      <TransferModal />
    </div>
  );
}

