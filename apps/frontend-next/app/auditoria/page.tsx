import Nav from '@/components/Nav';
import ProtectedData from '@/components/ProtectedData';

export default function AuditoriaPage() {
  return (
    <main>
      <Nav />
      <section className="card">
        <h2>Auditoría interna</h2>
        <p>Últimos eventos de auditoría por tenant.</p>
        <ProtectedData endpoint="/api/admin/audit-events" queryKey={['audit-events']} />
      </section>
    </main>
  );
}
