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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<OrderChecklist | null>(null);
  const [documents, setDocuments] = useState<OrderDocument[]>([]);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [activeTab, setActiveTab] = useState('details');

  // Form fields
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [dispositivo, setDispositivo] = useState('');
  const [modelo, setModelo] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
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
  const [cosmeticCondition, setCosmeticCondition] = useState('');
  const [reportedPhysicalDamage, setReportedPhysicalDamage] = useState('');
  const [accessoriesReceived, setAccessoriesReceived] = useState('');
  const [customerAcceptanceRequired, setCustomerAcceptanceRequired] = useState(false);
  const [acceptedAt, setAcceptedAt] = useState('');
  const [acceptedByName, setAcceptedByName] = useState('');

  useEffect(() => {
    if (order && open) {
      loadOrderDetails();
    }
  }, [order, open]);

  const loadOrderDetails = async () => {
    if (!order) return;
    setLoading(true);
    setLoadError(null);
    try {
      const response = await apiClient.get<{
        success?: boolean;
        data?: {
          order?: Order;
          checklist: OrderChecklist | null;
          documents: OrderDocument[];
          events: OrderEvent[];
        };
      }>(`/orders/${order.id}`, getApiOptions());

      const payload = response.data ?? null;
      const orderData = payload?.order ?? null;
      if (!orderData) {
        throw new Error('La API no devolvió los datos de la orden');
      }
      setEstado(orderData.status || 'recibido');
      setTecnico(orderData.assigned_user_id || '');
      setNotas(orderData.internal_notes || '');
      
      // CRM priority fallback to device_info
      setClienteNombre(orderData.customers?.name || orderData.device_info?.customer_name || '');
      setClienteTelefono(orderData.customers?.phone || orderData.device_info?.customer_phone || '');
      setClienteEmail(orderData.customers?.email || orderData.device_info?.customer_email || '');
      setDispositivo((orderData as { device_type?: string }).device_type || orderData.device_info?.type || '');
      setModelo((orderData as { device_model?: string }).device_model || orderData.device_info?.model || '');
      setSerialNumber(orderData.serial_number || orderData.device_info?.serial_number || '');
      setFalla(orderData.problem_description || '');
      setCosto(String(orderData.estimated_cost ?? orderData.final_cost ?? ''));
      setFechaPromesa(orderData.promised_date ? String(orderData.promised_date).slice(0, 10) : '');

      setSeguimiento(((orderData.evidence_metadata?.find((e: any) => e.event_type === 'note') as { note?: string } | undefined)?.note) || '');
      setYoutubeId((orderData.metadata as any)?.youtube_id || '');

      if (payload?.checklist) {
        setChecklist(payload.checklist);
        setHasCharger(payload.checklist.has_charger);
        setScreenCondition(payload.checklist.screen_condition || '');
        setPowersOn(payload.checklist.powers_on);
        setBackupRequired(payload.checklist.backup_required);
        setChecklistNotes(payload.checklist.notes || '');
        setCosmeticCondition(payload.checklist.cosmetic_condition || '');
        setReportedPhysicalDamage(payload.checklist.reported_physical_damage || '');
        setAccessoriesReceived(payload.checklist.accessories_received || '');
        setCustomerAcceptanceRequired(payload.checklist.customer_acceptance_required || false);
        setAcceptedAt(payload.checklist.accepted_at ? String(payload.checklist.accepted_at).slice(0, 10) : '');
        setAcceptedByName(payload.checklist.accepted_by_name || '');
      }

      setDocuments(payload?.documents || []);
      setEvents(payload?.events || []);
    } catch (error) {
      console.error('Failed to load order details:', error);
      setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los detalles de la orden');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!order) return;
    setSaving(true);
    setSaveError(null);
    try {
      // Update order details
      await apiClient.patch(`/orders/${order.id}/details`, {
        clientName: clienteNombre,
        clientPhone: clienteTelefono,
        clientEmail: clienteEmail,
        deviceType: dispositivo,
        deviceModel: modelo,
        serialNumber,
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
        cosmeticCondition,
        reportedPhysicalDamage,
        accessoriesReceived,
        customerAcceptanceRequired,
        acceptedAt: acceptedAt ? new Date(acceptedAt).toISOString() : '',
        acceptedByName,
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
      setSaveError(error instanceof Error ? error.message : 'No se pudo guardar la orden');
    } finally {
      setSaving(false);
    }
  };

  const handleDeliver = async () => {
    if (!order) return;
    if (!confirm('¿Marcar esta orden como entregada? Esta acción no se puede deshacer.')) return;

    setSaving(true);
    setSaveError(null);
    try {
      await apiClient.patch(`/orders/${order.id}/status`, {
        status: 'entregado',
        note: 'Equipo entregado al cliente',
      }, getApiOptions());
      onOrderUpdated();
      loadOrderDetails();
    } catch (error) {
      console.error('Failed to deliver order:', error);
      setSaveError(error instanceof Error ? error.message : 'No se pudo entregar la orden');
    } finally {
      setSaving(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border border-slate-800 bg-slate-950/95">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-100">
            <FileText className="w-5 h-5" />
            Orden {order.folio}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
          </div>
        ) : (
          <>
            {loadError ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-100">
                <p className="font-semibold">No se pudieron cargar los detalles</p>
                <p className="mt-1 text-rose-100/80">{loadError}</p>
                <Button variant="outline" size="sm" onClick={() => void loadOrderDetails()} className="mt-3 gap-2">
                  Reintentar
                </Button>
              </div>
            ) : null}
            {saveError ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-100">
                {saveError}
              </div>
            ) : null}
            <div className="mt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="border border-slate-800 bg-slate-900/70">
                <TabsTrigger value="details" className="data-[state=active]:bg-sky-500/15">
                  Detalles
                </TabsTrigger>
                <TabsTrigger value="checklist" className="data-[state=active]:bg-sky-500/15">
                  Checklist
                </TabsTrigger>
                <TabsTrigger value="photos" className="data-[state=active]:bg-sky-500/15">
                  Fotos
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-sky-500/15">
                  Historial
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Cliente</Label>
                    <Input value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} />
                  </div>
                  <div>
                    <Label>Teléfono</Label>
                    <Input value={clienteTelefono} onChange={(e) => setClienteTelefono(e.target.value)} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={clienteEmail} onChange={(e) => setClienteEmail(e.target.value)} />
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
                    <Label>Serie / IMEI</Label>
                    <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
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
                      className="w-4 h-4 accent-sky-400"
                    />
                    <span>Trae cargador</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={powersOn}
                      onChange={(e) => setPowersOn(e.target.checked)}
                      className="w-4 h-4 accent-sky-400"
                    />
                    <span>Equipo prende</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={backupRequired}
                      onChange={(e) => setBackupRequired(e.target.checked)}
                      className="w-4 h-4 accent-sky-400"
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

                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-slate-300">Checklist legal de recepción</h4>
                  <div className="grid gap-4">
                    <div>
                      <Label>Condición cosmética</Label>
                      <Textarea
                        value={cosmeticCondition}
                        onChange={(e) => setCosmeticCondition(e.target.value)}
                        placeholder="Rayones, golpes, humedad visible, pantalla, carcasa"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Daño físico reportado</Label>
                      <Textarea
                        value={reportedPhysicalDamage}
                        onChange={(e) => setReportedPhysicalDamage(e.target.value)}
                        placeholder="Ej: golpe en esquina, pantalla rota, equipo mojado"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Accesorios recibidos</Label>
                      <Textarea
                        value={accessoriesReceived}
                        onChange={(e) => setAccessoriesReceived(e.target.value)}
                        placeholder="Ej: cargador, funda, SIM, memoria, caja"
                        rows={2}
                      />
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={customerAcceptanceRequired}
                        onChange={(e) => setCustomerAcceptanceRequired(e.target.checked)}
                        className="w-4 h-4 accent-sky-400"
                      />
                      <span>Requiere aceptación del cliente</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Fecha de aceptación</Label>
                        <Input type="date" value={acceptedAt} onChange={(e) => setAcceptedAt(e.target.value)} />
                      </div>
                      <div>
                        <Label>Nombre de quien acepta</Label>
                        <Input
                          value={acceptedByName}
                          onChange={(e) => setAcceptedByName(e.target.value)}
                          placeholder="Nombre completo"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="photos" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {documents
                    .filter((doc) => doc.file_type === 'intake_photo')
                    .map((doc) => (
                      <div key={doc.id} className="relative aspect-square overflow-hidden rounded-lg border border-slate-700">
                        {doc.public_url && (
                          <img
                            src={doc.public_url}
                            alt={doc.file_name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                </div>

                {documents.filter((doc) => doc.file_type === 'intake_photo').length === 0 && (
                  <p className="py-4 text-center text-slate-400">No hay fotos de recepción</p>
                )}

                <div className="border-t border-slate-800 pt-4">
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
                    <div key={event.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-sky-300">{event.event_type}</span>
                        <span className="text-xs text-slate-400">
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
                        <p className="mt-1 text-xs text-slate-400">Por: {event.actor_name}</p>
                      )}
                    </div>
                  ))}
                </div>

                {events.length === 0 && (
                  <p className="py-4 text-center text-slate-400">Sin historial de eventos</p>
                )}
              </TabsContent>
              </Tabs>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              {estado !== 'entregado' && (
                <Button onClick={handleDeliver} disabled={saving} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Entregar
                </Button>
              )}
              <Button onClick={handleSave} disabled={saving}>
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
