"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { getApiOptions } from "@/lib/tenant";
import { OrderCard } from "@/components/tecnico/order-card";
import { OrderModal } from "@/components/tecnico/order-modal";
import type { Order } from "@/types";

export default function TecnicoPage() {
  const searchParams = useSearchParams();
  const orderIdFromUrl = searchParams.get("order");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ data: Order[] }>("/orders", getApiOptions());
      const ordersList = data.data || [];
      const enrichedOrders = ordersList.map((order) => {
        let diasRestantes = order.diasRestantes;
        let color = order.color;
        if (diasRestantes === undefined && order.promised_date) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const promise = new Date(order.promised_date);
          promise.setHours(0, 0, 0, 0);
          diasRestantes = Math.ceil((promise.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diasRestantes < 0) color = "rojo";
          else if (diasRestantes === 0) color = "amarillo";
          else if (diasRestantes <= 3) color = "verde";
          else color = "gris";
        }
        return { ...order, diasRestantes, color };
      });
      setOrders(enrichedOrders);
      setFilteredOrders(enrichedOrders);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  useEffect(() => {
    if (orderIdFromUrl && orders.length > 0) {
      const order = orders.find((o) => o.id === orderIdFromUrl || o.folio === orderIdFromUrl);
      if (order) setSelectedOrder(order);
    }
  }, [orderIdFromUrl, orders]);

  if (loading) return <div className="flex h-full items-center justify-center"><div className="spinner h-8 w-8" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Técnico</h1>
          <p className="mt-1 text-sm text-srf-muted">{filteredOrders.length} órdenes visibles</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrders.map((order) => (
          <OrderCard key={order.id} order={order} onClick={() => setSelectedOrder(order)} />
        ))}
      </div>
      <OrderModal open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)} order={selectedOrder} onOrderUpdated={() => loadOrders()} />
    </div>
  );
}

