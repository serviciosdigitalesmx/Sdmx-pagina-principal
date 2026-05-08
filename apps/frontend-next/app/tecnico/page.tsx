'use client';
import dynamic from 'next/dynamic';

const TecnicoPageClient = dynamic(() => import('./TecnicoPageClient'), { ssr: false });

export default function TecnicoPage() {
  return <TecnicoPageClient />;
}
