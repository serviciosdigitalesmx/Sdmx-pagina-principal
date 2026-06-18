"use client";

import type { NormalizedDocument } from "@/lib/types";

type DocumentListProps = {
  documents: NormalizedDocument[];
};

function getDocumentLabel(type: NormalizedDocument["type"]) {
  if (type === "invoice") return "Factura";
  if (type === "warranty") return "Garantía";
  if (type === "diagnostic") return "Diagnóstico";
  return "Documento";
}

export function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) return null;

  return (
    <section className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.2)]">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Documentos</p>
      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-50">Archivos vinculados</h3>

      <div className="mt-5 space-y-3">
        {documents.map((doc) => (
          <a
            key={doc.id}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-slate-800 bg-slate-900/50 px-4 py-4 transition hover:border-sky-400/30 hover:bg-slate-900"
          >
            <div>
              <div className="text-sm font-semibold text-slate-50">{doc.name}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                {getDocumentLabel(doc.type)} · {doc.date.toLocaleDateString("es-MX")}
              </div>
            </div>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-300">
              Ver
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
