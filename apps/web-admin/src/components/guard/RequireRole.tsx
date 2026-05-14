"use client";

import React from 'react';
import { useAuth, type Role } from './use-auth';

function Forbidden() {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
      <div className="text-lg font-semibold">403 Forbidden</div>
      <div className="mt-2 text-sm">No tienes permisos para ver esta sección.</div>
    </div>
  );
}

export function RequireRole({
  allowed,
  children,
}: {
  allowed: Role[];
  children: React.ReactNode;
}) {
  const { role } = useAuth();

  if (!allowed.includes(role)) {
    return <Forbidden />;
  }

  return <>{children}</>;
}
