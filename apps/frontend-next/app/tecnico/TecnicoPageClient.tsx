'use client';
import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { uploadImage } from '@/lib/storage';

export default function TecnicoPageClient() {
  const [equipos, setEquipos] = useState([]);
  const [filtros, setFiltros] = useState({ estado: 'todos', tecnico: '', busqueda: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [nuevasFotos, setNuevasFotos] = useState<File[]>([]);
  const { get, put } = useApi();

  const cargarEquipos = async () => {
    const data = await get('/api/equipos', filtros);
    setEquipos(data);
  };
  useEffect(() => { cargarEquipos(); }, [filtros]);

  const abrirModal = async (id: string) => {
    const equipo = await get(`/api/equipos/${id}`);
    setSelected(equipo);
    setModalOpen(true);
  };
  const guardarCambio = async (campo: string, valor: any) => {
    if (!selected) return;
    await put(`/api/equipos/${selected.id}`, { [campo]: valor });
    setSelected({ ...selected, [campo]: valor });
    cargarEquipos();
  };
  const subirFotos = async () => {
    if (!selected || nuevasFotos.length === 0) return;
    for (const foto of nuevasFotos) {
      const url = await uploadImage(foto, `seguimiento/${selected.id}`);
      await put(`/api/equipos/${selected.id}`, { fotos_seguimiento: [url] });
    }
    setNuevasFotos([]);
    cargarEquipos();
    abrirModal(selected.id);
  };
  const getColor = (fechaPromesa: string) => {
    const dias = (new Date(fechaPromesa).getTime() - new Date().getTime()) / (1000*3600*24);
    if (dias <= 2) return 'border-red-500 bg-red-500/10';
    if (dias <= 4) return 'border-yellow-500 bg-yellow-500/10';
    return 'border-green-500 bg-green-500/10';
  };

  return (
    <div className="p-4">
      <div className="flex gap-4 mb-6 flex-wrap">
        <input type="text" placeholder="Buscar folio, cliente..." className="input flex-1" value={filtros.busqueda} onChange={e => setFiltros({...filtros, busqueda: e.target.value})} />
        <select value={filtros.estado} onChange={e => setFiltros({...filtros, estado: e.target.value})} className="input"><option value="todos">Todos los estados</option><option>Recibido</option><option>En Diagnóstico</option><option>En Reparación</option><option>Esperando Refacción</option><option>Listo</option></select>
        <button onClick={cargarEquipos} className="btn-secondary">Actualizar</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipos.map((eq: any) => (
          <div key={eq.id} className={`border rounded-xl p-4 cursor-pointer ${getColor(eq.fecha_promesa)}`} onClick={() => abrirModal(eq.id)}>
            <div className="flex justify-between"><span className="font-mono text-sm">{eq.folio}</span><span className="text-xs">{eq.estado}</span></div>
            <div className="font-bold mt-1">{eq.clientes?.nombre}</div>
            <div className="text-sm text-gray-300">{eq.marca_modelo}</div>
            <div className="text-xs text-gray-400 mt-2">Promesa: {eq.fecha_promesa}</div>
          </div>
        ))}
      </div>
      {modalOpen && selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 w-full max-w-4xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 p-4 border-b flex justify-between"><h3 className="text-xl font-bold">{selected.folio}</h3><button onClick={() => setModalOpen(false)} className="text-white">Cerrar</button></div>
            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div><label>Cliente</label><input type="text" value={selected.clientes?.nombre} onChange={e => guardarCambio('cliente_nombre', e.target.value)} className="input w-full" /></div>
                <div><label>Teléfono</label><input type="text" value={selected.clientes?.telefono} onChange={e => guardarCambio('cliente_telefono', e.target.value)} className="input w-full" /></div>
                <div><label>Equipo</label><input type="text" value={`${selected.tipo_dispositivo} - ${selected.marca_modelo}`} disabled className="input w-full" /></div>
                <div><label>Fecha promesa</label><input type="date" value={selected.fecha_promesa} onChange={e => guardarCambio('fecha_promesa', e.target.value)} className="input w-full" /></div>
                <div><label>Costo estimado</label><input type="number" step="0.01" value={selected.costo_estimado || ''} onChange={e => guardarCambio('costo_estimado', e.target.value)} className="input w-full" /></div>
                <div><label>Estado</label><select value={selected.estado} onChange={e => guardarCambio('estado', e.target.value)} className="input w-full"><option>Recibido</option><option>En Diagnóstico</option><option>En Reparación</option><option>Esperando Refacción</option><option>Listo</option><option>Entregado</option></select></div>
                <div><label>Técnico asignado</label><input type="text" value={selected.tecnico_asignado || ''} onChange={e => guardarCambio('tecnico_asignado', e.target.value)} className="input w-full" /></div>
                <div><label>YouTube ID (Live)</label><input type="text" value={selected.youtube_id || ''} onChange={e => guardarCambio('youtube_id', e.target.value)} className="input w-full" /></div>
              </div>
              <div><label>Falla reportada</label><textarea value={selected.falla_reportada} onChange={e => guardarCambio('falla_reportada', e.target.value)} rows={2} className="input w-full" /></div>
              <div><label>Seguimiento (cliente)</label><textarea value={selected.seguimiento_cliente || ''} onChange={e => guardarCambio('seguimiento_cliente', e.target.value)} rows={3} className="input w-full" /></div>
              <div><label>Notas internas</label><textarea value={selected.notas_internas || ''} onChange={e => guardarCambio('notas_internas', e.target.value)} rows={3} className="input w-full" /></div>
              <div><label>Fotos de seguimiento</label><input type="file" multiple accept="image/*" onChange={e => setNuevasFotos(Array.from(e.target.files || []))} /><button onClick={subirFotos} className="btn-primary mt-2">Subir fotos</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}