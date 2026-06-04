'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Calendar, Package, DollarSign, FileText } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { getApiOptions } from '@/lib/tenant';
import type { Customer, CustomerHistory } from '@/types';

interface CustomerHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

export function CustomerHistory({ open, onOpenChange, customer }: CustomerHistoryProps) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<CustomerHistory | null>(null);

  useEffect(() => {
    if (customer && open) {
      loadHistory();
    }
  }, [customer, open]);

  const loadHistory = async () => {
    if (!customer) return;
    setLoading(true);
    try {
      // Endpoint NO CONFIRMADO - usar con precaución
      const data = await apiClient.get<CustomerHistory>(`/customers/${customer.id}/history`, getApiOptions());
      setHistory(data);
    } catch (error) {
      console.error('Failed to load customer history:', error);
      // Fallback: mostrar datos básicos
      setHistory({
        totalEquipos: 0,
        totalReparaciones: 0,
        totalCotizaciones: 0,
        ticketPromedio: 0,
        ultimaVisita: null,
        equipos: [],
        cotizaciones: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-srf-surface border-srf-primary/40">
        <DialogHeader>
          <DialogTitle className="text-srf-primary">
            Historial - {customer.name}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-srf-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-srf-bg rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-srf-primary">{history?.totalEquipos || 0}</div>
                <div className="text-xs text-srf-muted">Equipos</div>
              </div>
              <div className="bg-srf-bg rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-500">{history?.totalReparaciones || 0}</div>
                <div className="text-xs text-srf-muted">Reparaciones</div>
              </div>
              <div className="bg-srf-bg rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-500">{history?.totalCotizaciones || 0}</div>
                <div className="text-xs text-srf-muted">Cotizaciones</div>
              </div>
              <div className="bg-srf-bg rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-srf-accent">${(history?.ticketPromedio || 0).toFixed(2)}</div>
                <div className="text-xs text-srf-muted">Ticket promedio</div>
              </div>
            </div>

            {/* Equipos table */}
            {history?.equipos && history.equipos.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-srf-primary mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Equipos y reparaciones
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-srf-muted border-b border-srf-primary/30">
                      <tr>
                        <th className="text-left py-2">Folio</th>
                        <th className="text-left py-2">Equipo</th>
                        <th className="text-left py-2">Estado</th>
                        <th className="text-left py-2">Fecha</th>
                        <th className="text-right py-2">Costo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.equipos.map((equipo) => (
                        <tr key={equipo.FOLIO} className="border-b border-srf-primary/20">
                          <td className="py-2 font-mono text-srf-primary">{equipo.FOLIO}</td>
                          <td className="py-2">{equipo.TIPO} {equipo.MODELO}</td>
                          <td className="py-2">{equipo.ESTADO}</td>
                          <td className="py-2">{formatDate(equipo.FECHA_INGRESO)}</td>
                          <td className="py-2 text-right">${equipo.COSTO_ESTIMADO.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Cotizaciones table */}
            {history?.cotizaciones && history.cotizaciones.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-srf-primary mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Cotizaciones
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-srf-muted border-b border-srf-primary/30">
                      <tr>
                        <th className="text-left py-2">Folio</th>
                        <th className="text-left py-2">Dispositivo</th>
                        <th className="text-left py-2">Estado</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.cotizaciones.map((cot) => (
                        <tr key={cot.folio} className="border-b border-srf-primary/20">
                          <td className="py-2 font-mono text-srf-primary">{cot.folio}</td>
                          <td className="py-2">{cot.dispositivo} {cot.modelo}</td>
                          <td className="py-2">{cot.estado}</td>
                          <td className="py-2 text-right">${cot.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(!history?.equipos?.length && !history?.cotizaciones?.length) && (
              <div className="text-center py-8 text-srf-muted">
                Sin historial de equipos o cotizaciones
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}