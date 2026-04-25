'use client';
import Nav from '@/components/Nav';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function Page(){
  const [bucket,setBucket]=useState('evidences');const [path,setPath]=useState('');const [out,setOut]=useState('');
  const sign=async()=>{const token=localStorage.getItem('sdmx_access_token')||'';const data=await api('/api/evidences/signed-upload',{method:'POST',body:JSON.stringify({bucket,path,expiresInSeconds:600})},token);setOut(JSON.stringify(data,null,2));};
  return <main><Nav/><section className='card'><h2>Evidencias / Storage</h2><input value={bucket} onChange={(e)=>setBucket(e.target.value)} /><input value={path} onChange={(e)=>setPath(e.target.value)} placeholder='tenant/file.jpg'/><button onClick={sign}>Firmar upload</button><pre>{out}</pre></section></main>
}
