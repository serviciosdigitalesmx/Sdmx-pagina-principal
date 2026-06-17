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
import { Plus, Trash2, FileText, Send, ArrowRightCircle, Printer } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { getApiOptions } from '@/lib/tenant';
import type { ServiceRequest } from '@/types';

interface QuoteItem {
  concepto: string;
  cantidad: number;
  precio: number;
}

interface QuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ServiceRequest | null;
  onQuoteConverted: () => void;
}

export function QuoteModal({ open, onOpenChange, request, onQuoteConverted }: QuoteModalProps) {
  const [items, setItems] = useState<QuoteItem[]>([{ concepto: '', cantidad: 1, precio: 0 }]);
  const [notas, setNotas] = useState('');
  const [aplicaIva, setAplicaIva] = useState(false);
  const [anticipo, setAnticipo] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (request && open) {
      // Reset form
      setItems([{ concepto: request.issue_description || 'Diagnóstico y reparación', cantidad: 1, precio: 0 }]);
      setNotas('');
      setAplicaIva(false);
      setAnticipo(0);
    }
  }, [request, open]);

  if (!request) return null;

  const calcularSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
  };

  const subtotal = calcularSubtotal();
  const iva = aplicaIva ? subtotal * 0.16 : 0;
  const total = subtotal + iva;
  const saldo = total - anticipo;

  const addItem = () => {
    setItems([...items, { concepto: '', cantidad: 1, precio: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleConvert = async () => {
    if (items.filter(i => i.concepto.trim()).length === 0) {
      alert('Agrega al menos un concepto');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        cotizacion: {
          items: items.map(item => ({
            concepto: item.concepto,
            cantidad: item.cantidad,
            precio: item.precio,
            total: item.cantidad * item.precio,
          })),
          notas: notas,
          aplicaIva,
          subtotal,
          iva,
          total,
          anticipo,
          saldo,
        },
      };

      await apiClient.post(`/requests/${request.id}/convert`, payload, getApiOptions());
      onQuoteConverted();
      onOpenChange(false);
      alert('Cotización convertida a orden correctamente');
    } catch (error) {
      console.error('Failed to convert quote to order:', error);
      alert('No se pudo convertir la cotización');
    } finally {
      setSaving(false);
    }
  };

  const handleSendWhatsApp = () => {
    const conceptosText = items
      .filter(i => i.concepto.trim())
      .map(i => `- ${i.concepto} (${i.cantidad} x $${i.precio.toFixed(2)})`)
      .join('\n');

    const message = `Hola ${request.customer_name}, te compartimos tu cotización ${request.folio}:\n\n${conceptosText}\n\nSubtotal: $${subtotal.toFixed(2)}\n${aplicaIva ? `IVA (16%): $${iva.toFixed(2)}\n` : ''}Total: $${total.toFixed(2)}\nAnticipo: $${anticipo.toFixed(2)}\nSaldo: $${saldo.toFixed(2)}\n\n${notas ? `Notas: ${notas}\n` : ''}`;

    const phone = request.customer_phone.replace(/\D/g, '');
    if (phone) {
      window.open(`https://wa.me/52${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      alert('El cliente no tiene teléfono válido');
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border border-slate-800 bg-slate-950/95 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-50">
            <FileText className="w-5 h-5" />
            Cotización - {request.folio}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Cliente:</p>
              <p className="font-semibold">{request.customer_name}</p>
            </div>
            <div>
              <p className="text-slate-400">Teléfono:</p>
              <p>{request.customer_phone}</p>
            </div>
            <div>
              <p className="text-slate-400">Equipo:</p>
              <p>{request.device_type} {request.device_model}</p>
            </div>
            <div>
              <p className="text-slate-400">Urgencia:</p>
              <p>{request.urgency}</p>
            </div>
          </div>

          {/* Quote items */}
          <div className="rounded-lg border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sky-300">Conceptos de cotización</h3>
              <Button onClick={addItem} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex flex-wrap gap-2 items-center">
                  <Input
                    value={item.concepto}
                    onChange={(e) => updateItem(index, 'concepto', e.target.value)}
                    placeholder="Concepto"
                    className="flex-1 min-w-[150px]"
                  />
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={item.cantidad}
                    onChange={(e) => updateItem(index, 'cantidad', parseInt(e.target.value) || 1)}
                    className="w-20 text-center"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.precio}
                    onChange={(e) => updateItem(index, 'precio', parseFloat(e.target.value) || 0)}
                    className="w-28 text-right"
                  />
                  <span className="text-sm w-20 text-right">
                    ${(item.cantidad * item.precio).toFixed(2)}
                  </span>
                  <Button
                    onClick={() => removeItem(index)}
                    variant="ghost"
                    size="sm"
                    disabled={items.length === 1}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes and totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Notas de cotización</Label>
              <Textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={4}
                placeholder="Garantía, tiempos de entrega, condiciones..."
              />
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 space-y-2">
              <label className="flex items-center justify-between">
                <span className="text-slate-400">Aplicar IVA (16%)</span>
                <input
                  type="checkbox"
                  checked={aplicaIva}
                  onChange={(e) => setAplicaIva(e.target.checked)}
                  className="accent-sky-400"
                />
              </label>
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{aplicaIva ? 'IVA (16%)' : 'IVA'}</span>
                <span>${iva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-50">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400">Anticipo</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={anticipo}
                  onChange={(e) => setAnticipo(parseFloat(e.target.value) || 0)}
                  className="w-28 text-right"
                />
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-slate-400">Saldo</span>
                <span className={saldo > 0 ? 'text-sky-300' : 'text-emerald-400'}>
                  ${saldo.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-800 pt-4">
            <Button onClick={handlePrintPDF} variant="outline" className="gap-2">
              <Printer className="w-4 h-4" />
              Generar PDF
            </Button>
            <Button onClick={handleSendWhatsApp} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Send className="w-4 h-4" />
              Enviar por WhatsApp
            </Button>
            <Button onClick={handleConvert} disabled={saving} className="gap-2 bg-sky-500 hover:bg-sky-600">
              <ArrowRightCircle className="w-4 h-4" />
              {saving ? 'Convirtiendo...' : 'Convertir a orden'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
