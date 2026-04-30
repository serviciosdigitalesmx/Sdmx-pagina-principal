"use client";

import { useEffect, useState } from "react";
import { apiFetch, DashboardHeader } from "../../../lib/runtime.js";

export default function ReportsPage() {
  const [report, setReport] = useState<{ summary?: { totalOrders: number; statusBreakdown: Record<string, number> }; orders?: Array<{ id: string; status: string; created_at: string }> } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch("/v1/reports/operational")
      .then(setReport)
      .catch((err) => setError(err.message));
  }, []);

  async function downloadCsv() {
    const csv = await apiFetch("/v1/reports/operational/csv");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "report-operational.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="shell">
      <DashboardHeader title="Reportes" subtitle="KPIs operativos y exportación CSV." />
      <div className="actions section">
        <button type="button" onClick={downloadCsv}>Descargar CSV</button>
      </div>
      {error ? <p>{error}</p> : null}
      {report?.summary ? (
        <div className="cards section">
          <div className="card"><strong>Órdenes</strong><p>{report.summary.totalOrders}</p></div>
          {Object.entries(report.summary.statusBreakdown).map(([status, count]) => (
            <div key={status} className="card"><strong>{status}</strong><p>{count}</p></div>
          ))}
        </div>
      ) : null}
    </main>
  );
}
