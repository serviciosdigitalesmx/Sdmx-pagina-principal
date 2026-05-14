const dashboardTitle = process.env.NEXT_PUBLIC_TENANT_DASHBOARD_TITLE ?? "Panel principal";
const dashboardMessage =
  process.env.NEXT_PUBLIC_TENANT_DASHBOARD_MESSAGE ?? "Bienvenido al entorno operativo del taller.";

export default function DashboardPage() {
  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <h2>{dashboardTitle}</h2>
      <p>{dashboardMessage}</p>
    </div>
  );
}
