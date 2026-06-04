'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ChevronDown, Building2 } from 'lucide-react';
import { BranchSelector } from './branch-selector';
import { logout, getStoredTenant } from '@/lib/auth';
import type { User as UserType } from '@/types';

interface HeaderProps {
  user: UserType;
}

export function Header({ user }: HeaderProps) {
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
    <header className="border-b border-srf-primary/30 bg-srf-bg/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: Page title placeholder */}
        <div className="flex items-center gap-4">
          <BranchSelector />
        </div>

        {/* Right: User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-srf-surface/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-srf-primary/20 flex items-center justify-center">
              <User className="w-4 h-4 text-srf-primary" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium">{user.name || user.email}</p>
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
              <div className="absolute right-0 mt-2 w-56 rounded-lg bg-srf-surface border border-srf-primary/30 shadow-lg z-50 overflow-hidden">
                <div className="p-3 border-b border-srf-primary/30">
                  <p className="text-sm font-medium truncate">{user.email}</p>
                  <p className="text-xs text-srf-muted mt-1">Tenant: {tenantName}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-srf-muted hover:bg-srf-primary/10 hover:text-srf-text transition-colors"
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