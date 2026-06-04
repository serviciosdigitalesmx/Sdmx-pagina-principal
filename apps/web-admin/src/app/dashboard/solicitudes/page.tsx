"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { getApiOptions } from "@/lib/tenant";
import { RequestCard } from "@/components/solicitudes/request-card";
import { QuoteModal } from "@/components/solicitudes/quote-modal";
import type { ServiceRequest } from "@/types";

export default function SolicitudesPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadRequests = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const data = await apiClient.get<{ data: ServiceRequest[] }>("/requests", getApiOptions());
      setRequests((data.data || []).filter((r) => r.status === "pendiente"));
    } catch (error) {
      console.error("Failed to load requests:", error);
    } finally {
      setLoading(false);
      if (showRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(() => loadRequests(), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleQuoteClick = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setModalOpen(true);
  };

  const handleArchive = async (folio: string) => {
    if (!confirm("¿Archivar esta solicitud?")) return;
    try {
      await apiClient.post(`/requests/${folio}/archive`, {}, getApiOptions());
      loadRequests();
    } catch (error) {
      console.error("Failed to archive request:", error);
      alert("No se pudo archivar la solicitud");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="spinner h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Solicitudes</h1>
          <p className="mt-1 text-sm text-srf-muted">
            Pendientes: <span className="font-bold text-srf-accent">{requests.length}</span>
          </p>
        </div>
        <button onClick={() => loadRequests(true)} disabled={refreshing} className="btn-outline py-2">
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-srf-muted">No hay solicitudes pendientes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} onQuote={() => handleQuoteClick(request)} onArchive={() => handleArchive(request.folio)} />
          ))}
        </div>
      )}

      <QuoteModal open={modalOpen} onOpenChange={setModalOpen} request={selectedRequest} onQuoted={() => loadRequests()} />
    </div>
  );
}

