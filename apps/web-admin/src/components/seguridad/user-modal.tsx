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
import { getApiOptions, getActiveSucursalId } from '@/lib/tenant';
import type { SecurityUser } from '@/types';

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SecurityUser | null;
  onUserSaved: () => void;
}

export function UserModal({ open, onOpenChange, user, onUserSaved }: UserModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'technician',
    password: '',
    notas: '',
    activo: true,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '',
        notas: '',
        activo: user.activo,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'technician',
        password: '',
        notas: '',
        activo: true,
      });
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Nombre y email son requeridos');
      return;
    }
    if (!user && !formData.password.trim()) {
      alert('La contraseña es requerida para nuevos usuarios');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        password: formData.password || undefined,
        notas: formData.notas || null,
        activo: formData.activo,
        sucursalId: getActiveSucursalId(),
      };

      if (user) {
        await apiClient.put(`/users/${user.id}`, payload, getApiOptions());
      } else {
        await apiClient.post('/users/invite', payload, getApiOptions());
      }
      onUserSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Error al guardar el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border border-slate-800 bg-slate-950/95">
        <DialogHeader>
          <DialogTitle className="text-slate-100">
            {user ? 'Editar usuario' : 'Nuevo usuario'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre completo"
              required
            />
          </div>

          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>

          <div>
            <Label>Rol</Label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input w-full"
            >
              <option value="owner">Dueño</option>
              <option value="manager">Gerente</option>
              <option value="technician">Técnico</option>
            </select>
          </div>

          <div>
            <Label>{user ? 'Nueva contraseña (opcional)' : 'Contraseña *'}</Label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={user ? 'Dejar vacío para mantener' : '********'}
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

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              className="accent-sky-400"
            />
            <span className="text-sm">Usuario activo</span>
          </label>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
