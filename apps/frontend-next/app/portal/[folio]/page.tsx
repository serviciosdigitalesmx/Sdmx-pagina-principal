'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';

export default function PortalClientePage() {
  const { folio } = useParams();
  const [equipo, setEquipo] = useState<any>(null);
  const [error, setError] = useState('');
  const [dias, setDias] = useState<number | null>(null);
  const { get } = useApi();

  useEffect(() => {
    if (folio) {
      get(`/api/equipos/folio/${folio}`).then(setEquipo).catch(() => setError('Folio no encontrado'));
    }
  }, [folio]);

  useEffect(() => {
    if (equipo?.fecha_promesa) {
      const calculatedDias = Math.ceil((new Date(equipo.fecha_promesa).getTime() - new Date().getTime()) / (1000*3600*24));
      setDias(calculatedDias);
    }
  }, [equipo]);

  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!equipo) return <div className="p-8 text-center">Cargando...</div>;
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex justify-between"><h2 className="text-2xl font-mono text-blue-400">{equipo.folio}</h2><span className={`px-3 py-1 rounded-full text-sm ${equipo.estado==='Listo'?'bg-green-600':'bg-yellow-600'}`}>{equipo.estado}</span></div>
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div><span className="text-gray-400">Cliente:</span> {equipo.clientes?.nombre}</div>
          <div><span className="text-gray-400">Equipo:</span> {equipo.marca_modelo}</div>
          <div><span className="text-gray-400">Falla:</span> {equipo.falla_reportada}</div>
          <div><span className="text-gray-400">Promesa:</span> {equipo.fecha_promesa} {dias !== null ? (dias >= 0 ? `(faltan ${dias} días)` : '(atrasado)') : ''}</div>
          <div><span className="text-gray-400">Costo:</span> ${equipo.costo_estimado||'Por definir'}</div>
        </div>
        <div className="mt-6"><h3 className="font-bold">Seguimiento</h3><p className="bg-gray-700 p-3 rounded mt-2">{equipo.seguimiento_cliente||'Sin avances.'}</p></div>
        {equipo.youtube_id && <div className="mt-6 aspect-video"><iframe src={`https://www.youtube.com/embed/${equipo.youtube_id}`} className="w-full h-full" /></div>}
        {equipo.equipo_fotos?.length>0 && <div className="mt-6"><h3 className="font-bold">Fotos</h3><div className="grid grid-cols-2 gap-2 mt-2">{equipo.equipo_fotos.map((f:any)=><img key={f.id} src={f.url} className="rounded border" />)}</div></div>}
        <div className="mt-6 flex gap-4"><a href={`https://wa.me/${equipo.clientes?.telefono}?text=Hola, consulta sobre ${equipo.folio}`} className="bg-green-600 px-4 py-2 rounded">WhatsApp</a><button onClick={()=>window.print()} className="bg-gray-600 px-4 py-2 rounded">Imprimir</button></div>
      </div>
    </div>
  );
}
