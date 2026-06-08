'use client';

import type { ReactNode } from 'react';

export function LoadingState({
  label = 'Cargando...',
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-white/10 bg-white/5">
      <div className="flex items-center gap-3 text-srf-muted">
        <div className="spinner h-5 w-5" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}

export function ErrorState({
  title = 'No se pudo cargar la vista',
  message,
  action,
}: {
  title?: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-100">
      <div className="font-semibold">{title}</div>
      <div className="mt-2 text-red-100/80">{message}</div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
