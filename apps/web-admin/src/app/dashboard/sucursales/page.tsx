'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw, Edit2, Trash2, Building2, Phone, Mail, MapPin, ArrowRightLeft, Search } from 'lucide-react';
import { Badge, SurfaceCard } from '@white-label/ui';
import { apiClient } from '@/lib/api-client';
import { getApiOptions, getActiveSucursalId, setActiveSucursalId } from '@/lib/tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SucursalModal } from '@/components/sucursales/sucursal-modal';
import { TransferModal } from '@/components/sucursales/transfer-modal';
import { RequireRole } from '@/components/guard/RequireRole';
import { useAuth } from '@/components/guard/use-auth';
import type { Sucursal } from '@/types';

export default function SucursalesPage() {
  const router = useRouter();
  const auth = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [filteredSucursales, setFilteredSucursales] = useState<Sucursal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState<Sucursal | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [activeSucursalId, setActiveSucursalIdLocal] = useState<string | null>(null);

  const loadSucursales = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiClient.get<{ data: Sucursal[] }>('/sucursales', getApiOptions());
      setSucursales(data.data || []);
      setActiveSucursalIdLocal(getActiveSucursalId());
    } catch (error) {
      console.error('Failed to load sucursales:', error);
      setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar las sucursales');
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
    setActiveSucursalId(sucursalId, { skipReload: true });
    router.push('/dashboard');
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500/25 border-t-sky-400" />
      </div>
    );
  }

  if (loadError && sucursales.length === 0) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center text-sm text-rose-100">
        <p className="font-semibold">No se pudieron cargar las sucursales</p>
        <p className="mt-2 text-rose-100/80">{loadError}</p>
        <button
          type="button"
          onClick={() => loadSucursales()}
          className="mt-4 rounded-2xl border border-rose-500/20 bg-slate-950/70 px-4 py-2 font-semibold text-rose-100"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const activeCount = sucursales.filter((s) => s.is_active).length;

  return (
    <RequireRole allowed={['owner', 'manager']}>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-sky-400/70">Operación</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-50">Sucursales</h1>
          <p className="mt-1 text-sm text-slate-400">
            {activeCount} activas · {sucursales.length} total
          </p>
        </div>
        <div className="flex gap-2">
          {auth.role !== 'technician' && (
            <>
              <Button
                onClick={() => {
                setSelectedSucursal(null);
                setModalOpen(true);
              }}
                className="gap-2"
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
            </>
          )}
        </div>
      </div>

      {/* Search */}
      {loadError ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-100">{loadError}</div> : null}
      <SurfaceCard elevated className="relative p-4">
        <Input
          placeholder="Buscar sucursal..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </SurfaceCard>

      {/* Sucursales grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSucursales.map((sucursal) => (
          <SurfaceCard key={sucursal.id} elevated className="space-y-3 p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-sky-300" />
                  <h3 className="text-lg font-semibold text-slate-50">{sucursal.name}</h3>
                </div>
                {sucursal.code && (
                  <p className="mt-1 text-xs text-slate-400">Código: {sucursal.code}</p>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setSelectedSucursal(sucursal);
                    setModalOpen(true);
                  }}
                  className="rounded p-1 text-sky-300 hover:bg-sky-500/10"
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
              <div className="flex items-start gap-2 text-sm text-slate-400">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{sucursal.address}</span>
              </div>
            )}

            {sucursal.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Phone className="w-4 h-4" />
                <span>{sucursal.phone}</span>
              </div>
            )}

            {('email' in sucursal) && (sucursal as Sucursal & { email?: string | null }).email && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Mail className="w-4 h-4" />
                <span>{(sucursal as Sucursal & { email?: string | null }).email}</span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-800 pt-2">
              <Badge variant={sucursal.is_active ? 'success' : 'danger'}>
                {sucursal.is_active ? 'Activa' : 'Inactiva'}
              </Badge>
              <button
                onClick={() => handleSetActive(sucursal.id)}
                className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                  activeSucursalId === sucursal.id
                    ? 'bg-sky-400/20 text-sky-300'
                    : 'bg-sky-500/10 text-sky-300 hover:bg-sky-500/20'
                }`}
              >
                {activeSucursalId === sucursal.id ? 'Activa' : 'Usar'}
              </button>
            </div>
          </SurfaceCard>
        ))}
      </div>

      {filteredSucursales.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">No hay sucursales registradas</p>
        </div>
      )}

      {/* Modals */}
      {auth.role !== 'technician' && (
        <>
          <SucursalModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            sucursal={selectedSucursal}
            onSucursalSaved={(sucursal) => {
              loadSucursales();
              if (sucursal?.id) {
                setActiveSucursalId(sucursal.id);
                router.push('/dashboard');
              }
            }}
          />

          <TransferModal
            open={transferOpen}
            onOpenChange={setTransferOpen}
            sucursales={sucursales}
            onTransferComplete={() => {
              loadSucursales();
            }}
          />
        </>
      )}
    </div>
    </RequireRole>
  );
}
