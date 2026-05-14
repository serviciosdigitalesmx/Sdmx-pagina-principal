"use client";

import Link from 'next/link';
import React from 'react';
import { useAuth, type Role } from './use-auth';

interface ProtectedLinkProps {
  to: string;
  label: string;
  allowedRoles: Role[];
  className?: string;
}

export function ProtectedLink({ to, label, allowedRoles, className }: ProtectedLinkProps) {
  const { role } = useAuth();

  if (!allowedRoles.includes(role)) {
    return null;
  }

  return (
    <Link href={to} className={className}>
      {label}
    </Link>
  );
}
