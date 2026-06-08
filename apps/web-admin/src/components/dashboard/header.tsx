'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ChevronDown, Building2, Menu } from 'lucide-react';
import { BranchSelector } from './branch-selector';
import { logout, getStoredTenant } from '@/lib/auth';
import type { User as UserType } from '@/types';

interface HeaderProps {
  user: UserType;
  onMenuClick?: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [tenantName, setTenantName] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const tenant = getStoredTenant();
    setTenantName(tenant?.name || 'Mi taller');
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const roleLabels: Record<string, string> = {
    owner: 'Dueño',
    manager: 'Gerente',
    technician: 'Técnico',
    client: 'Cliente',
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(15,15,15,0.72)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-srf-text transition hover:bg-white/10 lg:hidden"
            aria-label="Abrir navegación"
          >
            <Menu className="h-5 w-5" />
          </button>
          <BranchSelector />
          <Link
            href="/dashboard"
            className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-srf-muted transition hover:bg-white/10 hover:text-srf-text md:inline-flex"
            title="Volver al hub"
          >
            <Building2 className="h-4 w-4 text-srf-primary" />
            Hub
          </Link>
        </div>

        <div className="hidden min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-srf-muted md:flex">
          <Building2 className="h-4 w-4 text-srf-primary" />
          <span className="truncate">{tenantName || 'Mi taller'}</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-srf-primary/20">
              <User className="w-4 h-4 text-srf-primary" />
            </div>
            <div className="hidden text-left sm:block">
              <p className="max-w-40 truncate text-sm font-medium">{user.name || user.email}</p>
              <p className="text-xs text-srf-muted">{roleLabels[user.role] || user.role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-srf-muted" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[rgba(24,24,24,0.98)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <div className="border-b border-white/10 p-3">
                  <p className="text-sm font-medium truncate">{user.email}</p>
                  <p className="text-xs text-srf-muted mt-1">Tenant: {tenantName}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-srf-muted transition-colors hover:bg-srf-primary/10 hover:text-srf-text"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
