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
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { getApiOptions } from '@/lib/tenant';
import type { Sucursal } from '@/types';

interface SucursalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sucursal: Sucursal | null;
  onSucursalSaved: () => void;
}

export function SucursalModal({ open, onOpenChange, sucursal, onSucursalSaved }: SucursalModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    is_active: true,
  });

  useEffect(() => {
    if (sucursal) {
      setFormData({
        name: sucursal.name,
        code: sucursal.code || '',
        address: sucursal.address || '',
        city: sucursal.city || '',
        state: sucursal.state || '',
        phone: sucursal.phone || '',
        email: ('email' in sucursal ? (sucursal as Sucursal & { email?: string | null }).email : '') || '',
        is_active: sucursal.is_active,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        address: '',
        city: '',
        state: '',
        phone: '',
        email: '',
        is_active: true,
      });
    }
  }, [sucursal, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('El nombre es requerido');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        code: formData.code || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        phone: formData.phone || null,
        email: formData.email || null,
        is_active: formData.is_active,
      };

      if (sucursal) {
        await apiClient.put(`/sucursales/${sucursal.id}`, payload, getApiOptions());
      } else {
        await apiClient.post('/sucursales', payload, getApiOptions());
      }
      onSucursalSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save sucursal:', error);
      alert('Error al guardar la sucursal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-srf-surface border-srf-primary/40">
        <DialogHeader>
          <DialogTitle className="text-srf-primary">
            {sucursal ? 'Editar sucursal' : 'Nueva sucursal'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Sucursal Centro"
              required
            />
          </div>

          <div>
            <Label>Código</Label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="Ej: SUC-001"
              className="uppercase"
            />
          </div>

          <div>
            <Label>Dirección</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Calle, número, colonia"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ciudad</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Teléfono</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="81 1234 5678"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="accent-srf-accent"
            />
            <span className="text-sm">Sucursal activa</span>
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
