'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { getApiOptions } from '@/lib/tenant';
import type { Sucursal, Product } from '@/types';

interface TransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sucursales: Sucursal[];
  onTransferComplete: () => void;
}

export function TransferModal({ open, onOpenChange, sucursales, onTransferComplete }: TransferModalProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    sku: '',
    sucursalOrigen: '',
    sucursalDestino: '',
    cantidad: 1,
    motivo: '',
    notas: '',
  });

  const loadProducts = async () => {
    try {
      const data = await apiClient.get<{ data: Product[] }>('/inventory', getApiOptions());
      setProducts(data.data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  useEffect(() => {
    if (open) {
      loadProducts();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku || !formData.sucursalOrigen || !formData.sucursalDestino) {
      alert('SKU, sucursal origen y destino son requeridos');
      return;
    }
    if (formData.sucursalOrigen === formData.sucursalDestino) {
      alert('La sucursal origen y destino deben ser diferentes');
      return;
    }
    if (formData.cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/inventory/transfer', {
        sku: formData.sku,
        sucursalOrigen: formData.sucursalOrigen,
        sucursalDestino: formData.sucursalDestino,
        cantidad: formData.cantidad,
        motivo: formData.motivo || null,
        notas: formData.notas || null,
      }, getApiOptions());

      onTransferComplete();
      onOpenChange(false);
      setFormData({
        sku: '',
        sucursalOrigen: '',
        sucursalDestino: '',
        cantidad: 1,
        motivo: '',
        notas: '',
      });
    } catch (error) {
      console.error('Failed to transfer stock:', error);
      alert('Error al transferir el stock');
    } finally {
      setLoading(false);
    }
  };

  const activeSucursales = sucursales.filter((s) => s.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border border-slate-800 bg-slate-950/95">
        <DialogHeader>
          <DialogTitle className="text-slate-100">
            Transferir stock entre sucursales
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Producto (SKU)</Label>
            <select
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            className="input w-full"
              required
            >
              <option value="">Selecciona un producto</option>
              {products.map((p) => (
                <option key={p.id} value={p.sku}>
                  {p.sku} - {p.name} (Stock: {p.stock_current || 0})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Sucursal origen</Label>
              <select
                value={formData.sucursalOrigen}
                onChange={(e) => setFormData({ ...formData, sucursalOrigen: e.target.value })}
                className="input w-full"
                required
              >
                <option value="">Selecciona</option>
                {activeSucursales.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Sucursal destino</Label>
              <select
                value={formData.sucursalDestino}
                onChange={(e) => setFormData({ ...formData, sucursalDestino: e.target.value })}
                className="input w-full"
                required
              >
                <option value="">Selecciona</option>
                {activeSucursales.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Cantidad</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={formData.cantidad}
              onChange={(e) => setFormData({ ...formData, cantidad: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div>
            <Label>Motivo</Label>
            <Input
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              placeholder="Ej: Reabastecimiento"
            />
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Transfiriendo...' : 'Transferir'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
