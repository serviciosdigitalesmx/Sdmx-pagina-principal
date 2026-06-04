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
import type { Product } from '@/types';

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onProductSaved: () => void;
}

export function ProductModal({ open, onOpenChange, product, onProductSaved }: ProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    brand: '',
    cost: 0,
    sale_price: 0,
    stock_current: 0,
    minimum_stock: 5,
    unit: '',
    location: '',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku,
        name: product.name,
        category: product.category || '',
        brand: product.brand || '',
        cost: product.cost || 0,
        sale_price: product.sale_price || 0,
        stock_current: product.stock_current || 0,
        minimum_stock: product.minimum_stock || 5,
        unit: product.unit || '',
        location: product.location || '',
        notes: product.notes || '',
        is_active: product.is_active,
      });
    } else {
      setFormData({
        sku: '',
        name: '',
        category: '',
        brand: '',
        cost: 0,
        sale_price: 0,
        stock_current: 0,
        minimum_stock: 5,
        unit: '',
        location: '',
        notes: '',
        is_active: true,
      });
    }
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku.trim() || !formData.name.trim()) {
      alert('SKU y nombre son requeridos');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        sku: formData.sku.toUpperCase(),
        name: formData.name,
        category: formData.category || null,
        brand: formData.brand || null,
        cost: formData.cost,
        sale_price: formData.sale_price,
        stock_current: formData.stock_current,
        minimum_stock: formData.minimum_stock,
        unit: formData.unit || null,
        location: formData.location || null,
        notes: formData.notes || null,
        is_active: formData.is_active,
      };

      if (product) {
        await apiClient.put(`/inventory/${product.id}`, payload, getApiOptions());
      } else {
        await apiClient.post('/inventory', payload, getApiOptions());
      }
      onProductSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-srf-surface border-srf-primary/40">
        <DialogHeader>
          <DialogTitle className="text-srf-primary">
            {product ? 'Editar producto' : 'Nuevo producto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>SKU *</Label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="Ej: BAT-IPHONE-12"
                className="uppercase"
                required
              />
            </div>
            <div>
              <Label>Nombre *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del producto"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoría</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ej: Baterías, Pantallas"
              />
            </div>
            <div>
              <Label>Marca</Label>
              <Input
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Ej: Apple, Samsung"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Costo ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Precio venta ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Stock actual</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.stock_current}
                onChange={(e) => setFormData({ ...formData, stock_current: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Stock mínimo</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.minimum_stock}
                onChange={(e) => setFormData({ ...formData, minimum_stock: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Unidad</Label>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="Ej: pieza, kg, metro"
              />
            </div>
            <div>
              <Label>Ubicación</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ej: Estante A, Caja 3"
              />
            </div>
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="accent-srf-accent"
            />
            <span className="text-sm">Producto activo</span>
          </label>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}