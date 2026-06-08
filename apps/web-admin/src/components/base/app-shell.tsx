'use client';

import type { ReactNode } from 'react';

export function AppShell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`shell-surface min-h-screen text-srf-text ${className}`}>
      {children}
    </div>
  );
}

export function ShellContent({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-[1800px] px-4 py-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

