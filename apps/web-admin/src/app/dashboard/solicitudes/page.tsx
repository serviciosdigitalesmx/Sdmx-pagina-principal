'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, FileText, MessageSquare } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { getApiOptions } from '@/lib/tenant';
import { RequestCard } from '@/components/solicitudes/request-card';
import { QuoteModal } from '@/components/solicitudes/quote-modal';
import type { ServiceRequest } from '@/types';

export default function SolicitudesPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadRequests = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const data = await apiClient.get<{ data: ServiceRequest[] }>('/requests', getApiOptions());
      // Filtrar solo pendientes
      const pending = (data.data || []).filter((r) => r.status === 'pendiente');
      setRequests(pending);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
      if (showRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => loadRequests(), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleQuoteClick = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setModalOpen(true);
  };

  const handleConvert = async (requestId: string) => {
    if (!confirm('¿Convertir esta solicitud en orden?')) return;
    try {
      await apiClient.post(`/requests/${requestId}/convert`, {}, getApiOptions());
      loadRequests();
    } catch (error) {
      console.error('Failed to convert request:', error);
      alert('No se pudo convertir la solicitud');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Solicitudes</h1>
          <p className="text-srf-muted text-sm mt-1">
            Pendientes: <span className="font-bold text-srf-accent">{requests.length}</span>
          </p>
        </div>
        <button
          onClick={() => loadRequests(true)}
          disabled={refreshing}
          className="btn-outline py-2"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Requests grid */}
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-srf-muted">No hay solicitudes pendientes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onQuote={() => handleQuoteClick(request)}
              onConvert={() => handleConvert(request.id)}
            />
          ))}
        </div>
      )}

      {/* Quote Modal */}
      <QuoteModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        request={selectedRequest}
        onQuoteConverted={() => loadRequests()}
      />
    </div>
  );
}
