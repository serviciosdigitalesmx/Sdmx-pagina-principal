"use client";

import { useState } from "react";
import Image from "next/image";
import type { NormalizedAttachment } from "@/lib/types";

type EvidenceGalleryProps = {
  images: NormalizedAttachment[];
  videos: NormalizedAttachment[];
};

export function EvidenceGallery({ images, videos }: EvidenceGalleryProps) {
  const [selected, setSelected] = useState<NormalizedAttachment | null>(null);

  if (images.length === 0 && videos.length === 0) return null;

  return (
    <section className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.2)]">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Evidencias</p>
      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-50">Fotos y videos del proceso</h3>

      {images.length > 0 ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {images.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className="group overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-900/50 text-left transition hover:border-sky-400/30"
            >
              <div className="relative aspect-[4/3]">
                <Image src={item.url} alt={item.name} fill className="object-cover transition duration-300 group-hover:scale-[1.03]" />
              </div>
              <div className="p-4">
                <div className="text-sm font-semibold text-slate-50">{item.name}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{item.type}</div>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {videos.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {videos.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-[1.5rem] border border-slate-800 bg-black">
              <video src={item.url} controls className="h-full w-full" />
            </div>
          ))}
        </div>
      ) : null}

      {selected ? (
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 py-8"
        >
          <div className="max-h-[90vh] max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <Image src={selected.url} alt={selected.name} width={1400} height={1000} className="h-auto w-full object-contain" />
            <div className="border-t border-white/10 px-5 py-4 text-sm text-slate-200">{selected.name}</div>
          </div>
        </button>
      ) : null}
    </section>
  );
}
