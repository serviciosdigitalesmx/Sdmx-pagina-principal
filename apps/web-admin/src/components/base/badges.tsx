'use client';

import type { ReactNode } from 'react';

export function StatusBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
}) {
  const toneClass: Record<'neutral' | 'primary' | 'success' | 'warning' | 'danger', string> = {
    neutral: 'badge-neutral',
    primary: 'badge-recibido',
    success: 'badge-listo',
    warning: 'badge-diagnostico',
    danger: 'badge-cancelado',
  };

  return <span className={toneClass[tone]}>{children}</span>;
}
