'use client';

import { useState, useEffect } from 'react';
import { Building2, Check, ChevronDown, Globe } from 'lucide-react';
import { getActiveSucursalId, setActiveSucursalId, canUseConsolidatedView } from '@/lib/tenant';
import { apiClient } from '@/lib/api-client';
import { getTenantSlug } from '@/lib/tenant';
import type { Sucursal } from '@/types';

export function BranchSelector() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const showConsolidated = canUseConsolidatedView();

  const loadSucursales = async () => {
    try {
      const data = await apiClient.get<{ data: Sucursal[] }>('/sucursales', {
        tenantSlug: getTenantSlug() || undefined,
      });
      const active = getActiveSucursalId();
      setSucursales(data.data || []);
      setActiveId(active);
    } catch (error) {
      console.error('Failed to load sucursales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSucursales();
  }, []);

  const handleSelect = (sucursalId: string | null) => {
    setActiveSucursalId(sucursalId);
    setActiveId(sucursalId);
    setOpen(false);
  };

  const getActiveLabel = () => {
    if (activeId === 'GLOBAL') return 'Todas las sucursales';
    const found = sucursales.find((s) => s.id === activeId);
    return found?.name || activeId?.slice(0, 8) || 'Seleccionar';
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="spinner w-4 h-4" />
        <span className="text-sm text-srf-muted">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-srf-surface/50 hover:bg-srf-surface transition-colors"
      >
        <Building2 className="w-4 h-4 text-srf-primary" />
        <span className="text-sm font-medium">{getActiveLabel()}</span>
        <ChevronDown className="w-4 h-4 text-srf-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-64 rounded-lg bg-srf-surface border border-srf-primary/30 shadow-lg z-50 overflow-hidden">
            <div className="p-2">
              {showConsolidated && (
                <button
                  onClick={() => handleSelect('GLOBAL')}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${activeId === 'GLOBAL'
                      ? 'bg-srf-accent/20 text-srf-accent'
                      : 'text-srf-text hover:bg-srf-primary/10'
                    }
                  `}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">Todas las sucursales</span>
                  {activeId === 'GLOBAL' && <Check className="w-4 h-4 ml-auto" />}
                </button>
              )}

              <div className="h-px bg-srf-primary/20 my-2" />

              {sucursales.map((sucursal) => (
                <button
                  key={sucursal.id}
                  onClick={() => handleSelect(sucursal.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${activeId === sucursal.id
                      ? 'bg-srf-accent/20 text-srf-accent'
                      : 'text-srf-text hover:bg-srf-primary/10'
                    }
                  `}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm truncate">{sucursal.name}</span>
                  {activeId === sucursal.id && <Check className="w-4 h-4 ml-auto" />}
                </button>
              ))}

              {sucursales.length === 0 && (
                <p className="text-sm text-srf-muted text-center py-4">
                  No hay sucursales
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}