'use client';

import { useState } from 'react';
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
import type { Product } from '@/types';

interface MovementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onMovementSaved: () => void;
}

export function MovementModal({ open, onOpenChange, product, onMovementSaved }: MovementModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipoMovimiento: 'salida',
    cantidad: 1,
    costoUnitario: 0,
    referencia: '',
    notas: '',
  });

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/inventory/movements', {
        productId: product.id,
        movementType: formData.tipoMovimiento,
        quantity: formData.cantidad,
        unitCost: formData.costoUnitario,
        reference: formData.referencia || null,
        notes: formData.notas || null,
      }, getApiOptions());

      onMovementSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to register movement:', error);
      alert('Error al registrar el movimiento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-srf-surface border-srf-primary/40">
        <DialogHeader>
          <DialogTitle className="text-srf-primary">
            Registrar movimiento - {product.sku}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Tipo de movimiento</Label>
            <select
              value={formData.tipoMovimiento}
              onChange={(e) => setFormData({ ...formData, tipoMovimiento: e.target.value })}
              className="input w-full"
            >
              <option value="entrada">Entrada (recibir mercancía)</option>
              <option value="salida">Salida (consumo/venta)</option>
              <option value="ajuste">Ajuste (inventario físico)</option>
            </select>
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
            <Label>Costo unitario (opcional)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.costoUnitario}
              onChange={(e) => setFormData({ ...formData, costoUnitario: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div>
            <Label>Referencia (folio de orden/comprobante)</Label>
            <Input
              value={formData.referencia}
              onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
              placeholder="Ej: ORD-12345"
            />
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar movimiento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}