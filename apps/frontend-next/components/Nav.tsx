import Link from 'next/link';

export default function Nav() {
  return (
    <nav className="card nav">
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/recepcion">Recepción</Link>
      <Link href="/clientes">Clientes</Link>
      <Link href="/tecnico">Técnico</Link>
      <Link href="/cotizaciones">Cotizaciones</Link>
      <Link href="/portal">Portal</Link>
      <Link href="/evidencias">Evidencias</Link>
    </nav>
  );
}
