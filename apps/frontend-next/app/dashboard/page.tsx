import Nav from '@/components/Nav';
import ProtectedData from '@/components/ProtectedData';

export default function DashboardPage() {
  return (
    <main>
      <Nav />
      <section className="card"><h2>Contexto</h2><ProtectedData endpoint="/api/auth/me" /></section>
      <section className="card"><h2>Resumen</h2><ProtectedData endpoint="/api/dashboard/summary" /></section>
    </main>
  );
}
