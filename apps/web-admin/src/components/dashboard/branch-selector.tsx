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
    if (activeId === 'GLOBAL') return 'Vista general';
    const found = sucursales.find((s) => s.id === activeId);
    return found?.name || activeId?.slice(0, 8) || 'Seleccionar';
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
        <span className="text-sm text-slate-400">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 transition-colors hover:bg-slate-800"
      >
        <Building2 className="w-4 h-4 text-sky-400" />
        <span className="text-sm font-medium">{getActiveLabel()}</span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-[0_20px_60px_rgba(2,6,23,0.45)]">
            <div className="p-2">
              {showConsolidated && (
                <button
                  onClick={() => handleSelect('GLOBAL')}
                  className={`
                    flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors
                    ${activeId === 'GLOBAL'
                      ? 'bg-sky-500/10 text-sky-300'
                      : 'text-slate-100 hover:bg-slate-800'
                    }
                  `}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">Vista general</span>
                  {activeId === 'GLOBAL' && <Check className="w-4 h-4 ml-auto" />}
                </button>
              )}

              <div className="my-2 h-px bg-slate-800" />

              {sucursales.map((sucursal) => (
                <button
                  key={sucursal.id}
                  onClick={() => handleSelect(sucursal.id)}
                  className={`
                    flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors
                    ${activeId === sucursal.id
                      ? 'bg-sky-500/10 text-sky-300'
                      : 'text-slate-100 hover:bg-slate-800'
                    }
                  `}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm truncate">{sucursal.name}</span>
                  {activeId === sucursal.id && <Check className="w-4 h-4 ml-auto" />}
                </button>
              ))}

              {sucursales.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400">
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
