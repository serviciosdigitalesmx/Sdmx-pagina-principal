'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, Edit2, Eye, Trash2, Phone, MessageSquare, Wrench } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { getApiOptions } from '@/lib/tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomerModal } from '@/components/clientes/customer-modal';
import { CustomerHistory } from '@/components/clientes/customer-history';
import type { Customer } from '@/types';

export default function ClientesPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [duplicates, setDuplicates] = useState<string[]>([]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ data: Customer[] }>('/customers', getApiOptions());
      const customersList = data.data || [];

      // Detectar teléfonos duplicados
      const phoneMap = new Map<string, number>();
      customersList.forEach((c) => {
        if (c.phone) {
          phoneMap.set(c.phone, (phoneMap.get(c.phone) || 0) + 1);
        }
      });
      const dupPhones = Array.from(phoneMap.entries())
        .filter(([_, count]) => count > 1)
        .map(([phone]) => phone);

      setCustomers(customersList);
      setFilteredCustomers(customersList);
      setDuplicates(dupPhones);
    } catch (error) {
      console.error('Failed to load customers:', error);
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
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.phone.includes(term) ||
          (c.email && c.email.toLowerCase().includes(term))
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

  const handleViewHistory = async (customer: Customer) => {
    setHistoryCustomer(customer);
    setHistoryOpen(true);
  };

  const handleNewOrder = (customer: Customer) => {
    // Guardar en localStorage y redirigir a recepción
    const draft = {
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email || '',
      equipoTipo: '',
      equipoModelo: '',
      equipoFalla: '',
      fechaPromesa: '',
      costo: 0,
      notasExtra: '',
      checks: { cargador: false, pantalla: false, prende: false, respaldo: false },
      fotoAdjunta: false,
    };
    localStorage.setItem('srf_borrador_orden', JSON.stringify(draft));
    window.location.href = '/dashboard/operativo';
  };

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  const getCustomerBadge = (customer: Customer) => {
    if (duplicates.includes(customer.phone)) {
      return <span className="badge-recibido text-xs">Posible duplicado</span>;
    }
    return null;
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
          <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Clientes</h1>
          <p className="text-srf-muted text-sm mt-1">
            {filteredCustomers.length} clientes · {duplicates.length} teléfonos duplicados
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => loadCustomers()}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
          <Button
            onClick={() => {
              setSelectedCustomer(null);
              setModalOpen(true);
            }}
            className="btn-primary gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo cliente
          </Button>
        </div>
      </div>

      {/* Duplicates alert */}
      {duplicates.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-300">
          <strong>Atención:</strong> Teléfonos repetidos detectados:{' '}
          {duplicates.map((phone) => formatPhone(phone)).join(', ')}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-srf-muted" />
        <Input
          placeholder="Buscar por nombre, teléfono o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Customers table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-srf-surface border-b border-srf-primary/30">
            <tr>
              <th className="text-left py-3 px-4 text-srf-muted font-semibold">Cliente</th>
              <th className="text-left py-3 px-4 text-srf-muted font-semibold">Contacto</th>
              <th className="text-left py-3 px-4 text-srf-muted font-semibold">Teléfono</th>
              <th className="text-left py-3 px-4 text-srf-muted font-semibold">Email</th>
              <th className="text-left py-3 px-4 text-srf-muted font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr
                key={customer.id}
                className="border-b border-srf-primary/20 hover:bg-srf-surface/50 transition-colors"
              >
                <td className="py-3 px-4">
                  <div>
                    <span className="font-medium">{customer.name}</span>
                    {getCustomerBadge(customer)}
                  </div>
                </td>
                <td className="py-3 px-4 text-srf-muted">
                  {formatPhone(customer.phone)}
                </td>
                <td className="py-3 px-4">
                  <a
                    href={`https://wa.me/52${customer.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 hover:text-green-400 flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    WhatsApp
                  </a>
                </td>
                <td className="py-3 px-4 text-srf-muted">
                  {customer.email || '—'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(customer)}
                      className="p-1 rounded hover:bg-srf-primary/20 text-srf-primary"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleViewHistory(customer)}
                      className="p-1 rounded hover:bg-srf-primary/20 text-srf-primary"
                      title="Historial"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleNewOrder(customer)}
                      className="p-1 rounded hover:bg-srf-accent/20 text-srf-accent"
                      title="Nueva orden"
                    >
                      <Wrench className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-srf-muted">No hay clientes con esos filtros</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <CustomerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        customer={selectedCustomer}
        onCustomerSaved={() => loadCustomers()}
      />

      <CustomerHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        customer={historyCustomer}
      />
    </div>
  );
}