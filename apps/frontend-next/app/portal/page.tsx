'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function Page(){
  const [folio,setFolio]=useState('');const [out,setOut]=useState('');
  const load=async()=>{const data=await api(`/api/portal/orders/${folio}`);setOut(JSON.stringify(data,null,2));};
  return <main><section className='card'><h2>Portal cliente por folio</h2><input value={folio} onChange={(e)=>setFolio(e.target.value)} placeholder='Folio'/><button onClick={load}>Consultar</button><pre>{out}</pre></section></main>
}
