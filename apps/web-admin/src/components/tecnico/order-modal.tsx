'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  Phone,
  Mail,
  DollarSign,
  Wrench,
  FileText,
  Camera,
  CheckSquare,
  History,
  Save,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { getApiOptions } from '@/lib/tenant';
import type { Order, OrderChecklist, OrderDocument, OrderEvent } from '@/types';
import Image from 'next/image';

interface OrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onOrderUpdated: () => void;
}

export function OrderModal({ open, onOpenChange, order, onOrderUpdated }: OrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checklist, setChecklist] = useState<OrderChecklist | null>(null);
  const [documents, setDocuments] = useState<OrderDocument[]>([]);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [activeTab, setActiveTab] = useState('details');

  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [dispositivo, setDispositivo] = useState('');
  const [modelo, setModelo] = useState('');
  const [falla, setFalla] = useState('');
  const [costo, setCosto] = useState('');
  const [fechaPromesa, setFechaPromesa] = useState('');
  const [estado, setEstado] = useState('');
  const [tecnico, setTecnico] = useState('');
  const [notas, setNotas] = useState('');
  const [seguimiento, setSeguimiento] = useState('');
  const [youtubeId, setYoutubeId] = useState('');

  // Checklist
  const [hasCharger, setHasCharger] = useState(false);
  const [screenCondition, setScreenCondition] = useState('');
  const [powersOn, setPowersOn] = useState(false);
  const [backupRequired, setBackupRequired] = useState(false);
  const [checklistNotes, setChecklistNotes] = useState('');

  useEffect(() => {
    if (order && open) {
      loadOrderDetails();
    }
  }, [order, open]);

  const loadOrderDetails = async () => {
    if (!order) return;
    setLoading(true);
    try {
      const data = await apiClient.get<{
        order: Order;
        checklist: OrderChecklist | null;
        documents: OrderDocument[];
        events: OrderEvent[];
      }>(`/orders/${order.id}`, getApiOptions());

      const orderData = data.order;
      setEstado(orderData.status || 'recibido');
      setTecnico(orderData.assigned_user_id || '');
      setNotas(orderData.internal_notes || '');
      
      // CRM priority fallback to device_info
      setCustomerName(orderData.customers?.name || orderData.device_info?.customer_name || '');
      setCustomerPhone(orderData.customers?.phone || orderData.device_info?.customer_phone || '');
      setCustomerEmail(orderData.customers?.email || orderData.device_info?.customer_email || '');
      setDispositivo(orderData.device_info?.type || '');
      setModelo(orderData.device_info?.model || '');

      setSeguimiento(((orderData.evidence_metadata?.find((e: { event_type: string; note?: string }) => e.event_type === 'note'))?.note) || '');
      setYoutubeId((orderData.metadata as { youtube_id?: string })?.youtube_id || '');

      if (data.checklist) {
        setChecklist(data.checklist);
        setHasCharger(data.checklist.has_charger);
        setScreenCondition(data.checklist.screen_condition || '');
        setPowersOn(data.checklist.powers_on);
        setBackupRequired(data.checklist.backup_required);
        setChecklistNotes(data.checklist.notes || '');
      }

      setDocuments(data.documents || []);
      setEvents(data.events || []);
    } catch (error) {
      console.error('Failed to load order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!order) return;
    setSaving(true);
    try {
      // Update order details
      await apiClient.patch(`/orders/${order.id}/details`, {
        clientName: customerName,
        clientPhone: customerPhone,
        clientEmail: customerEmail,
        deviceType: dispositivo,
        deviceModel: modelo,
        issue: falla,
        promisedDate: fechaPromesa,
        metadata: { youtube_id: youtubeId },
      }, getApiOptions());

      // Update financials if cost changed
      const costValue = parseFloat(costo);
      if (!isNaN(costValue) && costValue !== order.estimated_cost) {
        await apiClient.patch(`/orders/${order.id}/financials`, {
          estimatedCost: costValue,
        }, getApiOptions());
      }

      // Update status if changed
      if (estado !== order.status) {
        await apiClient.patch(`/orders/${order.id}/status`, {
          status: estado,
          note: `Estado cambiado a ${estado}`,
        }, getApiOptions());
      }

      // Update checklist
      await apiClient.put(`/orders/${order.id}/checklist`, {
        hasCharger,
        screenCondition,
        powersOn,
        backupRequired,
        notes: checklistNotes,
      }, getApiOptions());

      // Update internal notes and customer tracking
      await apiClient.patch(`/orders/${order.id}/details`, {
        metadata: {
          ...order.metadata,
          internal_notes: notas,
          customer_tracking: seguimiento,
        },
      }, getApiOptions());

      onOrderUpdated();
      loadOrderDetails();
    } catch (error) {
      console.error('Failed to save order:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeliver = async () => {
    if (!order) return;
    if (!confirm('¿Marcar esta orden como entregada? Esta acción no se puede deshacer.')) return;

    setSaving(true);
    try {
      await apiClient.patch(`/orders/${order.id}/status`, {
        status: 'entregado',
        note: 'Equipo entregado al cliente',
      }, getApiOptions());
      onOrderUpdated();
      loadOrderDetails();
    } catch (error) {
      console.error('Failed to deliver order:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-srf-surface border-srf-primary/40">
        <DialogHeader>
          <DialogTitle className="text-srf-primary flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Orden {order.folio}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-srf-primary" />
          </div>
        ) : (
          <>
            <div className="mt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-srf-bg border border-srf-primary/30">
                <TabsTrigger value="details" className="data-[state=active]:bg-srf-accent/20">
                  Detalles
                </TabsTrigger>
                <TabsTrigger value="checklist" className="data-[state=active]:bg-srf-accent/20">
                  Checklist
                </TabsTrigger>
                <TabsTrigger value="photos" className="data-[state=active]:bg-srf-accent/20">
                  Fotos
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-srf-accent/20">
                  Historial
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Cliente</Label>
                    <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Teléfono</Label>
                    <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label>Dispositivo</Label>
                    <Input value={dispositivo} onChange={(e) => setDispositivo(e.target.value)} />
                  </div>
                  <div>
                    <Label>Modelo</Label>
                    <Input value={modelo} onChange={(e) => setModelo(e.target.value)} />
                  </div>
                  <div>
                    <Label>Costo estimado</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={costo}
                      onChange={(e) => setCosto(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Fecha promesa</Label>
                    <Input type="date" value={fechaPromesa} onChange={(e) => setFechaPromesa(e.target.value)} />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <select
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      className="input w-full"
                    >
                      <option value="recibido">Recibido</option>
                      <option value="diagnostico">Diagnóstico</option>
                      <option value="reparacion">Reparación</option>
                      <option value="listo">Listo</option>
                      <option value="entregado">Entregado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                  <div>
                    <Label>Técnico asignado</Label>
                    <Input value={tecnico} onChange={(e) => setTecnico(e.target.value)} />
                  </div>
                  <div>
                    <Label>YouTube ID (Live Cam)</Label>
                    <Input value={youtubeId} onChange={(e) => setYoutubeId(e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label>Falla reportada</Label>
                  <Textarea value={falla} onChange={(e) => setFalla(e.target.value)} rows={3} />
                </div>

                <div>
                  <Label>Notas internas</Label>
                  <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} />
                </div>

                <div>
                  <Label>Seguimiento para el cliente</Label>
                  <Textarea value={seguimiento} onChange={(e) => setSeguimiento(e.target.value)} rows={2} />
                </div>
              </TabsContent>

              <TabsContent value="checklist" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hasCharger}
                      onChange={(e) => setHasCharger(e.target.checked)}
                      className="w-4 h-4 accent-srf-accent"
                    />
                    <span>Trae cargador</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={powersOn}
                      onChange={(e) => setPowersOn(e.target.checked)}
                      className="w-4 h-4 accent-srf-accent"
                    />
                    <span>Equipo prende</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={backupRequired}
                      onChange={(e) => setBackupRequired(e.target.checked)}
                      className="w-4 h-4 accent-srf-accent"
                    />
                    <span>Requiere respaldo de datos</span>
                  </label>
                </div>

                <div>
                  <Label>Condición de pantalla</Label>
                  <Input
                    value={screenCondition}
                    onChange={(e) => setScreenCondition(e.target.value)}
                    placeholder="Ej: Rayada, rota, OK"
                  />
                </div>

                <div>
                  <Label>Notas del checklist</Label>
                  <Textarea value={checklistNotes} onChange={(e) => setChecklistNotes(e.target.value)} rows={3} />
                </div>
              </TabsContent>

              <TabsContent value="photos" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {documents
                    .filter((doc) => doc.file_type === 'intake_photo')
                    .map((doc) => (
                      <div key={doc.id} className="relative aspect-square rounded-lg overflow-hidden border border-srf-primary/30">
                        {doc.public_url && (
                          <Image
                            src={doc.public_url}
                            alt={doc.file_name || "Document"}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                    ))}
                </div>

                {documents.filter((doc) => doc.file_type === 'intake_photo').length === 0 && (
                  <p className="text-center text-srf-muted py-4">No hay fotos de recepción</p>
                )}

                <div className="border-t border-srf-primary/20 pt-4">
                  <Label>Subir nueva foto</Label>
                  <input
                    type="file"
                    accept="image/*"
                    className="input w-full mt-2"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !order) return;

                      const formData = new FormData();
                      formData.append('file', file);

                      try {
                        await apiClient.upload(`/orders/${order.id}/attachments`, file, {
                          fileType: 'intake_photo',
                        }, getApiOptions());
                        loadOrderDetails();
                      } catch (error) {
                        console.error('Failed to upload photo:', error);
                      }
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4 mt-4">
                <div className="space-y-2">
                  {events.map((event) => (
                    <div key={event.id} className="p-3 rounded-lg bg-srf-bg/50 border border-srf-primary/20">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-srf-primary">{event.event_type}</span>
                        <span className="text-xs text-srf-muted">
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>
                      {event.previous_status && event.new_status && (
                        <p className="text-xs mt-1">
                          Cambió de <span className="text-yellow-500">{event.previous_status}</span> a{' '}
                          <span className="text-green-500">{event.new_status}</span>
                        </p>
                      )}
                      {event.note && <p className="text-sm mt-1">{event.note}</p>}
                      {event.actor_name && (
                        <p className="text-xs text-srf-muted mt-1">Por: {event.actor_name}</p>
                      )}
                    </div>
                  ))}
                </div>

                {events.length === 0 && (
                  <p className="text-center text-srf-muted py-4">Sin historial de eventos</p>
                )}
              </TabsContent>
              </Tabs>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-srf-primary/20">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              {estado !== 'entregado' && (
                <Button onClick={handleDeliver} disabled={saving} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Entregar
                </Button>
              )}
              <Button onClick={handleSave} disabled={saving} className="bg-srf-accent hover:bg-srf-accent/80">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
