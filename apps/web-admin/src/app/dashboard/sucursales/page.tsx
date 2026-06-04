'use client';

import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Edit2, Trash2, Building2, Phone, Mail, MapPin, ArrowRightLeft } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { getApiOptions, getActiveSucursalId, setActiveSucursalId } from '@/lib/tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SucursalModal } from '@/components/sucursales/sucursal-modal';
import { TransferModal } from '@/components/sucursales/transfer-modal';
import type { Sucursal } from '@/types';

export default function SucursalesPage() {
  const [loading, setLoading] = useState(true);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [filteredSucursales, setFilteredSucursales] = useState<Sucursal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState<Sucursal | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [activeSucursalId, setActiveSucursalIdLocal] = useState<string | null>(null);

  const loadSucursales = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ data: Sucursal[] }>('/sucursales', getApiOptions());
      setSucursales(data.data || []);
      setActiveSucursalIdLocal(getActiveSucursalId());
    } catch (error) {
      console.error('Failed to load sucursales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSucursales();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = sucursales.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          (s.code && s.code.toLowerCase().includes(term)) ||
          (s.address && s.address.toLowerCase().includes(term))
      );
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
      console.error('Failed to delete sucursal:', error);
      alert('No se pudo eliminar la sucursal');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  const activeCount = sucursales.filter((s) => s.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Sucursales</h1>
          <p className="text-srf-muted text-sm mt-1">
            {activeCount} activas · {sucursales.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectedSucursal(null);
              setModalOpen(true);
            }}
            className="btn-primary gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva sucursal
          </Button>
          <Button
            onClick={() => setTransferOpen(true)}
            variant="outline"
            className="gap-2"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Transferir stock
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Input
          placeholder="Buscar sucursal..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-srf-muted" />
      </div>

      {/* Sucursales grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSucursales.map((sucursal) => (
          <div key={sucursal.id} className="card p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-srf-primary" />
                  <h3 className="font-bold text-lg">{sucursal.name}</h3>
                </div>
                {sucursal.code && (
                  <p className="text-xs text-srf-muted mt-1">Código: {sucursal.code}</p>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setSelectedSucursal(sucursal);
                    setModalOpen(true);
                  }}
                  className="p-1 rounded hover:bg-srf-primary/20 text-srf-primary"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(sucursal)}
                  className="p-1 rounded hover:bg-red-500/20 text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {sucursal.address && (
              <div className="flex items-start gap-2 text-sm text-srf-muted">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{sucursal.address}</span>
              </div>
            )}

            {sucursal.phone && (
              <div className="flex items-center gap-2 text-sm text-srf-muted">
                <Phone className="w-4 h-4" />
                <span>{sucursal.phone}</span>
              </div>
            )}

            {('email' in sucursal) && (sucursal as Sucursal & { email?: string | null }).email && (
              <div className="flex items-center gap-2 text-sm text-srf-muted">
                <Mail className="w-4 h-4" />
                <span>{(sucursal as Sucursal & { email?: string | null }).email}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-srf-primary/20">
              <span className={`text-xs px-2 py-0.5 rounded-full ${sucursal.is_active ? 'badge-listo' : 'badge-cancelado'}`}>
                {sucursal.is_active ? 'Activa' : 'Inactiva'}
              </span>
              <button
                onClick={() => handleSetActive(sucursal.id)}
                className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                  activeSucursalId === sucursal.id
                    ? 'bg-srf-accent/20 text-srf-accent'
                    : 'bg-srf-primary/10 text-srf-primary hover:bg-srf-primary/20'
                }`}
              >
                {activeSucursalId === sucursal.id ? 'Activa' : 'Usar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredSucursales.length === 0 && (
        <div className="text-center py-12">
          <p className="text-srf-muted">No hay sucursales registradas</p>
        </div>
      )}

      {/* Modals */}
      <SucursalModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        sucursal={selectedSucursal}
        onSucursalSaved={() => loadSucursales()}
      />

      <TransferModal
        open={transferOpen}
        onOpenChange={setTransferOpen}
        sucursales={sucursales}
        onTransferComplete={() => {
          loadSucursales();
        }}
      />
    </div>
  );
}

import { Search } from 'lucide-react';
