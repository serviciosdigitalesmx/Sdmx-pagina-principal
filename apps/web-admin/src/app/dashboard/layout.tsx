'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { AppShell, ShellContent } from '@/components/base/app-shell';
import { LoadingState, ErrorState } from '@/components/base/states';
import { isAuthenticated, getStoredUser } from '@/lib/auth';
import { TenantIdentityProvider } from '@/providers/TenantIdentityProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(getStoredUser());
  const [menuOpen, setMenuOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      setAuthError('Necesitas iniciar sesión para acceder al panel.');
    } else {
      setUser(getStoredUser());
      setAuthError(null);
    }
  }, [router, pathname]);

  if (!user) {
    return authError ? (
      <AppShell>
        <ShellContent className="flex min-h-screen items-center justify-center">
          <ErrorState message={authError} />
        </ShellContent>
      </AppShell>
    ) : (
      <AppShell>
        <ShellContent className="flex min-h-screen items-center justify-center">
          <LoadingState label="Cargando sesión..." />
        </ShellContent>
      </AppShell>
    );
  }

  return (
    <TenantIdentityProvider>
      <AppShell>
        <div className="flex min-h-screen">
          <Sidebar mobileOpen={menuOpen} onMobileOpenChange={setMenuOpen} />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <Header user={user} onMenuClick={() => setMenuOpen(true)} />
            <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
              <div className="mx-auto w-full max-w-[1800px]">
                {children}
              </div>
            </main>
          </div>
        </div>
      </AppShell>
    </TenantIdentityProvider>
  );
}
