"use client";

import { useState, useEffect } from "react";
import { Plus, Search, RefreshCw, Edit2, Eye, Phone, Wrench } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { getApiOptions } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomerModal } from "@/components/clientes/customer-modal";
import { CustomerHistory } from "@/components/clientes/customer-history";
import type { Customer } from "@/types";

export default function ClientesPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [duplicates, setDuplicates] = useState<string[]>([]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ data: Customer[] }>("/customers", getApiOptions());
      const customersList = data.data || [];
      const phoneMap = new Map<string, number>();
      customersList.forEach((c) => {
        if (c.phone) phoneMap.set(c.phone, (phoneMap.get(c.phone) || 0) + 1);
      });
      const dupPhones = Array.from(phoneMap.entries()).filter(([_, count]) => count > 1).map(([phone]) => phone);
      setCustomers(customersList);
      setFilteredCustomers(customersList);
      setDuplicates(dupPhones);
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = customers.filter(
        (c) => c.name.toLowerCase().includes(term) || c.phone.includes(term) || (c.email && c.email.toLowerCase().includes(term))
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalOpen(true);
  };

  const handleViewHistory = (customer: Customer) => {
    setHistoryCustomer(customer);
    setHistoryOpen(true);
  };

  const handleNewOrder = (customer: Customer) => {
    const draft = {
      clienteNombre: customer.name,
      clienteTelefono: customer.phone,
      clienteEmail: customer.email || "",
      dispositivo: "",
      modelo: "",
      falla: "",
      fechaPromesa: "",
      costo: 0,
      notas: "",
      checks: { cargador: false, pantalla: false, prende: false, respaldo: false },
      fotoRecepcion: null,
      fotoPreview: null,
    };
    localStorage.setItem("srf_borrador_orden", JSON.stringify(draft));
    window.location.href = "/dashboard/ordenes";
  };

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    return phone;
  };

  const getCustomerBadge = (customer: Customer) => (duplicates.includes(customer.phone) ? <span className="badge-recibido text-xs">Posible duplicado</span> : null);

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
          <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Clientes</h1>
          <p className="mt-1 text-sm text-srf-muted">
            {filteredCustomers.length} clientes · {duplicates.length} teléfonos duplicados
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => loadCustomers()} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Actualizar
          </Button>
          <Button onClick={() => { setSelectedCustomer(null); setModalOpen(true); }} className="btn-primary gap-2">
            <Plus className="h-4 w-4" /> Nuevo cliente
          </Button>
        </div>
      </div>

      {duplicates.length > 0 ? (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-300">
          <strong>Atención:</strong> Teléfonos repetidos detectados: {duplicates.map((phone) => formatPhone(phone)).join(", ")}
        </div>
      ) : null}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-srf-muted" />
        <Input placeholder="Buscar por nombre, teléfono o email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-srf-primary/30 bg-srf-surface">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-srf-muted">Cliente</th>
              <th className="px-4 py-3 text-left font-semibold text-srf-muted">Contacto</th>
              <th className="px-4 py-3 text-left font-semibold text-srf-muted">Teléfono</th>
              <th className="px-4 py-3 text-left font-semibold text-srf-muted">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-srf-muted">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="border-b border-srf-primary/20 transition-colors hover:bg-srf-surface/50">
                <td className="px-4 py-3">
                  <div>
                    <span className="font-medium">{customer.name}</span>
                    {getCustomerBadge(customer)}
                  </div>
                </td>
                <td className="px-4 py-3 text-srf-muted">{formatPhone(customer.phone)}</td>
                <td className="px-4 py-3">
                  <a href={`https://wa.me/52${customer.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-500 hover:text-green-400">
                    <Phone className="h-3 w-3" /> WhatsApp
                  </a>
                </td>
                <td className="px-4 py-3 text-srf-muted">{customer.email || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(customer)} className="rounded p-1 text-srf-primary hover:bg-srf-primary/20" title="Editar">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleViewHistory(customer)} className="rounded p-1 text-srf-primary hover:bg-srf-primary/20" title="Historial">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleNewOrder(customer)} className="rounded p-1 text-srf-accent hover:bg-srf-accent/20" title="Nueva orden">
                      <Wrench className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCustomers.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-srf-muted">No hay clientes con esos filtros</p>
          </div>
        ) : null}
      </div>

      <CustomerModal open={modalOpen} onOpenChange={setModalOpen} customer={selectedCustomer} onCustomerSaved={() => loadCustomers()} />
      <CustomerHistory open={historyOpen} onOpenChange={setHistoryOpen} customer={historyCustomer} />
    </div>
  );
}

