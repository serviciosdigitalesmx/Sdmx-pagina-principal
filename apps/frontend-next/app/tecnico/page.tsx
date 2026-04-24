'use client';
import Nav from '@/components/Nav';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function Page(){
  const [id,setId]=useState('');const [out,setOut]=useState('');
  const load=async()=>{const token=localStorage.getItem('sdmx_access_token')||'';const data=await api(`/api/service-orders/${id}/timeline`,{},token);setOut(JSON.stringify(data,null,2));};
  return <main><Nav/><section className='card'><h2>Técnico / Timeline</h2><input value={id} onChange={(e)=>setId(e.target.value)} placeholder='Service order id'/><button onClick={load}>Consultar</button><pre>{out}</pre></section></main>
}
